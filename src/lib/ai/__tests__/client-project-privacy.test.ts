/**
 * client-project-privacy.test.ts — §3.2 client-project identity leakage tests.
 *
 * Mocks getPublishedClientProjects + getPublishedTestimonials to return
 * controlled records with/without permissionDisplayName, then verifies the
 * knowledge base EXCLUDES projects whose identity is not authorized + does
 * NOT leak identifying fields (companyName, projectTitle, description,
 * websiteUrl) indirectly.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the public-data fetchers BEFORE importing the retrieval layer.
vi.mock('@/lib/public-data', () => ({
  getPublicServices: vi.fn().mockResolvedValue([]),
  getVerifiedJobs: vi.fn().mockResolvedValue([]),
  getPublishedPosts: vi.fn().mockResolvedValue([]),
  getPublishedTechEcosystem: vi.fn().mockResolvedValue([]),
  getPublishedClientProjects: vi.fn(),
  getPublishedTestimonials: vi.fn(),
}));

import { getKnowledgeBase, invalidateKnowledgeCache } from '../knowledge-retrieval';
import { getPublishedClientProjects, getPublishedTestimonials } from '@/lib/public-data';

const mockedProjects = vi.mocked(getPublishedClientProjects);
const mockedTestimonials = vi.mocked(getPublishedTestimonials);

beforeEach(() => {
  invalidateKnowledgeCache();
  mockedProjects.mockReset();
  mockedTestimonials.mockReset();
});

describe('§3.2 client-project privacy (indirect identity leakage)', () => {
  it('EXCLUDES projects where permissionDisplayName is not true', async () => {
    mockedProjects.mockResolvedValue([
      { id: 'p1', companyName: 'Acme Corp', projectTitle: 'Acme E-commerce Platform', description: 'Built Acme Corp a custom e-commerce platform.', websiteUrl: 'https://acme.com', permissionDisplayName: true, status: 'published' },
      { id: 'p2', companyName: 'Secret Client', projectTitle: 'Secret Client CRM Migration', description: 'Migrated Secret Client to a new CRM.', websiteUrl: 'https://secret-client.com', permissionDisplayName: false, status: 'published' },
    ]);
    const base = await getKnowledgeBase();
    const portfolio = base.filter((e) => e.category === 'portfolio' && e.sourceType === 'cms-portfolio');
    expect(portfolio).toHaveLength(1);
    expect(portfolio[0].id).toBe('project-p1');
  });

  it('does NOT leak the restricted project\'s companyName, projectTitle, description, or websiteUrl', async () => {
    mockedProjects.mockResolvedValue([
      { id: 'restricted', companyName: 'Confidential Inc', projectTitle: 'Confidential Inc Analytics', description: 'Built Confidential Inc a custom analytics dashboard.', websiteUrl: 'https://confidential-inc.com', permissionDisplayName: false, status: 'published' },
    ]);
    const base = await getKnowledgeBase();
    const allContent = base.map((e) => `${e.title} ${e.content}`).join(' ');
    expect(allContent).not.toContain('Confidential Inc');
    expect(allContent).not.toContain('confidential-inc.com');
    expect(allContent).not.toContain('Confidential Inc Analytics');
  });

  it('includes projects where permissionDisplayName is explicitly true (with companyName)', async () => {
    mockedProjects.mockResolvedValue([
      { id: 'ok', companyName: 'Public Client', projectTitle: 'Public Platform', description: 'A public case study.', websiteUrl: 'https://public-client.com', permissionDisplayName: true, status: 'published' },
    ]);
    const base = await getKnowledgeBase();
    const portfolio = base.filter((e) => e.category === 'portfolio' && e.sourceType === 'cms-portfolio');
    expect(portfolio).toHaveLength(1);
    expect(portfolio[0].title).toContain('Public Client');
    // websiteUrl is NOT included in the content (removed in the §3.2 fix — even
    // for authorized projects, the URL is dropped from the AI content to avoid
    // the AI surfacing external links).
    expect(portfolio[0].content).not.toContain('https://public-client.com');
  });

  it('excludes projects with undefined permissionDisplayName (strict — default is true but undefined is treated as not-explicitly-authorized)', async () => {
    // The schema defaults permissionDisplayName to true, but if a legacy record
    // has it undefined, the strict check (!== true) excludes it.
    mockedProjects.mockResolvedValue([
      { id: 'legacy', companyName: 'Legacy', projectTitle: 'Legacy Project', description: 'A legacy project.', permissionDisplayName: undefined, status: 'published' },
    ]);
    const base = await getKnowledgeBase();
    const portfolio = base.filter((e) => e.category === 'portfolio' && e.sourceType === 'cms-portfolio');
    expect(portfolio).toHaveLength(0);
  });
});

describe('§3.2 testimonial name gating (strict)', () => {
  it('includes the quote but hides the name when permissionDisplayName !== true', async () => {
    mockedTestimonials.mockResolvedValue([
      { id: 't1', approvedQuote: 'Great work!', companyName: 'Hidden Co', clientName: 'John Doe', designation: 'CEO', permissionDisplayFeedback: true, permissionDisplayName: false },
    ]);
    const base = await getKnowledgeBase();
    const t = base.find((e) => e.id.startsWith('testimonial-'));
    expect(t).toBeDefined();
    expect(t!.content).toContain('Great work!'); // quote is approved → included
    expect(t!.content).not.toContain('Hidden Co'); // name hidden
    expect(t!.content).not.toContain('John Doe'); // client name hidden
    expect(t!.content).not.toContain('CEO'); // designation hidden
    expect(t!.title).toBe('Client Feedback'); // generic title
  });

  it('includes the name + designation when permissionDisplayName === true', async () => {
    mockedTestimonials.mockResolvedValue([
      { id: 't2', approvedQuote: 'Excellent!', companyName: 'Visible Co', clientName: 'Jane Smith', designation: 'CTO', permissionDisplayFeedback: true, permissionDisplayName: true },
    ]);
    const base = await getKnowledgeBase();
    const t = base.find((e) => e.content?.includes?.('Excellent!'));
    expect(t).toBeDefined();
    expect(t!.content).toContain('Excellent!');
    expect(t!.content).toContain('Jane Smith');
    expect(t!.content).toContain('CTO');
    // companyName appears in the TITLE when permissionDisplayName is true.
    expect(t!.title).toContain('Visible Co');
  });
});
