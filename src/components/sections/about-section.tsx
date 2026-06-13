
"use client";

import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Rocket, Target, Award, Milestone, Brain, Cloud, GitFork, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AboutSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            About <span className="text-primary">QuantumFusion Solutions</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Pioneering the future of IT with intelligent solutions in AI, Cloud Computing, DevOps, and SaaS Platforms.
          </p>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <ScrollFadeIn>
            <Image
              src="https://picsum.photos/seed/about-team/600/450"
              alt="QuantumFusion Solutions Team Collaboration"
              width={600}
              height={450}
              className="rounded-xl shadow-2xl object-cover"
              data-ai-hint="team work"
            />
          </ScrollFadeIn>
          <ScrollFadeIn delay="200ms">
            <h2 className="text-3xl font-bold mb-6 text-primary">Our Mission</h2>
            <p className="text-xl font-medium mb-6 italic border-l-4 border-primary pl-6 py-2">
              "Our mission is to eliminate the gap between 'we have this problem' and 'we have a working solution' — by building AI-native software that is precise, fast, and built to actually solve real pain rather than check a feature box."
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Founded with the vision to fuse cutting-edge technology with strategic business insights, QuantumFusion Solutions empowers organizations to navigate the complexities of the digital age. We believe in the transformative power of AI, the scalability of the Cloud, the efficiency of DevOps, and the agility of SaaS.
            </p>
          </ScrollFadeIn>
        </div>

        <ScrollFadeIn className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Founder</h2>
          <Card className="max-w-4xl mx-auto overflow-hidden border-none shadow-xl bg-secondary/10">
            <div className="grid md:grid-cols-3 gap-0">
              <div className="bg-primary flex items-center justify-center py-12">
                <div className="w-32 h-32 rounded-full bg-white text-primary flex items-center justify-center text-5xl font-black shadow-lg">PS</div>
              </div>
              <div className="md:col-span-2 p-8">
                <h3 className="text-2xl font-bold mb-1">Prabhat Sharma</h3>
                <p className="text-primary font-medium mb-4">Founder & Principal Engineer</p>
                <p className="text-muted-foreground mb-6">
                  Java backend developer with expertise in Spring Boot, cloud infrastructure (AWS/GCP), AI systems, and full-stack development. Building QuantumFusion Solutions as a portfolio of AI, developer, and infrastructure SaaS products while also delivering custom client projects.
                </p>
                <Button asChild variant="outline" className="gap-2">
                  <Link href="https://www.linkedin.com/company/quantumfusion-solutions" target="_blank">
                    <Linkedin className="h-4 w-4" /> LinkedIn Profile
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <ScrollFadeIn delay="0ms">
            <Card className="h-full border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-primary">AI-Native Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  We are AI-native from day one, not as a feature add-on. Every solution we build leverages the latest in intelligent automation.
                </p>
              </CardContent>
            </Card>
          </ScrollFadeIn>
          <ScrollFadeIn delay="200ms">
            <Card className="h-full border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Product Builders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  We build our own products — so we understand exactly what it takes to ship, maintain, and scale complex software systems.
                </p>
              </CardContent>
            </Card>
          </ScrollFadeIn>
          <ScrollFadeIn delay="400ms">
            <Card className="h-full border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-primary">Results Oriented</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Fixed-scope, milestone-based delivery ensures you pay for results and tangible outcomes, not just billable hours.
                </p>
              </CardContent>
            </Card>
          </ScrollFadeIn>
        </div>

        <ScrollFadeIn className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-10">Our Journey</h2>
            <div className="max-w-3xl mx-auto space-y-8">
                {[
                    { year: "2024", title: "Inception", description: "QuantumFusion Solutions founded. CodeGuard AI published on VS Code Marketplace (AWS cost intelligence)." },
                    { year: "2025", title: "Growth", description: "AcquisitionOS and SystemFoundry launched. Expansion into AI-native CRM and architecture simulation." },
                    { year: "2026", title: "New Frontiers", description: "AaharAI India-first health companion in development. First major client engagement: Maa-Aarogyam Health Centre." },
                ].map((item, index) => (
                    <div key={index} className="flex gap-6 border-l-2 border-primary/30 pl-8 relative pb-8 last:pb-0">
                        <div className="absolute w-4 h-4 bg-primary rounded-full -left-[9px] top-1 shadow-lg shadow-primary/50"></div>
                        <div>
                            <span className="text-primary font-bold text-lg">{item.year}</span>
                            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                            <p className="text-muted-foreground">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollFadeIn>

      </div>
    </section>
  );
}
