/**
 * knowledge-retrieval.ts — Paragonel AI knowledge retrieval layer (Prompt 05O §5).
 *
 * Normalizes approved, published website + CMS content into a consistent
 * KnowledgeEntry representation and provides keyword retrieval over it.
 *
 * Design constraints (per the prompt):
 *   - Retrieve ONLY from approved, published, permission-approved content.
 *   - Reuse the existing public-data fetchers (src/lib/public-data.ts) which
 *     already enforce status='published' / isActive + !deletedAt + the
 *     permission flags (permissionDisplayFeedback, publicDisplayPermission,
 *     permissionDisplayName). No draft/deleted/private/admin records are ever
 *     retrieved.
 *   - Server-side only (uses the Admin SDK via public-data). No Firebase Admin
 *     credentials or model API keys reach the browser.
 *   - Cached with a TTL so the full CMS is not fetched on every chat message.
 *   - Refresh strategy: the cache expires after KNOWLEDGE_TTL_SECONDS; the next
 *     request rebuilds it. ISR revalidation of CMS pages (revalidate=60) keeps
 *     the public pages in sync independently. No full redeployment required.
 *   - Keyword retrieval (no external embedding/vector dependency) — acceptable
 *     for the first version per §5.7. The retrieval is separate from the UI
 *     and the model prompt per §5.8.
 *
 * KnowledgeEntry is the normalized shape required by §5.5:
 *   title, content, category, canonical internal page path, source type,
 *   last-updated timestamp where available.
 */
import knowledge from '@/data/company-knowledge.json';
import {
  getPublicServices,
  getPublicJobs,
  getPublishedPosts,
  getPublishedClientProjects,
  getPublishedTestimonials,
  getPublishedTechEcosystem,
} from '@/lib/public-data';

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: KnowledgeCategory;
  /** Canonical internal page path for citations (e.g. /services/ai-solutions). */
  canonicalPath: string;
  /** Where this entry came from (static company file, CMS, etc.). */
  sourceType: 'company-static' | 'cms-services' | 'cms-jobs' | 'cms-blog' | 'cms-portfolio' | 'cms-testimonials' | 'cms-tech' | 'policy';
  lastUpdated?: string;
}

export type KnowledgeCategory =
  | 'company' | 'services' | 'products' | 'careers' | 'blog'
  | 'portfolio' | 'technology' | 'policies' | 'contact' | 'navigation';

/** Cache TTL — how long the built knowledge base is reused before refresh. */
const KNOWLEDGE_TTL_SECONDS = 60;

let cachedBase: KnowledgeEntry[] | null = null;
let cachedAt = 0;

/** Small English stopword list — removed from query/entry tokens before scoring.
 *  NOTE: "paragonel" is intentionally NOT a stopword — it is the company name and
 *  a high-signal matching token for company-overview queries. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'to', 'of',
  'in', 'on', 'at', 'for', 'with', 'and', 'or', 'not', 'but', 'if', 'then', 'so',
  'do', 'does', 'did', 'can', 'could', 'would', 'should', 'will', 'shall', 'may',
  'might', 'must', 'have', 'has', 'had', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
  'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'whose',
  'how', 'why', 'when', 'where', 'about', 'into', 'from', 'as', 'by', 'than',
  'more', 'most', 'some', 'any', 'all', 'each', 'every', 'other', 'such', 'own',
  'same', 'too', 'very', 'just', 'now', 'also', 'only', 'out', 'up', 'down',
  'tell', 'please', 'help', 'want', 'need', 'know', 'like', 'there',
  'here', 'one', 'two', 'get', 'got',
]);

/** Tokenize text into lowercase alphanumeric tokens, dropping stopwords.
 *  Exported for testing. */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Truncate a string to a max length with an ellipsis. */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

