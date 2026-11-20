
"use client";

import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Code2, Target, Linkedin, ShieldCheck, Globe, Compass, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AboutSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">About Paragonel</span>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 text-foreground">
            An AI-native <span className="text-primary">product-engineering</span> company
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
            Paragonel Technologies Pvt. Ltd. builds AI-native software that solves real business pain. We ship our own
            products — including AcquisitionOS, our flagship client-acquisition platform — and deliver the engineering
            services that stand them up.
          </p>
        </ScrollFadeIn>

        {/* Mission */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <ScrollFadeIn className="relative aspect-square md:aspect-auto md:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl bg-primary/5 flex items-center justify-center border-2 border-primary/10">
            <div className="text-center p-12">
               <ShieldCheck className="h-32 w-32 text-primary mx-auto mb-6 neon-icon" />
               <h3 className="text-3xl font-black text-primary mb-2">Precision Engineering</h3>
               <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">A Paragonel Engineering Philosophy</p>
            </div>
          </ScrollFadeIn>
          <ScrollFadeIn delay="200ms">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Our Mission</span>
            <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">Eliminating the gap between problem and solution.</h2>
            <p className="text-xl font-medium mb-8 italic border-l-4 border-primary pl-6 py-2 text-foreground/80 leading-relaxed">
              &ldquo;Our mission is to eliminate the gap between &lsquo;we have this problem&rsquo; and &lsquo;we have a working
              solution&rsquo; — by building AI-native software that is precise, fast, and built to actually solve real pain
              rather than check a feature box.&rdquo;
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Paragonel exists to close that gap. We build AI-native products and platform capability that help businesses
              acquire, retain, and serve customers with measurably less manual effort — and we deliver the cloud, DevOps,
              AI, and product-engineering services that make those products possible. The product work and the services
              work feed each other: engagements surface patterns that shape our products, and our products validate the
              engineering we deliver.
            </p>
          </ScrollFadeIn>
        </div>

        {/* Founder */}
        <ScrollFadeIn className="mb-24">
          <Card className="overflow-hidden border-none shadow-2xl bg-secondary/10 rounded-[3rem]">
            <div className="grid md:grid-cols-3 gap-0">
              <div className="bg-primary flex items-center justify-center py-12 md:py-0 text-white relative">
                <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white/40 shadow-2xl">
                  <Image
                    src="/images/Prabhat.png"
                    alt="Prabhat Kumar"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
              <div className="md:col-span-2 p-8 md:p-12">
                <span className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-2 block">Founder &amp; CEO</span>
                <h3 className="text-3xl font-black mb-1">Prabhat Kumar</h3>
                <p className="text-primary font-bold mb-6">Founder &amp; CEO, Paragonel Technologies Pvt. Ltd.</p>
                <div className="space-y-4 text-muted-foreground leading-relaxed mb-8">
                  <p>
                    Prabhat Kumar is the Founder &amp; CEO of Paragonel Technologies. He holds a Bachelor of Engineering in
                    Computer Science and is a specialist Java backend developer, with expertise in architecting
                    high-performance systems using Spring Boot and cloud-native infrastructure on AWS and GCP.
                  </p>
                  <p>
                    Before founding Paragonel, Prabhat spent significant years as an engineer at Netcore Cloud, where he
                    worked on backend systems operating at massive scale — handling millions of real-time events. That
                    background in high-concurrency engineering is the foundation of Paragonel&apos;s &ldquo;Precision
                    Engineering&rdquo; philosophy: small, named, verifiable systems built to behave exactly as specified.
                  </p>
                  <p>
                    Today, Prabhat leads Paragonel as the architect behind its product portfolio — including AcquisitionOS,
                    an AI-native client acquisition platform now in private beta — while overseeing the engineering services
                    the company delivers. The same stance that refuses to invent a metric on the marketing site refuses to
                    invent a data point in an AcquisitionOS opportunity report: missing information stays missing.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button asChild size="sm" className="rounded-full shadow-lg h-12 px-8 font-bold">
                    <Link href="https://www.linkedin.com/in/prabhat-kumar-6963661a4/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <Linkedin className="h-5 w-5" /> LinkedIn Profile
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-full h-12 px-8 font-bold">
                    <Link href="https://www.prabhat.online/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <Globe className="h-5 w-5" /> Engineering Hub
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </ScrollFadeIn>

        {/* Engineering principles */}
        <ScrollFadeIn className="mb-24">
          <div className="text-center mb-12">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">How we engineer</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Five principles we build by</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Compass, t: 'Precision over breadth', d: 'Ship a named, verifiable core rather than a broad surface of half-features.' },
              { icon: ShieldCheck, t: 'Missing stays missing', d: 'Never fabricate to fill a gap — in code, in data, or in marketing.' },
              { icon: Brain, t: 'Fail closed', d: 'Security and availability paths default to denial, not to open access.' },
              { icon: Code2, t: 'Skin in the game', d: 'We build and run our own products to validate the engineering we sell.' },
              { icon: Target, t: 'AI-assisted, not autonomous', d: 'Signals, drafts, and suggested scores — a human decides and acts.' },
              { icon: Rocket, t: 'Capability, not results', d: 'Until a claim is verified, we describe what a system is built to do, not what it has achieved.' },
            ].map((value, i) => (
              <Card key={i} className="p-6 rounded-[2rem] border-zinc-100 dark:border-zinc-800 shadow-xl bg-card hover:border-primary/30 transition-all group">
                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-black mb-2 tracking-tight">{value.t}</h4>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed">{value.d}</p>
              </Card>
            ))}
          </div>
        </ScrollFadeIn>

        {/* Paragonel <-> AcquisitionOS relationship */}
        <ScrollFadeIn className="mb-24">
          <div className="rounded-[3rem] border border-primary/20 bg-secondary/30 dark:bg-secondary/10 p-8 md:p-12">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Paragonel &amp; AcquisitionOS</span>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-6">A product that embodies the company</h2>
            <p className="text-muted-foreground leading-relaxed text-lg mb-4">
              AcquisitionOS is Paragonel&apos;s flagship product, currently in private beta. The relationship is structural,
              not incidental: the product embodies the company&apos;s engineering philosophy at the workflow level — the same
              anti-hallucination stance and AI-assisted-not-autonomous framing that defines how Paragonel builds.
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              The services practice feeds and is fed by the product: engagements surface acquisition patterns that inform
              AcquisitionOS, and AcquisitionOS validates the AI and platform engineering the services practice delivers. The
              product is the identity and the destination; the services are the current capability and the revenue engine.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" className="rounded-full h-12 px-8 font-bold">
                <Link href="/our-product/acquisitionos">Explore AcquisitionOS</Link>
              </Button>
            </div>
          </div>
        </ScrollFadeIn>

        {/* Journey — honest, no invented dates/clients */}
        <ScrollFadeIn className="mb-24">
          <div className="text-center mb-16">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Our journey</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Where we are today</h2>
          </div>
          <div className="max-w-4xl mx-auto space-y-12">
            {[
              {
                year: "2024",
                title: "Founded",
                description: "Paragonel Technologies founded. CodeGuard AI — real-time cloud cost intelligence for developers — published on the VS Code Marketplace."
              },
              {
                year: "2024–25",
                title: "Building the portfolio",
                description: "AcquisitionOS and SystemFoundry built. AcquisitionOS enters private beta, with real-user feedback driving product refinement and workflow validation."
              },
              {
                year: "Today",
                title: "Private beta & services",
                description: "AcquisitionOS in private beta. Services practice active across AI, cloud, DevOps, and product engineering. Long-term vision: an acquisition operating system other tools and AI assistants can plug into."
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 md:gap-10 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm shadow-xl shadow-primary/20 text-center px-1">
                    {item.year}
                  </div>
                  {i !== 2 && <div className="w-1 h-24 bg-gradient-to-b from-primary to-transparent opacity-20"></div>}
                </div>
                <div className="pt-2">
                  <h4 className="text-2xl font-black text-primary mb-2">{item.title}</h4>
                  <p className="text-lg text-muted-foreground font-medium leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollFadeIn>

        {/* Long-term vision — explicitly labeled */}
        <ScrollFadeIn>
          <div className="rounded-[3rem] border border-primary/10 bg-background p-8 md:p-12 text-center max-w-4xl mx-auto">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Long-term vision · aspiration, not current delivery</span>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-6">Where we aim</h2>
            <p className="text-muted-foreground leading-relaxed text-lg mb-4">
              Our long-term vision is for AcquisitionOS to become the underlying customer-acquisition operating system its
              customers run their acquisition motion on — a platform other tools and AI assistants can plug into, with
              autonomous acquisition agents that execute lifecycle stages under human oversight.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is aspiration, explicitly separated from current delivery. Today AcquisitionOS is in private beta with a
              working core; the services practice is the commercial engine. The gap between aspiration and delivery is the
              roadmap, and it is not hidden.
            </p>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
