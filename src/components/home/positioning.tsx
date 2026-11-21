import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal';
import { SELECTED_WORK } from '@/lib/selected-work';

/**
 * HomePositioning — the three connected business dimensions (Prompt 05E §7).
 *
 *   1. Our Products — proprietary products built by Paragonel.
 *   2. Engineering Solutions — the 13-family capability catalogue.
 *   3. Applied Research & New Ventures — the research agenda.
 *
 * The narrative: engagements surface patterns → patterns become products →
 * products validate the engineering delivered in engagements. AcquisitionOS is
 * the proof the loop already operates.
 *
 * No additional products invented. Verified statuses preserved (AcquisitionOS
 * Private Beta, CodeGuard AI Published, SystemFoundry Internal). Research
 * directions are clearly labelled research — not live products.
 *
 * Server Component.
 */
const RESEARCH_DIRECTIONS = [
  'AI-agent security & permission governance',
  'Agent evaluation before deployment',
  'SMB multi-source payment reconciliation (vernacular-first, India)',
  'AI-native automation replacing brittle RPA',
  'Shift-left engineering-intelligence platform family (CodeGuard AI extension)',
];

export function HomePositioning() {
  const products = SELECTED_WORK;
  return (
    <section className="pt-section">
      <div className="pt-shell">
        <Reveal>
          <span className="pt-eyebrow">A product company and an engineering partner</span>
          <h2 className="pt-h1 mt-6 text-foreground">Three connected dimensions.</h2>
          <p className="pt-lead mt-6 max-w-2xl">
            Client engineering work and proprietary product development strengthen the same
            practice. Engagements surface patterns; patterns become products; products validate
            the engineering we deliver. AcquisitionOS is the proof the loop already operates.
          </p>
        </Reveal>

        <RevealGroup stagger={0.08} className="mt-12 grid gap-px bg-border md:grid-cols-3">
          {/* 1. Our Products */}
          <RevealItem>
            <div className="flex h-full flex-col bg-background p-6 md:p-7">
              <span className="pt-index text-xs">01</span>
              <h3 className="mt-3 text-base font-semibold text-foreground">Our Products</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Proprietary products built and operated by Paragonel. Each carries an honest
                status — no invented metrics.
              </p>
              <ul className="mt-4 space-y-2">
                {products.map((p) => (
                  <li key={p.slug} className="text-sm text-foreground">
                    <span className="font-medium">{p.title}</span>{' '}
                    <span className="text-xs text-muted-foreground">— {p.status}</span>
                  </li>
                ))}
              </ul>
              <Link href="/portfolio" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary">
                Selected work <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </RevealItem>

          {/* 2. Engineering Solutions */}
          <RevealItem>
            <div className="flex h-full flex-col bg-background p-6 md:p-7">
              <span className="pt-index text-xs">02</span>
              <h3 className="mt-3 text-base font-semibold text-foreground">Engineering Solutions</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Custom software, AI systems, automation, infrastructure and technology solutions
                built for real problems — across thirteen capability families, each with an honest
                delivery status.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Deliver Now · Specialist Support · Research &amp; Emerging.
              </p>
              <Link href="/services" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary">
                Capability catalogue <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </RevealItem>

          {/* 3. Applied Research & New Ventures */}
          <RevealItem>
            <div className="flex h-full flex-col bg-background p-6 md:p-7">
              <span className="pt-index text-xs">03</span>
              <h3 className="mt-3 text-base font-semibold text-foreground">Applied Research &amp; New Ventures</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Researching emerging problems and developing future product directions — clearly
                labelled research, not live products.
              </p>
              <ul className="mt-4 space-y-1.5">
                {RESEARCH_DIRECTIONS.map((r) => (
                  <li key={r} className="text-xs leading-relaxed text-muted-foreground">— {r}</li>
                ))}
              </ul>
              <Link href="/industries" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary">
                Industry problem patterns <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </RevealItem>
        </RevealGroup>

        <Reveal>
          <div className="mt-10">
            <Link href="/about" className="pt-btn pt-btn-ghost">
              How the dimensions connect <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
