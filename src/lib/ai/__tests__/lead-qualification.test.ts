/**
 * lead-qualification.test.ts — tests for the lead qualification module
 * (Prompt 05P §4–6, §8, §11).
 *
 * Covers: enquiry categories, lead-schema validation (valid/invalid/consent
 * enforcement/separate marketing consent), field merging, minimum-for-submission,
 * category routing, + the LinkedIn URL.
 */
import { describe, it, expect } from 'vitest';
import {
  leadSchema,
  ENQUIRY_CATEGORIES,
  ENQUIRY_CATEGORY_LABELS,
  LEAD_CATEGORIES,
  isLeadCategory,
  mergeCaptured,
  hasMinimumForSubmission,
  routeForCategory,
  COMPANY_LINKEDIN_URL,
  INITIAL_QUALIFICATION_STATE,
} from '../lead-qualification';

const VALID_LEAD = {
  name: 'Jane Doe',
  email: 'jane@acme.com',
  company: 'Acme Corp',
  role: 'CTO',
  enquiryCategory: 'ai_development' as const,
  businessProblem: 'We need an AI chatbot for customer support.',
  consentAcknowledged: true,
  marketingConsent: false,
  website: '',
};

describe('lead-qualification', () => {
  describe('categories', () => {
    it('has exactly the 10 enquiry categories', () => {
      expect(ENQUIRY_CATEGORIES).toHaveLength(10);
      expect(ENQUIRY_CATEGORIES).toContain('new_business');
      expect(ENQUIRY_CATEGORIES).toContain('acquisitionos_beta');
      expect(ENQUIRY_CATEGORIES).toContain('career');
      expect(ENQUIRY_CATEGORIES).toContain('general');
    });
    it('every category has a label', () => {
      for (const c of ENQUIRY_CATEGORIES) {
        expect(ENQUIRY_CATEGORY_LABELS[c]).toBeTruthy();
      }
    });
    it('LEAD_CATEGORIES excludes general + career (not sales leads)', () => {
      expect(isLeadCategory('general')).toBe(false);
      expect(isLeadCategory('career')).toBe(false);
      expect(isLeadCategory('new_business')).toBe(true);
      expect(isLeadCategory('acquisitionos_beta')).toBe(true);
      expect(isLeadCategory('investor')).toBe(true);
    });
  });

  describe('leadSchema validation', () => {
    it('accepts a valid lead', () => {
      const r = leadSchema.safeParse(VALID_LEAD);
      expect(r.success).toBe(true);
    });

    it('rejects a missing name', () => {
      const r = leadSchema.safeParse({ ...VALID_LEAD, name: 'a' });
      expect(r.success).toBe(false);
    });

    it('rejects an invalid email', () => {
      const r = leadSchema.safeParse({ ...VALID_LEAD, email: 'not-an-email' });
      expect(r.success).toBe(false);
    });

    it('rejects a short businessProblem', () => {
      const r = leadSchema.safeParse({ ...VALID_LEAD, businessProblem: 'too short' });
      expect(r.success).toBe(false);
    });

    it('rejects consentAcknowledged=false (cannot bypass consent server-side)', () => {
      const r = leadSchema.safeParse({ ...VALID_LEAD, consentAcknowledged: false });
      expect(r.success).toBe(false);
    });

    it('rejects enquiryCategory=general (not a lead)', () => {
      const r = leadSchema.safeParse({ ...VALID_LEAD, enquiryCategory: 'general' });
      expect(r.success).toBe(false);
    });

    it('rejects enquiryCategory=career (not a lead)', () => {
      const r = leadSchema.safeParse({ ...VALID_LEAD, enquiryCategory: 'career' });
      expect(r.success).toBe(false);
    });

    it('marketingConsent is optional + defaults to false (never bundled)', () => {
      const rest = { ...VALID_LEAD };
      delete rest.marketingConsent;
      const r = leadSchema.safeParse(rest);
      expect(r.success).toBe(true);
      expect(r.data?.marketingConsent).toBe(false);
    });

    it('rejects an oversized businessProblem', () => {
      const r = leadSchema.safeParse({ ...VALID_LEAD, businessProblem: 'x'.repeat(2001) });
      expect(r.success).toBe(false);
    });

    it('rejects an oversized name', () => {
      const r = leadSchema.safeParse({ ...VALID_LEAD, name: 'x'.repeat(101) });
      expect(r.success).toBe(false);
    });

    it('accepts optional fields (company, role, budget, timeline) as empty strings', () => {
      const r = leadSchema.safeParse({
        ...VALID_LEAD,
        company: '', role: '', budget: '', timeline: '', preferredContact: '', additionalInfo: '',
      });
      expect(r.success).toBe(true);
    });

    it('normalizes email to lowercase', () => {
      const r = leadSchema.safeParse({ ...VALID_LEAD, email: 'JANE@ACME.COM' });
      expect(r.success).toBe(true);
      expect(r.data?.email).toBe('jane@acme.com');
    });
  });

  describe('mergeCaptured', () => {
    it('merges non-empty string fields', () => {
      const merged = mergeCaptured({ name: 'Old' }, { name: 'New', email: 'a@b.com' });
      expect(merged.name).toBe('New');
      expect(merged.email).toBe('a@b.com');
    });
    it('does NOT overwrite with empty/whitespace values', () => {
      const merged = mergeCaptured({ name: 'Jane' }, { name: '  ', email: '' });
      expect(merged.name).toBe('Jane');
      expect(merged.email).toBeUndefined();
    });
    it('handles undefined incoming', () => {
      const merged = mergeCaptured({ name: 'Jane' }, undefined);
      expect(merged.name).toBe('Jane');
    });
  });

  describe('hasMinimumForSubmission', () => {
    it('false when missing name/email/businessProblem', () => {
      expect(hasMinimumForSubmission({})).toBe(false);
      expect(hasMinimumForSubmission({ name: 'Jane' })).toBe(false);
      expect(hasMinimumForSubmission({ name: 'Jane', email: 'a@b.com' })).toBe(false);
    });
    it('true when name + email + businessProblem present', () => {
      expect(hasMinimumForSubmission({ name: 'Jane', email: 'a@b.com', businessProblem: 'Need help' })).toBe(true);
    });
  });

  describe('routeForCategory', () => {
    it('routes career to /careers', () => {
      expect(routeForCategory('career')).toEqual({ path: '/careers', label: 'Careers page' });
    });
    it('routes acquisitionos_beta to the product page', () => {
      expect(routeForCategory('acquisitionos_beta').path).toBe('/our-product/acquisitionos');
    });
    it('routes business enquiries to /contact', () => {
      expect(routeForCategory('new_business').path).toBe('/contact');
      expect(routeForCategory('partnership').path).toBe('/contact');
      expect(routeForCategory('investor').path).toBe('/contact');
    });
  });

  describe('LinkedIn URL + initial state', () => {
    it('uses the exact founder-supplied LinkedIn URL', () => {
      expect(COMPANY_LINKEDIN_URL).toBe('https://www.linkedin.com/company/paragonel.vercel.app/home/?viewAsMember=true');
    });
    it('initial qualification state is inactive + empty', () => {
      expect(INITIAL_QUALIFICATION_STATE.active).toBe(false);
      expect(INITIAL_QUALIFICATION_STATE.category).toBeNull();
      expect(INITIAL_QUALIFICATION_STATE.captured).toEqual({});
      expect(INITIAL_QUALIFICATION_STATE.stage).toBe('collecting');
    });
  });
});
