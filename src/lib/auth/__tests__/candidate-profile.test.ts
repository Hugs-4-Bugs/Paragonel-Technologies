/**
 * candidate-profile.test.ts — profile schema + helpers (Prompt 05Q §7).
 *
 * Covers: schema validation (valid/invalid/required), completeness (honest,
 * never inflates), meetsApplicationMinimum (for job applications), consent
 * builders (registration + login, separate).
 */
import { describe, it, expect } from 'vitest';
import {
  candidateProfileSchema,
  profileCompleteness,
  meetsApplicationMinimum,
  buildRegistrationConsent,
  buildLoginConsent,
} from '../candidate-profile';

const VALID_PROFILE = {
  fullName: 'Jane Doe',
  phone: '+1 555 0100',
  currentLocation: 'Bengaluru, IN',
  preferredJobLocation: 'Bengaluru, IN',
  headline: 'Senior Backend Engineer',
  summary: '8 years building distributed systems.',
  totalExperienceYears: 8,
  currentDesignation: 'Senior Engineer',
  skills: ['Go', 'Kubernetes', 'PostgreSQL'],
  education: [{ qualification: 'B.Tech', institution: 'IIT', year: '2015' }],
  preferredRoles: ['Staff Engineer'],
  preferredEmploymentType: 'full-time',
  workModePreference: 'remote',
};

describe('candidate-profile (Prompt 05Q §7)', () => {
  describe('candidateProfileSchema', () => {
    it('accepts a valid full profile', () => {
      expect(candidateProfileSchema.safeParse(VALID_PROFILE).success).toBe(true);
    });

    it('accepts a minimal profile (only fullName) — does not force optional fields', () => {
      const r = candidateProfileSchema.safeParse({ fullName: 'Jane' });
      expect(r.success).toBe(true);
    });

    it('rejects a missing fullName', () => {
      const r = candidateProfileSchema.safeParse({ phone: '123' });
      expect(r.success).toBe(false);
    });

    it('rejects a short fullName', () => {
      const r = candidateProfileSchema.safeParse({ fullName: 'J' });
      expect(r.success).toBe(false);
    });

    it('rejects an invalid URL', () => {
      const r = candidateProfileSchema.safeParse({ fullName: 'Jane', linkedinUrl: 'not-a-url' });
      expect(r.success).toBe(false);
    });

    it('rejects an oversized summary', () => {
      const r = candidateProfileSchema.safeParse({ fullName: 'Jane', summary: 'x'.repeat(5001) });
      expect(r.success).toBe(false);
    });

    it('rejects an invalid employment type enum', () => {
      const r = candidateProfileSchema.safeParse({ fullName: 'Jane', preferredEmploymentType: 'gig' });
      expect(r.success).toBe(false);
    });

    it('rejects an invalid work mode enum', () => {
      const r = candidateProfileSchema.safeParse({ fullName: 'Jane', workModePreference: 'flex' });
      expect(r.success).toBe(false);
    });

    it('coerces totalExperienceYears from a string', () => {
      const r = candidateProfileSchema.safeParse({ fullName: 'Jane', totalExperienceYears: '8' });
      expect(r.success).toBe(true);
      expect(r.data?.totalExperienceYears).toBe(8);
    });

    it('rejects an out-of-range experience value', () => {
      const r = candidateProfileSchema.safeParse({ fullName: 'Jane', totalExperienceYears: 99 });
      expect(r.success).toBe(false);
    });
  });

  describe('profileCompleteness (honest, never inflates)', () => {
    it('returns 0 for an empty profile', () => {
      expect(profileCompleteness({})).toBe(0);
    });

    it('returns 0 for null', () => {
      expect(profileCompleteness(null)).toBe(0);
    });

    it('returns 100 for a fully complete profile', () => {
      expect(profileCompleteness(VALID_PROFILE)).toBe(100);
    });

    it('returns a partial percentage for a partial profile', () => {
      const pct = profileCompleteness({ fullName: 'Jane', phone: '123' });
      expect(pct).toBeGreaterThan(0);
      expect(pct).toBeLessThan(100);
    });

    it('does not count empty strings or empty arrays as filled', () => {
      const pct = profileCompleteness({ fullName: 'Jane', skills: [], summary: '', phone: '' });
      // Only fullName counts → 1/13 fields.
      expect(pct).toBeLessThan(20);
    });
  });

  describe('meetsApplicationMinimum', () => {
    it('false for null/empty', () => {
      expect(meetsApplicationMinimum(null)).toBe(false);
      expect(meetsApplicationMinimum({})).toBe(false);
    });

    it('false with only a name', () => {
      expect(meetsApplicationMinimum({ fullName: 'Jane' })).toBe(false);
    });

    it('true with name + phone + a skill', () => {
      expect(meetsApplicationMinimum({ fullName: 'Jane', phone: '123', skills: ['Go'] })).toBe(true);
    });

    it('true with name + location + headline', () => {
      expect(meetsApplicationMinimum({ fullName: 'Jane', currentLocation: 'IN', headline: 'Eng' })).toBe(true);
    });
  });

  describe('consent builders', () => {
    it('buildRegistrationConsent attaches server-side versions + timestamp', () => {
      const c = buildRegistrationConsent(true);
      expect(c.acknowledged).toBe(true);
      expect(c.termsVersion).toBeTruthy();
      expect(c.privacyVersion).toBeTruthy();
      expect(c.consentNoticeVersion).toBeTruthy();
      expect(c.timestampUtc).toBeTruthy();
    });

    it('buildLoginConsent is SEPARATE from registration consent', () => {
      const reg = buildRegistrationConsent(true);
      const login = buildLoginConsent(true);
      // Login consent has loginAt; registration has consentNoticeVersion — distinct shapes.
      expect(login).toHaveProperty('loginAt');
      expect(reg).toHaveProperty('consentNoticeVersion');
      expect(login).not.toHaveProperty('consentNoticeVersion');
    });
  });
});
