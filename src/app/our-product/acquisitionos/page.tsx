import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { AcquisitionWorkflow } from '@/components/sections/acquisition-workflow';
import { IntegrationsDirectory } from '@/components/sections/integrations-directory';
import { WorkflowRecipes } from '@/components/sections/workflow-recipes';
import {
  Search, Microscope, GitCompareArrows, FileText, Gauge, Sparkles, Send, MessageSquare,
  CalendarClock, KanbanSquare, FileSignature, Handshake, ArrowRight, ExternalLink,
  ShieldCheck, Lock, KeyRound, Rocket, Lightbulb, Cpu, CircleDot,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'AcquisitionOS — AI-Native Client Acquisition Platform (Private Beta) | Paragonel',
  description:
    'AcquisitionOS is Paragonel\'s AI-native client acquisition operating system, currently in private beta. It unifies prospect discovery, research, opportunity reporting, scoring, outreach, pipeline, and proposals into one connected workflow.',
  alternates: { canonical: 'https://acquisitionos.net' },
};

const PRODUCT_DOMAIN = 'https://acquisitionos.net';

const lifecycle = [
  { n: '01', name: 'Discover', icon: Search,
    short: 'Find the businesses that fit your target profile.',
    detail: 'Discovery is where every acquisition engagement begins. Instead of importing a static list, AcquisitionOS lets you describe the kind of business you want to reach — industry, size, signals, geography — and surfaces prospect businesses that match. The output of Discover is a working set of named prospects that flow into research.',
    input: 'Target profile and criteria', output: 'A set of named prospect businesses', next: 'Research' },
  { n: '02', name: 'Research', icon: Microscope,
    short: 'Aggregate multi-source company information into one context.',
    detail: 'Research pulls together what is publicly knowable about a prospect into a single, structured context — company activity, offerings, scale, and the landscape they operate in. Rather than a salesperson rebuilding context across six tabs, AcquisitionOS assembles it once, in one place, ready to be reasoned over.',
    input: 'A named prospect', output: 'A structured research context', next: 'Find Gaps' },
  { n: '03', name: 'Find Gaps', icon: GitCompareArrows,
    short: 'Detect gaps, triggers, and unmet needs.',
    detail: 'Find Gaps reads the research context for openings — an unmet need, a missing capability, a trigger event — that your offering could credibly address. Gaps are surfaced as explicit signals, not invented: where information is missing, the system says so rather than filling it with a guess.',
    input: 'A research context', output: 'A set of detected gaps and triggers', next: 'Opportunity Report' },
  { n: '04', name: 'Opportunity Report', icon: FileText,
    short: 'Assemble a business-specific opportunity report.',
    detail: 'The Opportunity Report turns the research and the gaps into a readable, structured brief: why this prospect, what is missing, and where your offering fits. It is the artifact a salesperson would otherwise write by hand — produced consistently, and ready to inform scoring and personalization.',
    input: 'Research + gaps', output: 'A structured opportunity report', next: 'Score' },
  { n: '05', name: 'Score', icon: Gauge,
    short: 'Produce an AI-assisted lead score — a signal, not a prediction.',
    detail: 'Scoring assigns a relative weight to each opportunity so a team can decide where to spend its time first. AcquisitionOS is explicit that its scores are AI-assisted signals, not predictions: they rank and prioritize, they do not guarantee an outcome. A human still decides whether to pursue.',
    input: 'An opportunity report', output: 'A prioritized score', next: 'Personalize' },
  { n: '06', name: 'Personalize', icon: Sparkles,
    short: 'Generate personalized outreach context from the report.',
    detail: 'Personalization turns the opportunity report into the specific angle, opener, and value proposition for this prospect. The output is outreach-ready context — drafted, specific, and grounded in the research — that a human reviews and sends rather than a generic template blast.',
    input: 'A scored opportunity', output: 'Personalized outreach context', next: 'Outreach' },
  { n: '07', name: 'Outreach', icon: Send,
    short: 'Send multi-channel outreach from one place.',
    detail: 'Outreach sends across the channels your prospects actually use — email, WhatsApp, LinkedIn, and Instagram — from inside the same workflow that produced the message. No copying between tools, no losing the context that made the message specific. Channel availability is classified honestly in the integration directory below.',
    input: 'Personalized outreach context', output: 'Sent outreach across channels', next: 'Reply' },
  { n: '08', name: 'Reply', icon: MessageSquare,
    short: 'Capture and analyze replies and conversation state.',
    detail: 'Reply brings responses back into the same opportunity record, so a conversation is never orphaned in a separate inbox. The system helps read the state of a reply — interest, objection, next step — so the salesperson can pick the right next action without reconstructing the thread.',
    input: 'Inbound replies', output: 'Analyzed conversation state', next: 'Meeting' },
  { n: '09', name: 'Meeting', icon: CalendarClock,
    short: 'Schedule and manage meeting workflows.',
    detail: 'Meeting moves a warm conversation toward a booked call. AcquisitionOS supports the meeting workflow — proposing times, capturing the outcome — so a meeting is a tracked stage in the pipeline, not a loose calendar entry. Calendar integrations are classified in the directory below.',
    input: 'A qualified conversation', output: 'A scheduled and tracked meeting', next: 'Pipeline' },
  { n: '10', name: 'Pipeline', icon: KanbanSquare,
    short: 'Manage opportunities on a pipeline board.',
    detail: 'Pipeline is where every opportunity lives as it moves toward close — visible, stage-tagged, and connected to all the context that came before it. The board keeps the whole acquisition motion in one view instead of split across a CRM, a spreadsheet, and a sequence tool.',
    input: 'Active opportunities', output: 'A managed pipeline', next: 'Proposal' },
  { n: '11', name: 'Proposal', icon: FileSignature,
    short: 'Generate a structured proposal from the opportunity.',
    detail: 'Proposal turns the accumulated context — the research, the gaps, the conversation — into a structured proposal document, grounded in what was actually learned about the prospect rather than a recycled template. The proposal is a draft a human finalizes, not a finished contract.',
    input: 'A pipeline opportunity', output: 'A structured proposal draft', next: 'Close' },
  { n: '12', name: 'Close', icon: Handshake,
    short: 'Support the path to close.',
    detail: 'Close is the final stage — the handoff from proposal to won engagement. Today this stage is supported narratively as the destination of the workflow; deeper close automation is on the roadmap. The value of Close is that every artifact that led here — research, report, score, outreach, conversation, proposal — lives in one connected record.',
    input: 'A finalized proposal', output: 'A closed engagement', next: '—' },
];

