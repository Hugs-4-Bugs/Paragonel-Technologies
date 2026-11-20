import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { FlowDiagram } from '@/components/sections/flow-diagram';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitFork, GitBranch, Activity, ShieldCheck, Gauge, Rocket, ChevronRight, Boxes, ClipboardCheck, Bell } from 'lucide-react';

export const metadata: Metadata = {
  title: 'DevOps & Reliability | Paragonel',
  description:
    'Infrastructure as Code, automated CI/CD, observability, and release engineering from Paragonel. Ship frequently and safely with pipelines, guards, and rollback paths that make deploys routine.',
};

const capabilities = [
  { title: 'Infrastructure as Code', description: 'Terraform-managed infrastructure that is versioned, reviewable, and reproducible. No click-ops, no drift, no surprise snowflake environments.', icon: Boxes },
  { title: 'CI/CD pipelines', description: 'Automated build, test, and deploy pipelines with stage gates and approvals so a release is a routine event, not a high-stress night.', icon: GitBranch },
  { title: 'Observability', description: 'Metrics, logs, and traces wired so you know what is happening before a customer tells you. We instrument the signals that matter, not everything.', icon: Activity },
  { title: 'Release & rollback engineering', description: 'Progressive delivery, health-gated rollouts, and a rollback path that actually works — because the deploy that fails is the one without one.', icon: Rocket },
  { title: 'Security in the pipeline', description: 'Secret scanning, dependency review, and least-privilege deploy identities baked into the pipeline so security is a gate, not an afterthought.', icon: ShieldCheck },
  { title: 'Alerting & on-call hygiene', description: 'Alerts that fire for real symptoms, with the runbooks that tell the on-call engineer what to do. We cut noise so signals survive.', icon: Bell },
];

export default function DevOpsPage() {
  return (
    <div className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn>
          <header className="text-center mb-16">
            <GitFork className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Service</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">DevOps &amp; <span className="text-primary">Reliability</span></h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Infrastructure as Code, automated CI/CD, observability, and release engineering that lets your team ship with confidence. We build the pipelines, guards, and rollback paths that make frequent, safe deploys a routine instead of a risk.
            </p>
          </header>
        </ScrollFadeIn>

        <ScrollFadeIn delay="150ms">
          <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden shadow-2xl mb-16">
            <Image src="/images/devops-pipeline.png" alt="DevOps pipeline conceptual visual" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          </div>
        </ScrollFadeIn>

        <FlowDiagram
          eyebrow="CI/CD pipeline"
          title="From commit to monitored production"
          caption="An automated, gated pipeline that ships safely and observes what it ships."
          stages={[
            { label: "Code", icon: "Code2" },
            { label: "Commit", icon: "GitFork" },
            { label: "Build", icon: "Cpu" },
            { label: "Test", icon: "ShieldCheck" },
            { label: "Security Checks", icon: "Lock" },
            { label: "Artifact", icon: "Boxes" },
            { label: "Deploy", icon: "Rocket" },
            { label: "Monitor", icon: "Activity" },
          ]}
        />

        <ScrollFadeIn delay="200ms" className="mb-16 max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">The problem we address</h2>
          <p className="text-muted-foreground leading-relaxed text-lg mb-4">
            A release that takes a manual runbook, an environment that drifts from its definition, an incident discovered by a customer email, a deploy with no rollback — these are the everyday costs of ad-hoc DevOps. The team ships slowly because shipping is risky, and shipping is risky because there is no safe path to ship often.
          </p>
          <p className="text-muted-foreground leading-relaxed text-lg">
            It matters because release velocity is a competitive advantage only when it is safe. A fast team that breaks production loses the lead; a careful team that never ships loses the market. Good DevOps makes &ldquo;fast and safe&rdquo; the default instead of a trade-off.
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
                We make the path to production boring on purpose. Everything that can be versioned is versioned, everything that can be automated is automated, and every deploy has a health gate and a rollback. We instrument the few signals that matter so the team can see a problem before it becomes an incident.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> Engagement</h4>
                  <p className="text-sm">Pipeline and IaC setup for a new product, or a reliability overhaul of an existing release process that has become a bottleneck.</p>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2 flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" /> Typical deliverables</h4>
                  <p className="text-sm">Terraform modules, CI/CD pipelines, observability dashboards, alert rules with runbooks, and a tested rollback procedure.</p>
                </div>
              </div>
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <h4 className="font-bold text-foreground mb-2">Technology we use</h4>
                <p className="text-sm">Terraform, GitHub Actions / GitLab CI, Kubernetes, Docker, Prometheus / Grafana / OpenTelemetry, AWS and GCP native services.</p>
              </div>
            </CardContent>
          </Card>
        </ScrollFadeIn>

        <ScrollFadeIn delay="450ms" className="mb-16 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-primary/20 bg-secondary/30 dark:bg-secondary/10 p-6 md:p-8">
            <h3 className="font-bold text-foreground mb-2">Where we are explicit</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We do not promise zero downtime or zero incidents. We promise a release path that is automated, health-gated, and reversible, and observability that shows you what is happening. Reliability is a practice, not a one-time fix.
            </p>
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay="500ms" className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Make shipping safe and routine</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">Tell us where your release process hurts. We will build the pipeline and the guardrails.</p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/contact">Discuss your DevOps needs <ChevronRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