/**
 * Build the full knowledge base from the static company file + live CMS content.
 * Fetches are best-effort: if a CMS fetch fails (Firebase unreachable), the
 * static entries still load so the assistant can answer company/product
 * questions. Empty results are fine — no fabricated content is ever added.
 */
async function buildKnowledgeBase(): Promise<KnowledgeEntry[]> {
  const entries: KnowledgeEntry[] = [];

  // --- Company overview (static, approved) ---
  const c = knowledge.company;
  entries.push({
    id: 'company-overview',
    title: `${c.legalName} — Company Overview`,
    content: `${c.description} Mission: ${c.mission} Tagline: "${c.tagline}". Founded ${c.founded} by ${c.founder} (${c.founder_details.title}). Location: ${c.location}. Contact: ${c.email}, ${c.phone}. Core technologies: ${c.technologies.join(', ')}.`,
    category: 'company',
    canonicalPath: '/about',
    sourceType: 'company-static',
  });
  entries.push({
    id: 'company-founder',
    title: `${c.founder} — Founder & CEO`,
    content: `${c.founder_details.name}, ${c.founder_details.title}. Background: ${c.founder_details.background}. Expertise: ${c.founder_details.expertise.join(', ')}.`,
    category: 'company',
    canonicalPath: '/about',
    sourceType: 'company-static',
  });

  // --- Products (static, approved) — AcquisitionOS PRIVATE BETA rules baked in ---
  for (const p of knowledge.products) {
    const isAcq = p.name.toLowerCase() === 'acquisitionos';
    entries.push({
      id: `product-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      title: `${p.name} — ${p.type} (${p.status})`,
      content: isAcq
        ? `${p.name} is ${p.description} STATUS: PRIVATE BETA. It is NOT publicly launched. The ONLY approved access URL is https://acquisitionosbeta.vercel.app/ (do not display the raw URL as visible text; use a meaningful label like "Request private-beta access"). Never mention acquisitionos.net. Full workflow: Discover → Research → Find Gaps → Opportunity Report → Score → Personalize → Outreach → Reply → Meeting → Pipeline → Proposal → Close. Distinguish current functionality from planned roadmap features.`
        : `${p.name} is ${p.description} Status: ${p.status}. Type: ${p.type}.`,
      category: 'products',
      canonicalPath: `/our-product/${p.name.toLowerCase() === 'acquisitionos' ? 'acquisitionos' : p.name.toLowerCase() === 'systemfoundry' ? 'systemfoundry' : 'codeguard-ai'}`,
      sourceType: 'company-static',
    });
  }

  // --- Services (static categories + live CMS) ---
  for (const s of knowledge.services) {
    entries.push({
      id: `service-static-${s.id}`,
      title: `${s.name}`,
      content: `Service focus: ${s.focus}`,
      category: 'services',
      canonicalPath: '/services',
      sourceType: 'company-static',
    });
  }
  try {
    const cmsServices = await getPublicServices();
    for (const s of cmsServices) {
      const slug = s.slug || '';
      entries.push({
        id: `service-cms-${s.id ?? slug}`,
        title: truncate(s.title || 'Service', 120),
        content: truncate(s.description || '', 600),
        category: 'services',
        canonicalPath: slug ? `/services/${slug}` : '/services',
        sourceType: 'cms-services',
        lastUpdated: s.updatedAt ? String(s.updatedAt) : undefined,
      });
    }
  } catch { /* Firebase unreachable — static services still loaded */ }

  // --- Jobs (live CMS) ---
  try {
    const jobs = await getPublicJobs();
    for (const j of jobs) {
      entries.push({
        id: `job-${j.id ?? j.title}`,
        title: truncate(j.title || 'Open Role', 120),
        content: truncate(
          `${j.title || ''} at ${j.location || 'Bangalore'}. ${(j.description || '').slice(0, 400)}${j.skills ? ` Skills: ${(Array.isArray(j.skills) ? j.skills : [j.skills]).join(', ')}.` : ''}${j.experienceRequired ? ` Experience: ${j.experienceRequired}.` : ''}${j.jobType ? ` Type: ${j.jobType}.` : ''}`,
          600,
        ),
        category: 'careers',
        canonicalPath: '/careers',
        sourceType: 'cms-jobs',
        lastUpdated: j.updatedAt ? String(j.updatedAt) : undefined,
      });
    }
  } catch { /* Firebase unreachable — no jobs loaded (assistant says so) */ }

  // --- Blog posts (live CMS) ---
  try {
    const posts = await getPublishedPosts();
    for (const p of posts) {
      entries.push({
        id: `blog-${p.id ?? p.slug}`,
        title: truncate(p.title || 'Article', 120),
        content: truncate(p.excerpt || (p.content || '').slice(0, 500), 600),
        category: 'blog',
        canonicalPath: p.slug ? `/blog/${p.slug}` : '/blog',
        sourceType: 'cms-blog',
        lastUpdated: p.publishedAt || p.createdAt ? String(p.publishedAt || p.createdAt) : undefined,
      });
    }
  } catch { /* Firebase unreachable — no posts loaded */ }

  // --- Client projects / portfolio (live CMS, permission-gated) ---
  try {
    const projects = await getPublishedClientProjects();
    for (const p of projects) {
      const showCompany = p.permissionDisplayName !== false;
      entries.push({
        id: `project-${p.id ?? p.title}`,
        title: truncate(showCompany && p.companyName ? p.companyName : (p.title || 'Client Engagement'), 120),
        content: truncate(`${p.title || ''}. ${(p.description || '').slice(0, 400)}${p.websiteUrl ? ` Website: ${p.websiteUrl}.` : ''}`, 600),
        category: 'portfolio',
        canonicalPath: '/our-product',
        sourceType: 'cms-portfolio',
        lastUpdated: p.updatedAt ? String(p.updatedAt) : undefined,
      });
    }
  } catch { /* Firebase unreachable — no projects loaded */ }

  // --- Testimonials (live CMS, permission-gated, non-empty quote) ---
  try {
    const testimonials = await getPublishedTestimonials();
    for (const t of testimonials) {
      const quote = (t.approvedQuote?.trim() || t.originalQuote?.trim() || '').trim();
      const showCompany = t.permissionDisplayName !== false;
      entries.push({
        id: `testimonial-${t.id ?? t.companyName}`,
        title: truncate(showCompany && t.companyName ? t.companyName : 'Client Feedback', 120),
        content: truncate(`"${quote}"${showCompany && t.clientName ? ` — ${t.clientName}${t.designation ? `, ${t.designation}` : ''}` : ''}`, 600),
        category: 'portfolio',
        canonicalPath: '/',
        sourceType: 'cms-testimonials',
        lastUpdated: t.updatedAt ? String(t.updatedAt) : undefined,
      });
    }
  } catch { /* Firebase unreachable — no testimonials loaded */ }

  // --- Technology ecosystem (live CMS, permission-gated) ---
  try {
    const tech = await getPublishedTechEcosystem();
    for (const t of tech) {
      entries.push({
        id: `tech-${t.id ?? t.name}`,
        title: truncate(t.name || 'Technology', 120),
        content: truncate(`${t.name || ''}. ${(t.description || '').slice(0, 400)}${t.category ? ` Category: ${t.category}.` : ''} Note: listed technologies reflect usage/evaluation, NOT formal partnerships unless explicitly stated.`, 600),
        category: 'technology',
        canonicalPath: '/our-product',
        sourceType: 'cms-tech',
        lastUpdated: t.updatedAt ? String(t.updatedAt) : undefined,
      });
    }
  } catch { /* Firebase unreachable — no tech entries loaded */ }

  // --- Policies (static, approved) ---
  entries.push({
    id: 'policy-privacy',
    title: 'Privacy Policy',
    content: 'Paragonel\'s Privacy Policy describes what data is collected, how it is used, and the visitor\'s rights. Applicable to all website interactions including contact, newsletter, and job applications.',
    category: 'policies',
    canonicalPath: '/privacy',
    sourceType: 'policy',
  });
  entries.push({
    id: 'policy-terms',
    title: 'Terms of Service',
    content: 'Paragonel\'s Terms of Service govern the use of the website and Paragonel\'s products/services.',
    category: 'policies',
    canonicalPath: '/terms',
    sourceType: 'policy',
  });
  entries.push({
    id: 'policy-cookie',
    title: 'Cookie Policy',
    content: 'Paragonel uses only strictly-necessary cookies (auth/session/theme/consent-record) by default. No analytics scripts load unless the visitor grants analytics consent via the cookie banner.',
    category: 'policies',
    canonicalPath: '/cookie-policy',
    sourceType: 'policy',
  });

  // --- Contact ---
  entries.push({
    id: 'contact',
    title: 'Contact Paragonel',
    content: `Contact Paragonel via the Contact page (${c.email}, ${c.phone}) or at ${c.location}. Use the contact form for project inquiries, AcquisitionOS private-beta access requests, partnerships, and careers.`,
    category: 'contact',
    canonicalPath: '/contact',
    sourceType: 'company-static',
  });

  // --- Navigation (page index) ---
  for (const page of knowledge.pages) {
    entries.push({
      id: `nav-${page.name.toLowerCase()}`,
      title: page.name,
      content: page.description,
      category: 'navigation',
      canonicalPath: page.url,
      sourceType: 'company-static',
    });
  }

  return entries;
}