const integrations = [
  { name: 'Email', badge: 'BUILDING', note: 'Primary outreach channel.' },
  { name: 'WhatsApp', badge: 'BUILDING', note: 'Outreach channel.' },
  { name: 'LinkedIn', badge: 'BUILDING', note: 'Outreach channel.' },
  { name: 'Instagram', badge: 'BUILDING', note: 'Outreach channel.' },
  { name: 'Telegram', badge: 'IN MAP', note: 'Present in the integration map.' },
  { name: 'OpenAI (user-provided key)', badge: 'AVAILABLE', note: 'Bring your own API key.' },
  { name: 'Google AI (user-provided key)', badge: 'AVAILABLE', note: 'Bring your own API key.' },
  { name: 'Anthropic / Claude', badge: 'IN DEVELOPMENT', note: 'Deeper integration in progress.' },
  { name: 'MCP server', badge: 'IN DEVELOPMENT', note: 'So external AI assistants can call AcquisitionOS.' },
  { name: 'Google Calendar', badge: 'COMING SOON', note: 'Meeting scheduling.' },
  { name: 'Cal.com', badge: 'PLANNED', note: 'Scheduling alternative.' },
  { name: 'HubSpot', badge: 'PLANNED', note: 'CRM connector.' },
  { name: 'Salesforce', badge: 'PLANNED', note: 'CRM connector.' },
  { name: 'Stripe', badge: 'DECLARED', note: 'Declared available; checkout unverified.' },
  { name: 'Razorpay', badge: 'DECLARED', note: 'Declared available; checkout unverified.' },
];

