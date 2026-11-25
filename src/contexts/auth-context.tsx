"use client";

/**
 * auth-context.tsx — thin client view of the SERVER-VERIFIED session.
 *
 * SECURITY MODEL (hardened):
 *   - The ONLY proof of authentication is a server-verified call to
 *     `GET /api/auth/me`, which reads the `qf_user_token` / `qf_admin_token`
 *     httpOnly cookie, validates the JWT against the Firestore `sessions/{sid}`
 *     revocation doc + the account doc's `tokenVersion`, and returns the
 *     caller's email/tier/role/permissions. See `src/lib/auth/sessions.ts`.
 *   - This context NEVER treats `localStorage`, a client flag, or an in-memory
 *     object as proof of authentication. There is no simulated user database
 *     and no hardcoded credential. `isAuthenticated` is `true` ONLY when
 *     `/api/auth/me` returned 200 within the current mount.
 *   - `login()` / `signup()` redirect to the real server-verified auth pages
 *     (`/auth/login`, `/auth/signup`) which perform CAPTCHA + consent + OTP +
 *     bcrypt verification server-side. They do NOT establish a session here.
 *   - `logout()` POSTs `/api/auth/logout`, which revokes the `sessions/{sid}`
 *     doc server-side and clears both httpOnly cookies — it does not merely
 *     clear frontend state.
 *
 * This file preserves the `useAuth()` contract (`isAuthenticated`, `user`,
 * `isLoading`, `login`, `logout`, `signup`) consumed by the navbar, the
 * careers apply flow, and the legacy `/profile` route (now a redirect to the
 * server-verified `/candidate/profile`).
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface User {
  uid: string;
  email: string;
  fullName?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string, redirectPath?: string) => void;
  logout: () => void;
  signup: (fullName: string, email: string, password?: string, redirectPath?: string) => void;
  /**
   * Re-check the server-verified session + update context state. Call this
   * after any flow that establishes or destroys a session (login, signup,
   * logout) so every consumer (navbar, careers guards) syncs to the fresh
   * state WITHOUT a full page reload. Returns the user or null.
   */
  refresh: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Refresh the server-verified session. Returns the user or null. Never throws
 * — a network/server failure is treated as "not authenticated" so the UI falls
 * back to the logged-out chrome rather than impersonating a session.
 */
async function fetchMe(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: { email?: string; name?: string; fullName?: string; tier?: string };
    };
    const email = data?.user?.email;
    if (!email) return null;
    return {
      uid: email,
      email,
      fullName: data.user?.name ?? data.user?.fullName,
    };
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // On mount (and only on mount) — establish the ONE source of truth.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = await fetchMe();
      if (cancelled) return;
      setIsAuthenticated(u !== null);
      setUser(u);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Expose a way for consumers (e.g. the navbar after a route-level login) to
  // re-check the server session without a full reload.
  const refresh = useCallback(async () => {
    const u = await fetchMe();
    setIsAuthenticated(u !== null);
    setUser(u);
    return u;
  }, []);

  const login = (_email: string, _password?: string, redirectPath: string = '/') => {
    // Delegate to the server-verified login page (CAPTCHA + consent + bcrypt +
    // session cookie are all handled there). We do NOT authenticate inline.
    const target = `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;
    router.push(target);
  };

  const signup = (fullName: string, email: string, password?: string, redirectPath?: string) => {
    // Delegate to the server-verified registration page (OTP email verification
    // is required before any account is created — see /api/auth/register/*).
    // The args are accepted to preserve the useAuth() contract; the real
    // OTP-gated registration flow lives at /auth/signup.
    void fullName;
    void email;
    void password;
    const target =
      '/auth/signup' + (redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : '');
    router.push(target);
  };

  const logout = async () => {
    // Revoke the server session + clear the httpOnly cookie. This is the real
    // invalidation — not a frontend flag flip.
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
    } catch {
      // Network failure: still clear local state + redirect; the cookie may
      // remain until it expires, but we never leave the UI showing "logged in".
    }
    // Refresh the server-verified session so every consumer (navbar, careers
    // guards) syncs to the logged-out state immediately. After the cookie is
    // cleared server-side, /api/auth/me returns 401 → refresh sets
    // isAuthenticated:false + user:null. This replaces the stale manual flip
    // that left the navbar showing "logged in" until the next full reload.
    await refresh();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout, signup, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
