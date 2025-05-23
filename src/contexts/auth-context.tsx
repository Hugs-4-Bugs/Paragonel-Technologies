
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation'; // Changed from 'next/navigation'

interface User {
  email: string;
  // Add other user properties as needed, e.g., name, id
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, redirectPath?: string) => void; // Simplified login for simulation
  logout: () => void;
  signup: (email: string, redirectPath?: string) => void; // Simulates signup and auto-login
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // To handle initial loading of auth state
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for persisted auth state on initial load
    try {
      const storedAuth = localStorage.getItem('isAuthenticated');
      const storedUser = localStorage.getItem('user');
      if (storedAuth === 'true' && storedUser) {
        setIsAuthenticated(true);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error reading auth state from localStorage:", error);
      // Clear potentially corrupted storage
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, redirectPath: string = '/') => {
    // Simulate successful login
    const simulatedUser: User = { email };
    setIsAuthenticated(true);
    setUser(simulatedUser);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(simulatedUser));
    console.log("SIMULATION: User logged in:", simulatedUser);

    const actionAfterLogin = localStorage.getItem('actionAfterLogin');
    localStorage.removeItem('actionAfterLogin'); // Clean up

    if (actionAfterLogin === 'applyJob') {
      router.push('/careers'); // Redirect to careers, user can click apply again
    } else {
      router.push(redirectPath);
    }
  };

  const signup = (email: string, redirectPath: string = '/') => {
    // Simulate successful signup and auto-login
    login(email, redirectPath); // Reuse login logic for auto-login
    console.log("SIMULATION: Signup confirmation email sent to:", email);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('actionAfterLogin'); // Clean up any pending actions
    console.log("SIMULATION: User logged out");
    router.push('/'); // Redirect to homepage on logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, logout, signup }}>
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
