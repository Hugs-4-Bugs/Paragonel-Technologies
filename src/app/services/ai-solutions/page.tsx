import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { FlowDiagram } from '@/components/sections/flow-diagram';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Bot, Database, GitBranch, ShieldCheck, Gauge, ChevronRight, Workflow, KeyRound, ClipboardCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Solutions & LLM Ops | Paragonel',
  description:
    'Paragonel integrates large language models into real product workflows — retrieval-augmented generation, agentic orchestration, prompt evaluation, and LLM operations inside your cloud boundary with your own provider keys.',
};

const capabilities = [
  { title: 'Retrieval-augmented generation', description: 'Ground LLM output in your own documents and data so answers cite a source instead of hallucinating. We build the retrieval pipeline, the chunking strategy, and the evaluation harness.', icon: Database },
  { title: 'Agentic workflows', description: 'Multi-step AI workflows that retrieve, reason, and act under human-defined guardrails — the same pattern we use in AcquisitionOS for research, scoring, and personalization.', icon: Workflow },
  { title: 'LLM operations', description: 'Prompt versioning, evaluation sets, cost monitoring, and fallback routing so a model change is a measured release, not a leap of faith.', icon: GitBranch },
  { title: 'Bring-your-own-key architecture', description: 'Customers use their own OpenAI, Anthropic, or Google AI keys. No silent third-party routing — a design we ship in AcquisitionOS and can bring to your product.', icon: KeyRound },
  { title: 'AI-assisted, not autonomous', description: 'We frame AI output as signals, drafts, and suggested scores. A human decides and acts. We do not build unsupervised decision systems.', icon: Bot },
  { title: 'Anti-hallucination stance', description: 'Missing information stays missing rather than being fabricated. The system surfaces a gap instead of inventing a value to fill it.', icon: ShieldCheck },
];

export default function AISolutionsPage() {
  return (
    <div className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn>
          <header className="text-center mb-16">
            <Brain className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Service</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">AI Solutions &amp; <span className="text-primary">LLM Ops</span></h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We integrate large language models into real product workflows. Not a chatbot widget bolted on after the fact, but retrieval, reasoning, and generation built into the core of how your product works — inside your own cloud boundary, with your own provider keys.
            </p>
          </header>
        </ScrollFadeIn>

        <ScrollFadeIn delay="150ms">
          <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden shadow-2xl mb-16">
            <Image src="/images/ai-abstract.png" alt="AI integration conceptual visual" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          </div>
        </ScrollFadeIn>

        <FlowDiagram
          eyebrow="AI architecture"
          title="From data sources to evaluated AI output"
          caption="A retrieval-augmented, orchestrated pipeline that grounds LLM output in your data and measures when it is working."
          stages={[
            { label: "Data Sources", icon: "Database" },
            { label: "Ingestion", icon: "ArrowDownToLine" },
            { label: "Processing", icon: "Cpu" },
            { label: "Embeddings / Retrieval", icon: "Search" },
            { label: "LLM Orchestration", icon: "Brain" },
            { label: "Application", icon: "Boxes" },
            { label: "Evaluation / Monitoring", icon: "Gauge" },
          ]}
        />

        <ScrollFadeIn delay="200ms" className="mb-16 max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">The problem we address</h2>
          <p className="text-muted-foreground leading-relaxed text-lg mb-4">
            Most teams that &ldquo;add AI&rdquo; end up with a prompt someone pastes into a model, with no retrieval, no evaluation, no guardrails, and no idea what it costs or when it hallucinates. The result is a demo that excites in a meeting and embarrasses in production. The gap between an AI demo and an AI capability that ships is engineering — retrieval design, evaluation, operations, and the discipline to say &ldquo;missing&rdquo; instead of guessing.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg">
            It matters because AI is now table-stakes, but unreliable AI is worse than no AI: it erodes trust the moment it confidently invents a wrong answer. The teams that win treat AI as an engineering surface, not a magic box.
          </p>
        </ScrollFadeIn>

        <ScrollFadeIn delay="300ms" className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">What we deliver</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {capabilities.map((feature) => (
              <Card key={feature.title} className="shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
                <CardHeader>
                  <feature.icon className="h-8 w-8 text-primary mb-3 neon-icon" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay="400ms" className="mb-16 max-w-4xl mx-auto">
          <Card className="bg-card shadow-xl rounded-2xl">
            <CardHeader><CardTitle className="text-2xl">How we approach it</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                We start from the workflow you want AI to assist, not from the model. We design the retrieval that grounds it, the guardrails that bound it, and the evaluation that tells you when it is working. We integrate inside your existing cloud boundary so your data does not leave a perimeter you control, and we wire it to bring-your-own provider keys so the model choice and the spend stay yours.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> Engagement</h4>
                  <p className="text-sm">Fixed-scope AI integration projects, or retainer-based LLM-ops support for a product already in production.</p>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" /> Typical deliverables</h4>
                  <p className="text-sm">A retrieval pipeline, an evaluation harness, prompt and model versioning, cost monitoring, and a documented handover.</p>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <h4 className="font-bold text-foreground mb-2">Technology we use</h4>
                <p className="text-sm">Next.js / Node backends, Python services, Genkit + Google Gemini, OpenAI / Anthropic / Google AI via customer keys, vector stores, Spring Boot where Java is the existing stack.</p>
              </div>
            </CardContent>
          </Card>
        </ScrollFadeIn>

        <ScrollFadeIn delay="450ms" className="mb-16 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-primary/20 bg-secondary/30 dark:bg-secondary/10 p-6 md:p-8">
            <h3 className="font-bold text-foreground mb-2">Where we are explicit</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We do not promise that AI output is a prediction or a guaranteed outcome. We build AI-assisted systems where a human decides. We will not ship an unsupervised decision system into a high-stakes workflow, and we will not claim accuracy or cost-reduction numbers for your use case until we have measured them against your data.
            </p>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay="500ms" className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Bring AI into your product workflow</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">Tell us the workflow you want AI to assist. We will design the retrieval, the guardrails, and the evaluation.</p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/contact">Discuss your AI project <ChevronRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
