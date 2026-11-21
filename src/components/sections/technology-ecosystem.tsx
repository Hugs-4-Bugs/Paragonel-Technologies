/**
 * TechnologyEcosystem — truthful technology + integrations overview
 * (Prompt 05K §4, CMS-backed in 05L §3).
 *
 * NOT an "Our Partners" page. A client is not automatically a partner, and
 * vendors whose relationship is only an exploratory conversation, demo,
 * sandbox account or proposed pilot are NOT listed here as confirmed partners
 * or live integrations (Broadchat, VoiceLink/Elisiontec, Kissflow, Gupshup,
 * Sarvam, WATI, Cronofy are deliberately excluded — email discussions are not
 * evidence of a signed partnership or production integration).
 *
 * Admin-managed via the techEcosystem CMS collection. Renders ONLY published
 * entries with publicDisplayPermission. Falls back to the curated static array
 * below when Firestore is unreachable OR no entries are published yet, so the
 * section always renders truthfully. Categories are the four evidence-backed
 * kinds from §3 — live, dev, evaluated, planned.
 */
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { CheckCircle2, Hammer, CalendarClock, CircleDot } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getPublishedTechEcosystem } from '@/lib/public-data';

type Tone = 'live' | 'dev' | 'planned' | 'evaluated';

interface EcosystemItem {
  name: string;
  note: string;
}

interface EcosystemCategory {
  category: string;
  tone: Tone;
  description: string;
  items: EcosystemItem[];
}

/** Static fallback — used when Firestore is unreachable or no CMS entries are published. */
const STATIC_ECOSYSTEM: EcosystemCategory[] = [
  {
    category: 'Available',
    tone: 'live',
    description: 'Production-ready integrations used today, via user-provided keys.',
    items: [
      { name: 'OpenAI', note: 'User-provided API key — LLM provider for AcquisitionOS.' },
      { name: 'Google AI', note: 'User-provided API key — LLM provider for AcquisitionOS.' },
    ],
  },
  {
    category: 'In Development',
    tone: 'dev',
    description: 'Integrations actively being built into AcquisitionOS.',
    items: [
      { name: 'Email', note: 'Primary outreach channel — in build.' },
      { name: 'WhatsApp', note: 'Outreach channel — in build.' },
      { name: 'LinkedIn', note: 'Outreach channel — in build.' },
      { name: 'Anthropic / Claude', note: 'Deeper LLM integration in progress.' },
      { name: 'MCP server', note: 'External AI assistants can call AcquisitionOS.' },
    ],
  },
  {
    category: 'Planned',
    tone: 'planned',
    description: 'On the roadmap, not yet in build.',
    items: [
      { name: 'Google Calendar', note: 'Meeting scheduling — coming soon.' },
      { name: 'Cal.com', note: 'Scheduling alternative — planned.' },
      { name: 'HubSpot', note: 'CRM connector — planned.' },
      { name: 'Salesforce', note: 'CRM connector — planned.' },
    ],
  },
  {
    category: 'Evaluated (unverified)',
    tone: 'evaluated',
    description: 'Evaluated or provider-declared; not yet verified by Paragonel in production.',
    items: [
      { name: 'Stripe', note: 'Declared available; checkout unverified.' },
      { name: 'Razorpay', note: 'Declared available; checkout unverified.' },
    ],
  },
];

const CATEGORY_META: Record<string, { label: string; tone: Tone; description: string }> = {
  live: { label: 'Available', tone: 'live', description: 'Production-ready integrations used today, via user-provided keys.' },
  dev: { label: 'In Development', tone: 'dev', description: 'Integrations actively being built into AcquisitionOS.' },
  evaluated: { label: 'Evaluated (unverified)', tone: 'evaluated', description: 'Evaluated or provider-declared; not yet verified by Paragonel in production.' },
  planned: { label: 'Planned', tone: 'planned', description: 'On the roadmap, not yet in build.' },
};

const TONE_META: Record<Tone, { icon: LucideIcon; dot: string; chip: string }> = {
  live: { icon: CheckCircle2, dot: 'bg-emerald-500', chip: 'text-emerald-600 dark:text-emerald-400' },
  dev: { icon: Hammer, dot: 'bg-amber-500', chip: 'text-amber-600 dark:text-amber-400' },
  planned: { icon: CalendarClock, dot: 'bg-violet-500', chip: 'text-violet-600 dark:text-violet-400' },
  evaluated: { icon: CircleDot, dot: 'bg-sky-500', chip: 'text-sky-600 dark:text-sky-400' },
};

/** Group published CMS entries by category; fall back to static if none. */
function buildCategories(cmsEntries: { organizationName?: string; category?: string; description?: string }[]): EcosystemCategory[] {
  if (!cmsEntries || cmsEntries.length === 0) return STATIC_ECOSYSTEM;
  const grouped: Record<string, EcosystemItem[]> = {};
  for (const e of cmsEntries) {
    const cat = e.category || 'planned';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ name: e.organizationName || '—', note: e.description || '' });
  }
  return (['live', 'dev', 'evaluated', 'planned'] as const)
    .filter((c) => grouped[c]?.length)
    .map((c) => ({
      category: CATEGORY_META[c].label,
      tone: CATEGORY_META[c].tone,
      description: CATEGORY_META[c].description,
      items: grouped[c],
    }));
}

export async function TechnologyEcosystem() {
  const cmsEntries = await getPublishedTechEcosystem();
  const categories = buildCategories(cmsEntries);

  return (
    <section className="pt-section pt-surface-quiet">
      <div className="pt-shell">
        <Reveal>
          <span className="pt-eyebrow">Technology ecosystem &amp; integrations</span>
          <h2 className="pt-h1 mt-6 text-foreground">
            What we build with — and what stage each integration is actually at.
          </h2>
          <p className="pt-lead mt-6 max-w-2xl">
            A truthful view of the technologies behind Paragonel&apos;s products. Each integration is
            classified by its real status today, not by aspiration. Client engagements are listed
            separately in Selected Work — a client is not automatically a technology partner.
          </p>
        </Reveal>

        <RevealGroup stagger={0.06} className="mt-12 grid gap-5 md:grid-cols-2">
          {categories.map((cat) => {
            const meta = TONE_META[cat.tone];
            return (
              <RevealItem key={cat.category}>
                <div className="h-full rounded-lg border border-border bg-background p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} aria-hidden="true" />
                    <meta.icon className={`h-5 w-5 ${meta.chip}`} aria-hidden="true" />
                    <h3 className="font-semibold text-foreground">{cat.category}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{cat.description}</p>
                  <ul className="space-y-2.5 mt-auto">
                    {cat.items.map((it) => (
                      <li key={it.name} className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
                        <span className="font-medium text-foreground text-sm shrink-0">{it.name}</span>
                        <span className="text-xs text-muted-foreground">{it.note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>

        <Reveal>
          <p className="text-xs text-muted-foreground mt-8 max-w-2xl">
            Vendors explored through meetings, demos, sandbox accounts or proposals — but without a
            signed partnership or production integration — are intentionally not listed here. This
            section reflects integrations with a verifiable status inside Paragonel&apos;s products.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
