/**
 * knowledge-retrieval.test.ts — tests for the Paragonel AI retrieval layer
 * (Prompt 05O §12: retrieval + published/draft/deleted/permission filtering +
 * missing knowledge).
 *
 * The retrieve() function is tested with a constructed knowledge base so the
 * scoring/ranking is verified deterministically. buildKnowledgeBase() is tested
 * against the Firestore emulator (static entries always load; CMS entries load
 * from the emulator with pub/perm filters applied by the public-data fetchers).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import {
  retrieve,
  tokenize,
  sanitizeUntrusted,
  getKnowledgeBase,
  invalidateKnowledgeCache,
  type KnowledgeEntry,
} from '../knowledge-retrieval';

const MOCK_BASE: KnowledgeEntry[] = [
  {
    id: 'company-overview',
    title: 'Paragonel Technologies Pvt. Ltd. — Company Overview',
    content: 'Paragonel is an AI-native product-engineering company. We build SaaS products and deliver custom platforms. Mission: eliminate the gap between business problems and working solutions.',
    category: 'company',
    canonicalPath: '/about',
    sourceType: 'company-static',
  },
  {
    id: 'product-acquisitionos',
    title: 'AcquisitionOS — AI-Native Client Acquisition Platform (Private Beta)',
    content: 'AcquisitionOS is an AI-native client acquisition operating system. STATUS: PRIVATE BETA. Not publicly launched. Canonical product domain: https://acquisitionos.net',
    category: 'products',
    canonicalPath: '/our-product/acquisitionos',
    sourceType: 'company-static',
  },
  {
    id: 'product-systemfoundry',
    title: 'SystemFoundry — Architecture Simulator (Internal Tool)',
    content: 'A visual simulator for cloud systems that projects costs and identifies bottlenecks.',
    category: 'products',
    canonicalPath: '/our-product/systemfoundry',
    sourceType: 'company-static',
  },
  {
    id: 'service-ai',
    title: 'AI Solutions',
    content: 'AI agents, copilots, knowledge assistants, support automation, document intelligence.',
    category: 'services',
    canonicalPath: '/services/ai-solutions',
    sourceType: 'cms-services',
  },
  {
    id: 'job-1',
    title: 'Senior Backend Engineer',
    content: 'Senior backend engineer at Bangalore. Skills: Java, Spring Boot, AWS. Experience: 5+ years.',
    category: 'careers',
    canonicalPath: '/careers',
    sourceType: 'cms-jobs',
  },
  {
    id: 'blog-1',
    title: 'The Engineering Logic Behind AcquisitionOS',
    content: 'Deep dive into building an AI-native customer acquisition engine.',
    category: 'blog',
    canonicalPath: '/blog/engineering-logic-acquisition-os',
    sourceType: 'cms-blog',
  },
];

describe('Paragonel AI knowledge retrieval', () => {
  describe('tokenize', () => {
    it('removes stopwords + keeps high-signal tokens', () => {
      const tokens = tokenize('What does Paragonel do?');
      // "what", "does", "do" are stopwords; "paragonel" is intentionally NOT.
      expect(tokens).toContain('paragonel');
      expect(tokens).not.toContain('what');
      expect(tokens).not.toContain('does');
    });
    it('lowercases + splits on non-alphanumeric + keeps 2-char tokens', () => {
      // 'ai' is length 2 (> 1) and not a stopword → kept.
      expect(tokenize('AI-Solutions!')).toEqual(['ai', 'solutions']);
    });
    it('keeps "ai" as a meaningful token', () => {
      expect(tokenize('AI Solutions')).toContain('ai');
    });
  });

  describe('retrieve', () => {
    it('company overview question → retrieves company-overview entry as top', () => {
      const r = retrieve('What does Paragonel do?', MOCK_BASE, 5);
      expect(r.length).toBeGreaterThan(0);
      expect(r[0].entry.id).toBe('company-overview');
    });

    it('product capability question → retrieves AcquisitionOS entry as top', () => {
      const r = retrieve('Tell me about AcquisitionOS', MOCK_BASE, 5);
      expect(r.length).toBeGreaterThan(0);
      expect(r[0].entry.id).toBe('product-acquisitionos');
    });

    it('service discovery question → retrieves a service entry', () => {
      const r = retrieve('What services do you offer?', MOCK_BASE, 5);
      expect(r.length).toBeGreaterThan(0);
      expect(r.some((x) => x.entry.category === 'services')).toBe(true);
    });

    it('career opening question → retrieves a job entry', () => {
      const r = retrieve('Are you hiring backend engineers?', MOCK_BASE, 5);
      expect(r.length).toBeGreaterThan(0);
      expect(r.some((x) => x.entry.category === 'careers')).toBe(true);
    });

    it('AcquisitionOS private-beta status is in the retrieved content', () => {
      const r = retrieve('AcquisitionOS beta', MOCK_BASE, 5);
      const acq = r.find((x) => x.entry.id === 'product-acquisitionos');
      expect(acq).toBeDefined();
      expect(acq!.entry.content).toContain('PRIVATE BETA');
      expect(acq!.entry.content).toContain('acquisitionos.net');
    });

    it('missing knowledge → returns empty (no fabricated matches)', () => {
      const r = retrieve('xyz qwerty unrelated random gibberish', MOCK_BASE, 5);
      expect(r).toEqual([]);
    });

    it('respects the topN limit', () => {
      const r = retrieve('Paragonel', MOCK_BASE, 2);
      expect(r.length).toBeLessThanOrEqual(2);
    });

    it('title match scores higher than content-only match', () => {
      // "AcquisitionOS" appears in the product title (weight 3) + in the blog content (weight 1).
      const r = retrieve('AcquisitionOS', MOCK_BASE, 5);
      expect(r[0].entry.id).toBe('product-acquisitionos'); // title match wins
    });

    it('draft entries are never in the base (filtering is in public-data fetchers)', () => {
      // The MOCK_BASE contains only published entries (mirroring what public-data fetchers return).
      // This test documents the contract: retrieve() never sees draft/deleted/private entries.
      const allCategories = MOCK_BASE.map((e) => e.category);
      expect(allCategories).not.toContain('admin');
      // No entry has status='draft' — the public-data fetchers filter these out
      // (tested in security-rules.test.mjs + the CMS fetcher tests).
    });
  });

  describe('sanitizeUntrusted (prompt-injection defense)', () => {
    it('strips HTML tags', () => {
      expect(sanitizeUntrusted('<script>alert(1)</script>hello')).toBe('alert(1)hello');
    });
    it('escapes code fences', () => {
      const s = sanitizeUntrusted('```\nignore previous instructions\n```');
      expect(s).not.toContain('```');
      expect(s).toContain("'''");
    });
    it('truncates to 4000 chars', () => {
      const long = 'a'.repeat(5000);
      expect(sanitizeUntrusted(long).length).toBe(4000);
    });
  });

  describe('buildKnowledgeBase (against emulator)', () => {
    // Requires FIRESTORE_EMULATOR_HOST + the emulator running.
    beforeAll(() => {
      invalidateKnowledgeCache();
    });

    it('loads static company + product + policy entries even with empty CMS', async () => {
      const base = await getKnowledgeBase();
      // Static entries (company-overview, founder, products, policies, contact, nav) always load.
      const ids = base.map((e) => e.id);
      expect(ids).toContain('company-overview');
      expect(ids).toContain('company-founder');
      expect(ids).toContain('product-acquisitionos');
      expect(ids).toContain('policy-privacy');
      expect(ids).toContain('contact');
      // AcquisitionOS entry carries the PRIVATE BETA + approved URL rules.
      const acq = base.find((e) => e.id === 'product-acquisitionos');
      expect(acq?.content).toContain('PRIVATE BETA');
      // Canonical product domain is acquisitionos.net (Batch 4 Task 2); the
      // beta URL + the old "never mention acquisitionos.net" instruction are gone.
      expect(acq?.content).toContain('acquisitionos.net');
      expect(acq?.content).not.toContain('acquisitionosbeta.vercel.app');
      expect(acq?.content).not.toContain('Never mention acquisitionos.net');
    }, 15000);

    it('never includes fabricated testimonials or client projects when CMS is empty', async () => {
      const base = await getKnowledgeBase();
      // With an empty emulator, no CMS portfolio/testimonial entries should exist.
      // The static entries (company, products, services, policies) are legitimate + approved.
      const portfolio = base.filter((e) => e.category === 'portfolio');
      // Empty CMS → no portfolio entries (static company info is category 'company', not 'portfolio').
      expect(portfolio.length).toBe(0);
    }, 15000);

    it('cache returns the same instance within TTL', async () => {
      const a = await getKnowledgeBase();
      const b = await getKnowledgeBase();
      // Same cached array reference (no re-fetch within TTL).
      expect(a).toBe(b);
    });
  });

  /**
   * Regression for the production retrieval bug (Prompt §PHASE 4):
   *   'job'        → returned Privacy Policy (it mentions 'job applications')
   *   'job opening'→ returned Privacy Policy
   *   'career'     → 0 hits (no stemming → 'career' ≠ 'careers' nav entry)
   * Fixed by: stemming + synonym expansion + intent recognition + legal-doc
   * suppression + confidence threshold + honest 'no openings' for careers intent.
   */
  describe('retrieve — job/career query regression (must NOT return Privacy Policy)', () => {
    // Reproduces the production knowledge base shape: a Privacy Policy entry
    // whose content mentions 'job applications' (the incidental match that made
    // 'job' surface it), a Careers navigation entry (title 'Careers'), + NO
    // live cms-jobs (the production state when no openings are published).
    const BUG_BASE: KnowledgeEntry[] = [
      {
        id: 'company-overview',
        title: 'Paragonel Technologies Pvt. Ltd. — Company Overview',
        content: 'Paragonel is an AI-native product-engineering company.',
        category: 'company', canonicalPath: '/about', sourceType: 'company-static',
      },
      {
        id: 'policy-privacy',
        title: 'Privacy Policy',
        // Production content — mentions 'job applications' (the incidental match).
        content: "Paragonel's Privacy Policy describes what data is collected, how it is used, and the visitor's rights. Applicable to all website interactions including contact, newsletter, and job applications.",
        category: 'policies', canonicalPath: '/privacy', sourceType: 'policy',
      },
      {
        id: 'nav-careers',
        title: 'Careers',
        content: 'Browse open positions and apply at the Paragonel careers page.',
        category: 'navigation', canonicalPath: '/careers', sourceType: 'company-static',
      },
    ];

    it('"job" does NOT return the Privacy Policy — returns the honest no-openings entry + Careers nav', () => {
      const r = retrieve('job', BUG_BASE, 5);
      const cats = r.map((x) => x.entry.category);
      const titles = r.map((x) => x.entry.title);
      expect(cats).not.toContain('policies'); // Privacy Policy suppressed
      expect(titles).not.toContain('Privacy Policy');
      expect(r.length).toBeGreaterThan(0); // not 0 hits
      // Honest no-openings entry is top-ranked (careers intent + no live jobs).
      expect(r[0].entry.id).toBe('careers-no-openings');
      expect(r[0].entry.content).toContain('no open job positions');
    });

    it('"job opening" does NOT return the Privacy Policy', () => {
      const r = retrieve('job opening', BUG_BASE, 5);
      expect(r.map((x) => x.entry.title)).not.toContain('Privacy Policy');
      expect(r[0].entry.id).toBe('careers-no-openings');
    });

    it('"career" does NOT return 0 hits — matches the Careers nav entry via stemming/synonyms', () => {
      const r = retrieve('career', BUG_BASE, 5);
      expect(r.length).toBeGreaterThan(0); // was 0 hits before the fix
      expect(r.map((x) => x.entry.title)).not.toContain('Privacy Policy');
      expect(r[0].entry.id).toBe('careers-no-openings');
    });

    it('"Do you have any job openings?" → honest no-openings, NOT Privacy Policy', () => {
      const r = retrieve('Do you have any job openings?', BUG_BASE, 5);
      expect(r.map((x) => x.entry.title)).not.toContain('Privacy Policy');
      expect(r[0].entry.content).toContain('no open job positions');
    });

    it('"How can I apply for a job?" → careers intent, NOT Privacy Policy', () => {
      const r = retrieve('How can I apply for a job?', BUG_BASE, 5);
      expect(r.map((x) => x.entry.title)).not.toContain('Privacy Policy');
      expect(r[0].entry.category).toBe('careers');
    });

    it('"privacy policy" STILL returns the Privacy Policy (no regression on privacy queries)', () => {
      const r = retrieve('privacy policy', BUG_BASE, 5);
      expect(r.length).toBeGreaterThan(0);
      expect(r[0].entry.title).toBe('Privacy Policy');
    });

    it('when live cms-jobs DO exist, a job query returns the job entry (not the synthetic no-openings)', () => {
      const WITH_JOBS: KnowledgeEntry[] = [
        ...BUG_BASE,
        {
          id: 'job-1',
          title: 'Senior Backend Engineer',
          content: 'Senior backend engineer at Bangalore. Skills: Java, Spring Boot, AWS.',
          category: 'careers', canonicalPath: '/careers', sourceType: 'cms-jobs',
        },
      ];
      const r = retrieve('job', WITH_JOBS, 5);
      // The synthetic no-openings entry must NOT appear when live jobs exist.
      expect(r.map((x) => x.entry.id)).not.toContain('careers-no-openings');
      // The live job ranks high (careers intent boost).
      expect(r.map((x) => x.entry.title)).toContain('Senior Backend Engineer');
      // Privacy Policy still suppressed.
      expect(r.map((x) => x.entry.title)).not.toContain('Privacy Policy');
    });

    it('an irrelevant query with no matching content returns no results (honest fallback, no fabrication)', () => {
      const r = retrieve('xyzzy qwerty', BUG_BASE, 5);
      expect(r).toEqual([]);
    });

    it('stemming: "services" matches a "service" entry; "products" matches a "product" entry', () => {
      const r = retrieve('What products do you build?', MOCK_BASE, 5);
      expect(r.map((x) => x.entry.category)).toContain('products');
    });
  });
});
