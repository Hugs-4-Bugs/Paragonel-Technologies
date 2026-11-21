import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderGit2, Rocket, Code2, Server, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Selected Work / What We've Built (Phase 2 §5).
 *
 * Multiple factual proof points — NOT padded with fabricated testimonials.
 * Per the Content Truth Register §5, NO client quotes are approved for
 * publication, so every card is a factual project/build entry with no
 * invented quote, metric, or endorsement.
 *
 * Cards:
 *  1. AcquisitionOS — Paragonel's flagship product (private beta). Verified.
 *  2. CodeGuard AI — published on the VS Code Marketplace. Verified.
 *  3. SystemFoundry — internal infrastructure tool. Verified (internal).
 *  4. Maa Arogyam — delivered client engagement (website build). Verified.
 *
 * DietMended is NOT listed: no logo or verified reference exists in the
 * workspace (flagged as a blocker). Primoreon is explicitly excluded.
 *
 * Server Component — static, no Firestore read, no client SDK.
 */
type WorkCard = {
  icon: typeof FolderGit2;
  title: string;
  kind: string;
  status: string;
  statusTone: 'beta' | 'live' | 'internal' | 'client';
  body: string;
  href?: string;
  ctaLabel?: string;
};

const work: WorkCard[] = [
  {
    icon: Rocket,
    title: 'AcquisitionOS',
    kind: 'Flagship product · AI-native client acquisition platform',
    status: 'Private Beta',
    statusTone: 'beta',
    body:
      'Paragonel’s own AI-native client acquisition platform — a connected workflow from prospect discovery to deal progression, built on a retrieval-augmented, human-in-the-loop architecture. Currently in private beta, with real-user feedback driving product refinement. Listed here as a product we engineered and operate; no outcome metric is claimed without a measured source.',
    href: '/our-product/acquisitionos',
    ctaLabel: 'Explore AcquisitionOS',
  },
  {
    icon: Code2,
    title: 'CodeGuard AI',
    kind: 'Developer tool · VS Code extension',
    status: 'Published',
    statusTone: 'live',
    body:
      'A VS Code extension for real-time cloud cost intelligence — shift-left cost analysis and recommendations surfaced to developers inside the editor. Published on the VS Code Marketplace. Listed factually as a shipped developer tool; adoption numbers are not claimed without a measured source.',
  },
  {
    icon: Server,
    title: 'SystemFoundry',
    kind: 'Internal tool · Infrastructure simulator',
    status: 'Internal',
    statusTone: 'internal',
    body:
      'An infrastructure simulator Paragonel uses for its own cloud-engineering work — scenario modelling for platform and reliability decisions. Honestly labelled as an internal tool, not a commercial product.',
  },
  {
    icon: FolderGit2,
    title: 'Maa Arogyam',
    kind: 'Client engagement · Website build',
    status: 'Delivered',
    statusTone: 'client',
    body:
      'Paragonel built the Maa Arogyam website — a professional, modern web presence for the organization. Listed factually as work delivered; no client outcome metric, quote, or endorsement is claimed without evidence.',
    href: '/our-product',
    ctaLabel: 'See our product work',
  },
];

const toneClass: Record<WorkCard['statusTone'], string> = {
  beta: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
  live: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
  internal: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300 border-zinc-500/30',
  client: 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30',
};

export function SelectedWorkSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-3 block">What we’ve built</span>
          <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            Selected work
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Real engineering work — our own products and a delivered client engagement — presented factually.
            We do not publish client quotes, outcome metrics, or endorsements without evidence.
          </p>
        </ScrollFadeIn>

        <div className="grid gap-6 md:grid-cols-2">
          {work.map((w, i) => (
            <ScrollFadeIn key={w.title} delay={`${i * 80}ms`}>
              <Card className="h-full rounded-lg border-border shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="space-y-4 p-6 md:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-primary">
                        <w.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight text-foreground">{w.title}</h3>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{w.kind}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`shrink-0 border ${toneClass[w.statusTone]}`}>{w.status}</Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{w.body}</p>
                  {w.href && w.ctaLabel && (
                    <Button asChild variant="link" className="h-auto p-0 text-primary">
                      <Link href={w.href} className="flex items-center gap-1">
                        {w.ctaLabel} <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