const badgeStyle: Record<string, string> = {
  'AVAILABLE': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'DECLARED': 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
  'IN DEVELOPMENT': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'BUILDING': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'COMING SOON': 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
  'PLANNED': 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
  'IN MAP': 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
};

export default function AcquisitionOSPage() {
  return (
    <div className="bg-background">
      {/* 1. Hero + private-beta CTA */}
      <section className="relative overflow-hidden animated-gradient-background">
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
        <div className="relative z-10 container mx-auto px-4 md:px-6 py-24 md:py-36 text-center">
          <ScrollFadeIn>
            <Badge className="mb-6 bg-primary text-primary-foreground border-none tracking-widest text-xs font-black uppercase px-4 py-1.5">
              AcquisitionOS · Private Beta
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-primary-foreground mb-6">
              The AI-native client acquisition operating system
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 font-medium mb-4">From Prospect to Pipeline.</p>
            <p className="max-w-3xl mx-auto text-base md:text-lg text-primary-foreground/80 leading-relaxed mb-10">
              AcquisitionOS replaces the fragmented stack most outbound teams stitch together — a prospect finder, an
              enricher, a sequencer, a reply tracker, a CRM, a spreadsheet, and a proposal tool — with one connected
              workflow that runs from the first prospect signal to a closed proposal. It is currently in private beta.
            </p>
          </ScrollFadeIn>
          <ScrollFadeIn delay="200ms" className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8 h-14 text-base font-bold shadow-xl">
              <Link href={PRODUCT_DOMAIN} target="_blank" rel="noopener noreferrer">
                Request private-beta access <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 h-14 text-base font-bold border-primary-foreground/80 text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/contact">Talk to the team</Link>
            </Button>
          </ScrollFadeIn>
        </div>
      </section>

      {/* 2. Product positioning */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <ScrollFadeIn className="text-center mb-12">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">What it is</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">One workflow instead of a stack</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Most outbound teams pay an integration tax: a prospect tool, an enricher, a sequencer, a reply tracker, a CRM,
              and a spreadsheet, none of which talk to each other well. Information is lost between tools, context is rebuilt
              at every step, and the team&apos;s real knowledge of a prospect never becomes actionable. AcquisitionOS collapses
              that stack into one AI-native workflow where each stage hands verified context to the next.
            </p>
          </ScrollFadeIn>
          <ScrollFadeIn delay="150ms">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { t: 'AI-assisted, not AI-autonomous', d: 'AI surfaces signals, drafts, and suggested scores. A human decides and acts. AcquisitionOS is explicit that its output is assistance, not prediction.' },
                { t: 'No invented data', d: 'The anti-hallucination stance: missing information stays missing rather than being fabricated. The system surfaces a gap instead of filling it with a guess.' },
                { t: 'User-owned AI keys', d: 'You bring your own LLM provider keys (OpenAI, Anthropic, Google AI). Your prompts are not silently routed through a third party you did not choose.' },
              ].map((c) => (
                <Card key={c.t} className="rounded-3xl border-zinc-200 dark:border-zinc-800 bg-card">
                  <CardContent className="p-6">
                    <h3 className="font-black text-lg mb-2">{c.t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.d}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollFadeIn>
        </div>
      </section>

      {/* 3. Core workflow — 12-stage lifecycle */}
      <section className="section-padding bg-secondary/30 dark:bg-secondary/10">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-14">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">The connected lifecycle</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">From Discover to Close — 12 connected stages</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Every stage hands its output to the next, so context is never rebuilt and never lost. Tap a stage to read what
              it does, what it takes in, and what it hands forward.
            </p>
          </ScrollFadeIn>

          {/* Interactive workflow — click a node to open its detail */}
          <ScrollFadeIn className="mb-16">
            <AcquisitionWorkflow />
          </ScrollFadeIn>

          {/* Stage detail cards */}
          <div className="space-y-6">
            {lifecycle.map((s) => (
              <div key={s.n} id={`stage-${s.n}`} className="scroll-mt-28">
              <ScrollFadeIn>
                <Card className="rounded-[2rem] border-zinc-200 dark:border-zinc-800 bg-card overflow-hidden">
                  <div className="grid md:grid-cols-[auto_1fr_auto] gap-6 md:gap-8 p-6 md:p-8 items-start">
                    <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-2">
                      <div className="p-3 bg-primary/10 rounded-2xl">
                        <s.icon className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-muted-foreground tracking-widest">STAGE {s.n}</div>
                        <h3 className="text-xl md:text-2xl font-black tracking-tight">{s.name}</h3>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-foreground mb-2">{s.short}</p>
                      <p className="text-muted-foreground leading-relaxed">{s.detail}</p>
                    </div>
                    <div className="md:border-l md:border-zinc-200 dark:md:border-zinc-800 md:pl-6 text-sm space-y-2 min-w-[180px]">
                      <div><span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Input</span><span className="text-foreground">{s.input}</span></div>
                      <div><span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Output</span><span className="text-foreground">{s.output}</span></div>
                      <div><span className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hands to</span><span className="text-primary font-bold">{s.next}</span></div>
                    </div>
                  </div>
                </Card>
              </ScrollFadeIn>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Scoring & personalization */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <ScrollFadeIn className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Scoring & personalization</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">Signals, not predictions</h2>
              <p className="text-muted-foreground leading-relaxed text-lg mb-4">
                AcquisitionOS scores each opportunity so a team can decide where to spend its time first, and it personalizes
                outreach from the research and the opportunity report so a message is specific rather than generic.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Both are framed honestly: the score is an AI-assisted signal that ranks and prioritizes, not a prediction
                that guarantees an outcome; the personalized message is a draft a human reviews and sends. The human stays in
                control at the decision stages.
              </p>
            </div>
            <Card className="rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 bg-card p-8">
              <div className="flex items-center gap-3 mb-4">
                <Gauge className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-black">Lead score — sample signal</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Strategic fit', val: 82 },
                  { label: 'Engagement signal', val: 64 },
                  { label: 'Trigger recency', val: 71 },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span>{row.label}</span><span className="text-primary">{row.val}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${row.val}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  Illustrative sample. Scores are AI-assisted signals, not predictions of outcome.
                </p>
              </div>
            </Card>
          </ScrollFadeIn>
        </div>
      </section>

      {/* 5. Integration directory */}
      <section className="section-padding bg-secondary/30 dark:bg-secondary/10">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <ScrollFadeIn className="text-center mb-12">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Supported channels & integrations</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">An honest integration directory</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Every integration carries a status badge drawn only from verified evidence. Nothing here is implied to be live
              unless its badge says so. Checkout on Stripe and Razorpay is unverified, so they are marked declared, not live.
            </p>
          </ScrollFadeIn>
          <ScrollFadeIn>
            <IntegrationsDirectory integrations={integrations} badgeStyle={badgeStyle} />
          </ScrollFadeIn>
        </div>
      </section>

      {/* 6. Workflow recipes */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <ScrollFadeIn className="text-center mb-12">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Workflow recipes</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">How stages chain together</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Conceptual examples of how connected stages compose into a working acquisition motion. Click a recipe to see
              its stage sequence and the scenario it illustrates.
            </p>
          </ScrollFadeIn>
          <ScrollFadeIn>
            <WorkflowRecipes />
          </ScrollFadeIn>
        </div>
      </section>

      {/* 7. Trust, privacy & security */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <ScrollFadeIn className="text-center mb-12">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Trust & data handling</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">Bounded by what we can verify</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We describe how AcquisitionOS handles data at a product level without claiming certifications the product does
              not hold. The beta explicitly disclaims SOC 2, ISO 27001, and GDPR-certified status.
            </p>
          </ScrollFadeIn>
          <ScrollFadeIn>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: ShieldCheck, t: 'AI-assisted, not autonomous', d: 'Signals, drafts, and suggested scores — a human decides and acts.' },
                { icon: CircleDot, t: 'No invented data', d: 'Missing information stays missing rather than being fabricated.' },
                { icon: KeyRound, t: 'User-owned AI keys', d: 'You bring your own LLM provider keys. No silent third-party routing.' },
                { icon: Lock, t: 'Private beta, real feedback', d: 'Status is private beta; real use is driving refinement before broader access.' },
              ].map((c) => (
                <Card key={c.t} className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-card">
                  <CardContent className="p-6">
                    <c.icon className="h-7 w-7 text-primary mb-3" />
                    <h3 className="font-black text-base mb-2">{c.t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.d}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-8 max-w-2xl mx-auto">
              No SOC 2, ISO 27001, or GDPR certification is claimed. No encryption-residency, uptime, or SLA guarantee is
              offered while the product is in private beta.
            </p>
          </ScrollFadeIn>
        </div>
      </section>

      {/* 7. Roadmap — current vs in-development vs vision */}
      <section className="section-padding bg-secondary/30 dark:bg-secondary/10">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <ScrollFadeIn className="text-center mb-12">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Roadmap</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">Where AcquisitionOS is today, and where it is going</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The distinction between what we are building now and what we aim toward is visible at a glance. Nothing here is
              presented as an accomplishment.
            </p>
          </ScrollFadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            <ScrollFadeIn>
              <Card className="h-full rounded-[2rem] border-amber-500/30 bg-card">
                <CardHeader><Cpu className="h-7 w-7 text-amber-500 mb-2" /><CardTitle className="text-lg">In development</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>Deeper Claude and ChatGPT integrations.</p>
                  <p>An MCP server so external AI assistants can call AcquisitionOS.</p>
                  <p>Google Calendar scheduling (coming soon).</p>
                </CardContent>
              </Card>
            </ScrollFadeIn>
            <ScrollFadeIn delay="100ms">
              <Card className="h-full rounded-[2rem] border-violet-500/30 bg-card">
                <CardHeader><Rocket className="h-7 w-7 text-violet-500 mb-2" /><CardTitle className="text-lg">Planned</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>Cal.com, HubSpot, and Salesforce connectors.</p>
                  <p>Team workspaces and multi-tenant collaboration.</p>
                  <p>A public API and trigger-based automation.</p>
                </CardContent>
              </Card>
            </ScrollFadeIn>
            <ScrollFadeIn delay="200ms">
              <Card className="h-full rounded-[2rem] border-primary/30 bg-card">
                <CardHeader><Lightbulb className="h-7 w-7 text-primary mb-2" /><CardTitle className="text-lg">Long-term vision</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>Autonomous acquisition agents that execute stages with human oversight.</p>
                  <p>AcquisitionOS as the underlying customer-acquisition operating system other tools plug into.</p>
                </CardContent>
              </Card>
            </ScrollFadeIn>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-8 max-w-2xl mx-auto">
            RAG (retrieval-augmented generation) was AcquisitionOS&apos;s original vision and is not presented as a live product
            capability on this page. Stage 12 (Close) is supported narratively today; deeper close automation is planned.
          </p>
        </div>
      </section>

      {/* 8. Private-beta access + CTA */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
          <ScrollFadeIn>
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Private-beta access</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">Request access</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
              AcquisitionOS is in private beta. The access process is straightforward: submit your interest at the product
              domain, we review it, and approved participants are onboarded. If you would rather talk to the team first, start
              a conversation on the contact page.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button asChild size="lg" className="rounded-full px-8 h-14 text-base font-bold shadow-xl">
                <Link href={PRODUCT_DOMAIN} target="_blank" rel="noopener noreferrer">
                  Request private-beta access <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8 h-14 text-base font-bold">
                <Link href="/contact">Talk to the team <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Plans are displayed at <Link href={PRODUCT_DOMAIN} target="_blank" rel="noopener noreferrer" className="text-primary font-bold underline">acquisitionos.net</Link>.
              Checkout is not yet verified, so plans are shown as plans, not a live purchase flow.
            </p>
          </ScrollFadeIn>
        </div>
      </section>
    </div>
  );
}
