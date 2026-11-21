/**
 * Submission security helpers (Phase 1B): input validation, rate limiting,
 * duplicate detection, and PII-safe client identification.
 *
 * Rate limiting and dedupe are in-memory and per-process. The dev/preview runs a
 * single Next.js instance, so this is sufficient for abuse protection here; a
 * multi-instance production deployment would move these to Redis. The shape of
 * the API is stable so that swap-in is straightforward.
 */
import { z } from 'zod';

/* ----------------------------- validation ----------------------------- */

/**
 * Consent notice + policy versions (Prompt 05F Contact consent work).
 *
 * These are SERVER-side constants — they are NOT accepted from the client
 * request body, so a submission cannot forge a different consent version. The
 * API route attaches the current versions + a server-captured UTC timestamp to
 * the stored lead as consent evidence (see /api/contact/route.ts).
 *
 * Bump the version when the consent wording or Privacy Policy materially
 * changes; existing stored leads retain the version under which they were
 * submitted (consent records are not silently overwritten).
 */
export const CONSENT_NOTICE_VERSION = '2026-11-21-v1';
export const PRIVACY_POLICY_VERSION = '2026-11-21-v1';
export const TERMS_VERSION = '2026-11-21-v1';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100, 'Name too long'),
  email: z.string().trim().toLowerCase().email('Valid email required').max(254),
  company: z.string().trim().max(100, 'Company too long').optional().or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(10, 'Please tell us a bit more (min 10 characters)')
    .max(2000, 'Message too long (max 2000 characters)'),
  // Mandatory acknowledgement that the user has read the Privacy Notice and
  // understands Paragonel will use the information to respond to and manage
  // the inquiry. Must be explicitly true — unchecked by default on the client,
  // and the refine() enforces it SERVER-side so a direct API call cannot
  // bypass it. This is an acknowledgement of the processing notice for the
  // inquiry (the lawful basis), NOT a bundling of marketing consent.
  consentAcknowledged: z
    .boolean()
    .refine((v) => v === true, 'Please acknowledge the Privacy Notice to submit your inquiry.'),
  // Optional, separate marketing consent. Never a condition of submission.
  // Recorded separately so a marketing message is never sent merely because an
  // inquiry was submitted.
  marketingConsent: z.boolean().optional().default(false),
  // Optional honeypot field — must be empty. Bots tend to fill hidden fields.
  website: z.string().max(0).optional().or(z.literal('')),
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Valid email required').max(254),
  website: z.string().max(0).optional().or(z.literal('')),
});

export const jobApplicationSchema = z.object({
  jobId: z.string().trim().min(1).max(100),
  jobTitle: z.string().trim().min(1).max(200),
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(4).max(32),
  primarySkills: z.string().trim().min(1).max(500),
  // Optional free-text fields with sane caps.
  coverLetter: z.string().trim().max(5000).optional().or(z.literal('')),
  linkedinProfile: z.string().trim().max(300).optional().or(z.literal('')),
  portfolioWebsite: z.string().trim().max(300).optional().or(z.literal('')),
  expectedSalary: z.string().trim().max(100).optional().or(z.literal('')),
  noticePeriod: z.string().trim().max(100).optional().or(z.literal('')),
  preferredJobLocation: z.string().trim().max(200).optional().or(z.literal('')),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;

/* --------------------------- client identity --------------------------- */

/**
 * Returns a client identifier for rate limiting. Prefers the leftmost forwarded
 * IP, falls back to a hashed user-agent. Raw IPs are never persisted to Firestore
 * or logs — only used transiently for rate-limit buckets.
 */
export function getClientId(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return `ip:${first}`;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return `ip:${realIp.trim()}`;
  const ua = request.headers.get('user-agent') || '';
  return `ua:${ua.slice(0, 64)}`;
}

/* ----------------------------- rate limit ----------------------------- */

interface Bucket {
  count: number;
  resetAt: number;
}

const RATE_WINDOWS: Record<string, { max: number; windowMs: number }> = {
  contact: { max: 5, windowMs: 10 * 60 * 1000 }, // 5 / 10 min / client
  newsletter: { max: 10, windowMs: 10 * 60 * 1000 },
  jobApplication: { max: 5, windowMs: 10 * 60 * 1000 },
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  route: keyof typeof RATE_WINDOWS,
  clientId: string
): { allowed: boolean; retryAfterMs: number } {
  const cfg = RATE_WINDOWS[route];
  const key = `${route}:${clientId}`;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + cfg.windowMs });
    return { allowed: true, retryAfterMs: cfg.windowMs };
  }
  if (b.count >= cfg.max) {
    return { allowed: false, retryAfterMs: b.resetAt - now };
  }
  b.count += 1;
  return { allowed: true, retryAfterMs: b.resetAt - now };
}

/* ------------------------------- dedupe ------------------------------- */

// Short-lived in-memory fingerprint cache to absorb accidental double-submits
// (e.g. double-click, retry). Window matches the expected "immediate retry" case.
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;
const fingerprints = new Map<string, number>(); // hash -> first-seen ts

export function isLikelyDuplicate(route: string, fingerprint: string): boolean {
  const key = `${route}:${fingerprint}`;
  const now = Date.now();
  const seen = fingerprints.get(key);
  // Periodic eviction.
  if (fingerprints.size > 1000) {
    for (const [k, t] of fingerprints) {
      if (now - t > DEDUPE_WINDOW_MS) fingerprints.delete(k);
    }
  }
  if (seen && now - seen < DEDUPE_WINDOW_MS) {
    return true;
  }
  fingerprints.set(key, now);
  return false;
}

/** Stable, non-crypto fingerprint of a submission for dedupe (not stored as PII). */
export function fingerprint(...parts: (string | undefined)[]): string {
  const s = parts.filter(Boolean).join('|').toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}
