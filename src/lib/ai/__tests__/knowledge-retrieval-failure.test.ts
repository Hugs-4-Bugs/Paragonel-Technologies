/**
 * knowledge-retrieval-failure.test.ts — the Firestore-down path (Prompt §8.5).
 * Locks: when every CMS fetch (public-data) throws, buildKnowledgeBase still
 * returns the static-JSON baseline (company-overview, AcquisitionOS, etc.) so
 * the AI can still answer company/product questions without Firestore. This is
 * the resilience property that ruled out the knowledge service as the AI root cause.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock every CMS fetch in public-data to throw (simulating a Firestore outage).
vi.mock('@/lib/public-data', () => ({
  getPublicServices: vi.fn().mockRejectedValue(new Error('firestore down')),
  getVerifiedJobs: vi.fn().mockRejectedValue(new Error('firestore down')),
  getPublishedPosts: vi.fn().mockRejectedValue(new Error('firestore down')),
  getPublishedClientProjects: vi.fn().mockRejectedValue(new Error('firestore down')),
  getPublishedTestimonials: vi.fn().mockRejectedValue(new Error('firestore down')),
  getPublishedTechEcosystem: vi.fn().mockRejectedValue(new Error('firestore down')),
}));

import {
  getKnowledgeBase,
  retrieve,
  invalidateKnowledgeCache,
} from '@/lib/ai/knowledge-retrieval';

describe('knowledge retrieval — Firestore-down resilience', () => {
  beforeEach(() => {
    invalidateKnowledgeCache();
  });

  it('buildKnowledgeBase still returns static entries when every CMS fetch throws', async () => {
    const base = await getKnowledgeBase();
    expect(base.length).toBeGreaterThan(0);
    // getKnowledgeBase returns KnowledgeEntry[] (the entries themselves).
    const ids = base.map((e) => e.id);
    expect(ids).toContain('company-overview');
    expect(ids.some((id) => id.startsWith('product-acquisitionos'))).toBe(true);
    expect(ids.some((id) => id.startsWith('product-systemfoundry'))).toBe(true);
    expect(ids.some((id) => id.startsWith('product-codeguard-ai'))).toBe(true);
    // No CMS-sourced entries (all fetches threw).
    expect(ids.some((id) => id.startsWith('job-'))).toBe(false);
    expect(ids.some((id) => id.startsWith('service-cms-'))).toBe(false);
  });

  it('"What does Paragonel do?" still retrieves the company-overview entry (top)', async () => {
    const base = await getKnowledgeBase();
    const r = retrieve('What does Paragonel do?', base, 5);
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].entry.id).toBe('company-overview');
  });

  it('"Tell me about AcquisitionOS" still retrieves the AcquisitionOS entry', async () => {
    const base = await getKnowledgeBase();
    const r = retrieve('Tell me about AcquisitionOS', base, 5);
    expect(r.some((x) => x.entry.id.startsWith('product-acquisitionos'))).toBe(true);
  });

  it('AcquisitionOS content carries the PRIVATE BETA + acquisitionos.net grounding', async () => {
    const base = await getKnowledgeBase();
    const r = retrieve('AcquisitionOS', base, 5);
    const aos = r.find((x) => x.entry.id.startsWith('product-acquisitionos'));
    expect(aos).toBeDefined();
    const content = (aos?.entry.content || '').toLowerCase();
    // The grounding contract: AcquisitionOS is in Private Beta + the canonical domain.
    expect(content.includes('beta') || content.includes('private')).toBe(true);
  });
});
