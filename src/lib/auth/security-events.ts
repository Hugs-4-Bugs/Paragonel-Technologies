/**
 * security-events.ts — append-only security + admin audit log.
 *
 * Written via the Admin SDK (bypasses Firestore rules). Every auth-sensitive
 * action (login success/failure, OTP issued/verified/failed, rate-limit hit,
 * role change, suspend/reactivate, session revoke, bootstrap) writes a row.
 * Read-only via /api/admin/security-events (super_admin only).
 *
 * Never throws in a way that blocks a successful primary operation: a failed
 * audit log surfaces to stderr but does not revert the action.
 */
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { hashIp } from './crypto-utils';

export type SecurityEventType =
  | 'login_success' | 'login_failed'
  | 'otp_issued' | 'otp_verified' | 'otp_failed' | 'otp_expired'
  | 'rate_limited' | 'lockout'
  | 'register' | 'password_change' | 'password_reset'
  | 'bootstrap_attempt' | 'bootstrap_success'
  | 'recovery_attempt' | 'recovery_success' | 'recovery_failed' // Super Admin credential recovery
  | 'admin_created' | 'admin_invited' | 'role_changed'
  | 'admin_suspended' | 'admin_reactivated' | 'session_revoked'
  | 'unauthorized_access'
  | 'mfa_failed' | 'mfa_enrolled' | 'mfa_disabled' | 'mfa_disable_failed';

export interface SecurityEventInput {
  type: SecurityEventType;
  email?: string;
  ip?: string;
  detail?: string;
  /** who performed the action (for admin actions). */
  actor?: string;
}

export async function logSecurityEvent(ev: SecurityEventInput): Promise<void> {
  const db = getAdminDb();
  if (!db) {
    // No Admin SDK (e.g. misconfigured prod) — surface, never throw.
    console.warn('[security-events] Admin SDK unavailable; event not logged:', ev.type);
    return;
  }
  try {
    await db.collection('securityEvents').add({
      type: ev.type,
      email: ev.email ?? null,
      ipHash: ev.ip ? hashIp(ev.ip) : null,
      detail: ev.detail ?? null,
      actor: ev.actor ?? null,
      timestamp: Timestamp.now(),
    });
  } catch (e) {
    console.error('[security-events] write failed:', ev.type, e instanceof Error ? e.message : e);
  }
}
