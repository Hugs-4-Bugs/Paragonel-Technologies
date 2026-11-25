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
  getVerifiedJobs,
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
        ? `${p.name} is ${p.description} STATUS: PRIVATE BETA. It is NOT publicly launched. The canonical product domain is https://acquisitionos.net (do not display the raw URL as visible text; use a meaningful label like "Request private-beta access"). Full workflow: Discover → Research → Find Gaps → Opportunity Report → Score → Personalize → Outreach → Reply → Meeting → Pipeline → Proposal → Close. Distinguish current functionality from planned roadmap features.`
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

  // --- Jobs (verified CMS only — NO dummyJobs fallback, Prompt 05P §3.3) ---
  try {
    const jobs = await getVerifiedJobs();
    for (const j of jobs) {
      // Never invent a location when the job has none (§3.3).
      const loc = j.location && String(j.location).trim() ? String(j.location).trim() : '';
      entries.push({
        id: `job-${j.id ?? j.title}`,
        title: truncate(j.title || 'Open Role', 120),
        content: truncate(
          `${j.title || 'Open Role'}${loc ? ` at ${loc}` : ''}. ${(j.description || '').slice(0, 400)}${j.skills ? ` Skills: ${(Array.isArray(j.skills) ? j.skills : [j.skills]).join(', ')}.` : ''}${j.experienceRequired ? ` Experience: ${j.experienceRequired}.` : ''}${j.jobType ? ` Type: ${j.jobType}.` : ''}`,
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

  // --- Client projects / portfolio (live CMS, strict identity gating, Prompt 05P §3.2) ---
  // If permissionDisplayName is not explicitly TRUE, EXCLUDE the project entirely.
  // Hiding only companyName is insufficient — projectTitle/description/websiteUrl
  // can reveal the client indirectly. Only projects with explicit name-display
  // permission are indexed; the rest are dropped (the AI cannot leak them).
  try {
    const projects = await getPublishedClientProjects();
    for (const p of projects) {
      if (p.permissionDisplayName !== true) continue; // strict: exclude unless explicitly authorized
      entries.push({
        id: `project-${p.id ?? p.projectTitle}`,
        title: truncate(p.companyName || p.projectTitle || 'Client Engagement', 120),
        content: truncate(`${p.projectTitle || ''}. ${(p.description || '').slice(0, 400)}`, 600),
        category: 'portfolio',
        canonicalPath: '/our-product',
        sourceType: 'cms-portfolio',
        lastUpdated: p.updatedAt ? String(p.updatedAt) : undefined,
      });
    }
  } catch { /* Firebase unreachable — no projects loaded */ }

  // --- Testimonials (live CMS, strict name gating, Prompt 05P §3.2) ---
  // The quote is already approved (permissionDisplayFeedback===true, enforced by
  // the fetcher). The client/company NAME is shown ONLY when permissionDisplayName
  // is explicitly true — otherwise the quote is included anonymously.
  try {
    const testimonials = await getPublishedTestimonials();
    for (const t of testimonials) {
      const quote = (t.approvedQuote?.trim() || t.originalQuote?.trim() || '').trim();
      const showName = t.permissionDisplayName === true; // strict
      entries.push({
        id: `testimonial-${t.id ?? (showName ? t.companyName : 'anon')}`,
        title: truncate(showName && t.companyName ? t.companyName : 'Client Feedback', 120),
        content: truncate(`"${quote}"${showName && t.clientName ? ` — ${t.clientName}${t.designation ? `, ${t.designation}` : ''}` : ''}`, 600),
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
 * Simple English suffix-stripper for plural/conjugation normalization. One
 * pass; conservative (only strips a known suffix when the stem is long enough).
 * Exported for testing. NOT a full Porter stemmer — sufficient for matching
 * 'careers'↔'career', 'jobs'↔'job', 'services'↔'service', 'policies'↔'policy'.
 */
export function stem(token: string): string {
  const t = token.toLowerCase();
  if (t.length <= 3) return t;
  if (t.endsWith('ies')) return t.slice(0, -3) + 'y';
  if (t.endsWith('ied')) return t.slice(0, -3) + 'y';
  for (const suf of ['tion', 'ment', 'ions', 'ing', 'ies', 'ied', 'es', 'ed']) {
    if (t.endsWith(suf) && t.length > suf.length + 2) return t.slice(0, -suf.length);
  }
  if (t.endsWith('s') && t.length > 3) return t.slice(0, -1);
  return t;
}

/**
 * Semantic equivalence classes — used to EXPAND a query token with related terms
 * so paraphrased questions + singular/plural variants match the right entries
 * (e.g. 'job' → also matches 'careers', 'opening', 'vacancy', 'position'). This
 * broadens keyword matching only; the ranking + scoring still apply. It is NOT a
 * hardcoded query→response map (every query still goes through scoring + the
 * model). The groups cover the company topics the chatbot must distinguish.
 */
const SYNONYM_GROUPS: { key: string; words: string[] }[] = [
  { key: 'careers', words: ['job', 'jobs', 'career', 'careers', 'opening', 'openings', 'vacancy', 'vacancies', 'position', 'positions', 'role', 'roles', 'hiring', 'recruitment', 'recruit', 'employ', 'employment', 'employee', 'opportunity', 'opportunities', 'work', 'working'] },
  { key: 'apply', words: ['apply', 'application', 'applying', 'applied', 'applicant', 'applicants', 'submit', 'submission', 'resume', 'cv', 'candidate', 'candidates'] },
  { key: 'services', words: ['service', 'services', 'offering', 'offerings', 'solution', 'solutions', 'capability', 'capabilities', 'provide', 'provides'] },
  { key: 'products', words: ['product', 'products', 'platform', 'platforms', 'tool', 'tools', 'software', 'build', 'builds', 'building', 'make', 'makes'] },
  { key: 'company', words: ['company', 'paragonel', 'firm', 'business', 'organization', 'organisation', 'about', 'who', 'founder', 'ceo'] },
  { key: 'privacy', words: ['privacy', 'policy', 'policies', 'cookie', 'cookies', 'gdpr', 'terms', 'legal', 'consent', 'data'] },
  { key: 'contact', words: ['contact', 'email', 'phone', 'reach', 'support', 'address', 'location', 'office', 'where'] },
  { key: 'technology', words: ['technology', 'technologies', 'tech', 'stack', 'framework', 'frameworks', 'tooling', 'infrastructure'] },
  { key: 'pricing', words: ['price', 'pricing', 'cost', 'costs', 'fee', 'fees', 'rate', 'rates', 'quote', 'charge', 'charges'] },
];

/** Map each stem → the set of all stems in its synonym group (inclusive). */
const SYNONYM_MAP: Map<string, Set<string>> = (() => {
  const m = new Map<string, Set<string>>();
  for (const g of SYNONYM_GROUPS) {
    const stems = new Set<string>(g.words.map(stem));
    stems.add(stem(g.key));
    for (const s of stems) {
      const existing = m.get(s);
      if (existing) for (const x of stems) existing.add(x);
      else m.set(s, new Set(stems));
    }
  }
  return m;
})();

/** Expand a raw query token into its stem + all synonym-group stems. */
function expandQueryToken(raw: string): string[] {
  const s = stem(raw);
  const out = new Set<string>([raw, s]);
  const group = SYNONYM_MAP.get(s) ?? SYNONYM_MAP.get(raw);
  if (group) for (const g of group) out.add(g);
  return [...out];
}

/** Detected query intent — drives category boosts + legal-doc suppression so a
 *  'job' query never surfaces the Privacy Policy (which mentions 'job
 *  applications') + a careers query with no live jobs answers honestly. */
export type RetrievalIntent =
  | 'careers' | 'privacy' | 'contact' | 'services' | 'products'
  | 'company' | 'technology' | 'pricing' | null;

/** Detect the dominant intent from raw query tokens. Privacy is checked BEFORE
 *  careers because a privacy query may also mention 'job' (e.g. 'privacy policy
 *  for job applications') + should still be privacy. Exported for testing. */
export function detectIntent(tokens: string[]): RetrievalIntent {
  const stems = new Set(tokens.map(stem));
  const has = (words: string[]) => words.some((w) => stems.has(stem(w)));
  if (has(SYNONYM_GROUPS.find((g) => g.key === 'privacy')!.words)) return 'privacy';
  if (has(SYNONYM_GROUPS.find((g) => g.key === 'careers')!.words)) return 'careers';
  if (has(SYNONYM_GROUPS.find((g) => g.key === 'contact')!.words)) return 'contact';
  if (has(SYNONYM_GROUPS.find((g) => g.key === 'products')!.words)) return 'products';
  if (has(SYNONYM_GROUPS.find((g) => g.key === 'services')!.words)) return 'services';
  if (has(SYNONYM_GROUPS.find((g) => g.key === 'technology')!.words)) return 'technology';
  if (has(SYNONYM_GROUPS.find((g) => g.key === 'company')!.words)) return 'company';
  if (has(SYNONYM_GROUPS.find((g) => g.key === 'pricing')!.words)) return 'pricing';
  return null;
}

/** Confidence threshold: a match needs at least a title OR category hit (score
 *  >= 2), not just a single incidental content mention (score = 1). This stops
 *  weak matches like 'job' → Privacy Policy ('...job applications...') from
 *  grounding an answer when no better candidate exists. */
const MIN_CONFIDENCE_SCORE = 2;

/**
 * Robust keyword retrieval with query normalization, stemming, synonym
 * expansion, intent recognition, category boosts, legal-document suppression,
 * + a confidence threshold. Dependency-free (no embeddings/vector service).
 *
 * Fixes the production bug where 'job' / 'job opening' returned the Privacy
 * Policy (it mentions 'job applications' → score 1 → only candidate) + 'career'
 * returned nothing (no stemming → 'career' ≠ 'careers' nav entry):
 *   - Stemming + synonyms: 'job' now also matches the 'Careers' nav page +
 *     any live cms-jobs entries (via the careers synonym group).
 *   - Intent suppression: a careers-intent query NEVER surfaces policies
 *     entries (they are zeroed); a non-privacy generic query suppresses weak
 *     policy matches (score <= 2).
 *   - Confidence threshold: weak single-content matches (score < 2) are
 *     dropped → the assistant returns an honest 'no verified info' fallback
 *     instead of the wrong document.
 *   - Honest 'no openings': a careers-intent query with NO live cms-jobs in
 *     the base gets a synthetic, truthful 'no current open positions' entry
 *     so the assistant says there are no openings rather than implying some
 *     exist via the Careers nav link. Never fabricates specific roles.
 */
export function retrieve(
  query: string,
  base: KnowledgeEntry[] | null = null,
  topN = 5,
): RetrievalResult[] {
  const kb = base ?? cachedBase ?? [];
  const rawTokens = tokenize(query);
  if (rawTokens.length === 0) return [];

  // Expand query tokens with stems + synonyms for paraphrase/variant matching.
  const queryExpanded = new Set<string>();
  for (const t of rawTokens) for (const e of expandQueryToken(t)) queryExpanded.add(e);

  const intent = detectIntent(rawTokens);
  const hasLiveJobs = kb.some(
    (e) => e.sourceType === 'cms-jobs' || (e.category === 'careers' && e.id.startsWith('job-')),
  );

  const scored: RetrievalResult[] = [];
  for (const entry of kb) {
    // Stem entry tokens so 'careers' (entry) matches 'career' (query stem).
    const titleTokens = new Set(tokenize(entry.title).map(stem));
    const categoryTokens = new Set(tokenize(entry.category).map(stem));
    const contentTokens = new Set(tokenize(entry.content).map(stem));
    let score = 0;
    for (const t of queryExpanded) {
      const ts = stem(t);
      if (titleTokens.has(ts)) score += 3;
      if (categoryTokens.has(ts)) score += 2;
      if (contentTokens.has(ts)) score += 1;
    }
    if (score === 0) continue;

    // Intent-based boosts + suppression.
    if (intent === 'careers') {
      // A job/career query ranks careers entries (live jobs + the Careers nav
      // page) + suppresses legal docs that match 'job' only via 'job
      // applications' in their text.
      if (entry.category === 'careers' || entry.sourceType === 'cms-jobs') score += 6;
      if (entry.category === 'navigation' && /career|job|hire/i.test(entry.title)) score += 5;
      if (entry.category === 'policies') score = 0;
    } else if (intent === 'privacy') {
      if (entry.category === 'policies') score += 6;
    } else if (intent === 'contact') {
      if (entry.category === 'contact') score += 6;
    } else if (intent === 'services') {
      if (entry.category === 'services') score += 4;
    } else if (intent === 'products') {
      if (entry.category === 'products') score += 4;
    } else if (intent === 'technology') {
      if (entry.category === 'technology') score += 4;
    } else if (intent === 'company') {
      if (entry.category === 'company') score += 4;
    } else if (intent === 'pricing') {
      // No public pricing content — suppress everything (honest 'no pricing
      // info' fallback) rather than surfacing an unrelated page.
      score = 0;
    } else {
      // No specific intent: suppress weak policy matches that surface only via
      // incidental content (a generic query shouldn't return the Privacy Policy
      // unless it explicitly asks about privacy).
      if (entry.category === 'policies' && score <= 2) score = 0;
    }
    if (score > 0) scored.push({ entry, score });
  }

  // Confidence threshold: drop weak single-content matches.
  const confident = scored.filter((s) => s.score >= MIN_CONFIDENCE_SCORE);
  confident.sort((a, b) => b.score - a.score);

  // Careers intent + NO live jobs → prepend a truthful 'no current openings'
  // entry so the assistant answers honestly instead of implying openings exist.
  if (intent === 'careers' && !hasLiveJobs) {
    confident.unshift({
      entry: {
        id: 'careers-no-openings',
        title: 'Careers — No current open positions',
        content:
          "Paragonel has no open job positions listed at this time. The /careers page shows open roles when they are available. Candidates are welcome to send their resume via the Contact page for future opportunities. Do not invent or list specific job titles, locations, or requirements that are not present here.",
        category: 'careers',
        canonicalPath: '/careers',
        sourceType: 'company-static',
      },
      score: 100, // top-ranked so the honest answer is grounded first
    });
  }

  return confident.slice(0, topN);
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