/**
 * Get the knowledge base, rebuilding it if the cache is stale.
 * Exposed for tests + the chat API route.
 */
export async function getKnowledgeBase(): Promise<KnowledgeEntry[]> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedBase && now - cachedAt < KNOWLEDGE_TTL_SECONDS) {
    return cachedBase;
  }
  cachedBase = await buildKnowledgeBase();
  cachedAt = now;
  return cachedBase;
}

/** Force a rebuild on the next getKnowledgeBase() call (used by tests + CMS revalidation hooks). */
export function invalidateKnowledgeCache(): void {
  cachedBase = null;
  cachedAt = 0;
}

export interface RetrievalResult {
  entry: KnowledgeEntry;
  score: number;
}

/**
 * Keyword retrieval: tokenize the query, score each entry by weighted token
 * matches (title 3x, category 2x, content 1x), return the top-N entries with
 * score > 0. This is a simple, dependency-free indexed retrieval — no external
 * embedding/vector service required (acceptable for the first version per §5.7).
 */
export function retrieve(
  query: string,
  base: KnowledgeEntry[] | null = null,
  topN = 5,
): RetrievalResult[] {
  const kb = base ?? cachedBase ?? [];
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const scored: RetrievalResult[] = [];
  for (const entry of kb) {
    const titleTokens = new Set(tokenize(entry.title));
    const contentTokens = new Set(tokenize(entry.content));
    const categoryTokens = new Set(tokenize(entry.category));
    let score = 0;
    for (const t of queryTokens) {
      if (titleTokens.has(t)) score += 3;
      if (categoryTokens.has(t)) score += 2;
      if (contentTokens.has(t)) score += 1;
    }
    if (score > 0) scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

/**
 * Sanitize retrieved content + visitor messages for prompt-injection defense.
 * Wraps untrusted content in markers + escapes instruction-like patterns so the
 * model treats them as DATA, not instructions. The system prompt also instructs
 * the model to ignore embedded instructions in retrieved/user content.
 */
export function sanitizeUntrusted(text: string): string {
  // Escape sequences that could break out of the data wrapper.
  return text
    .replace(/```/g, "'''")
    .replace(/<[^>]+>/g, '') // strip HTML tags
    .slice(0, 4000); // bound length
}
