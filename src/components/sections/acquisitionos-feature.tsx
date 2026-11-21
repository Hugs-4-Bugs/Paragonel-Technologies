"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollFadeIn } from "@/components/ui/scroll-fade-in";
import { ArrowRight, ExternalLink, Workflow } from "lucide-react";

const stages = [
  "Discover", "Research", "Find Gaps", "Opportunity Report", "Score", "Personalize",
  "Outreach", "Reply", "Meeting", "Pipeline", "Proposal", "Close",
];

export function AcquisitionOSFeature() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-14">
          <Badge className="mb-6 bg-primary text-primary-foreground border-none tracking-widest text-xs font-black uppercase px-4 py-1.5">
            Flagship Product · Private Beta
          </Badge>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6 text-foreground">
            Meet <span className="text-primary">AcquisitionOS</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Most outbound teams stitch together a prospect finder, an enricher, a sequencer, a reply tracker, a CRM, and a
            spreadsheet — and lose context at every seam. AcquisitionOS is an AI-native client acquisition operating system
            that runs the whole motion in one connected workflow, from the first prospect signal to a closed proposal.
          </p>
        </ScrollFadeIn>

        {/* Workflow teaser */}
        <ScrollFadeIn delay="150ms" className="mb-14">
          <div className="rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 bg-secondary/30 dark:bg-secondary/10 p-6 md:p-10">
            <div className="flex items-center justify-center gap-2 mb-6 text-primary">
              <Workflow className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-widest">The connected lifecycle</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
              {stages.map((s, i) => (
                <span key={s} className="inline-flex items-center gap-2 md:gap-3">
                  <span className="rounded-full border border-primary/30 bg-card px-3 py-1.5 text-xs md:text-sm font-bold text-foreground">
                    {s}
                  </span>
                  {i < stages.length - 1 && <ArrowRight className="h-3 w-3 text-primary/50" />}
                </span>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6 max-w-2xl mx-auto">
              Each stage hands its output to the next, so context is never rebuilt and never lost. AI assists at the
              signal-heavy stages; a human decides at the decision stages.
            </p>
          </div>
        </ScrollFadeIn>

        {/* Three pillars */}
        <ScrollFadeIn delay="200ms" className="grid md:grid-cols-3 gap-6 mb-14">
          {[
            { t: "AI-assisted, not autonomous", d: "Signals, drafts, and suggested scores — a human decides and acts. Assistance, not prediction." },
            { t: "No invented data", d: "Missing information stays missing rather than being fabricated. A gap is surfaced, not filled with a guess." },
            { t: "User-owned AI keys", d: "Bring your own OpenAI, Anthropic, or Google AI keys. No silent third-party routing." },
          ].map((c) => (
            <div key={c.t} className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-card p-6">
              <h3 className="font-black text-lg mb-2">{c.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.d}</p>
            </div>
          ))}
        </ScrollFadeIn>

        <ScrollFadeIn className="text-center flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="rounded-full px-8 h-14 text-base font-bold shadow-xl">
            <Link href="/our-product/acquisitionos">
              Explore the product <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-8 h-14 text-base font-bold">
            <Link href="https://acquisitionosbeta.vercel.app/" target="_blank" rel="noopener noreferrer">
              Request private-beta access <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
