
"use client";

import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Rocket, Target, Linkedin, ShieldCheck, Milestone, User, Code2, Briefcase, Github, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AboutSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 text-foreground">
            About <span className="text-primary">QuantumFusion Solutions</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
            Pioneering the future of IT with intelligent solutions in AI, Cloud Computing, DevOps, and SaaS Platforms.
          </p>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <ScrollFadeIn className="relative aspect-square md:aspect-auto md:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl bg-primary/5 flex items-center justify-center border-2 border-primary/10">
            <div className="text-center p-12">
               <ShieldCheck className="h-32 w-32 text-primary mx-auto mb-6 neon-icon" />
               <h3 className="text-3xl font-black text-primary mb-2">Team Collaboration</h3>
               <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">A QuantumFusion Brand Identity</p>
            </div>
          </ScrollFadeIn>
          <ScrollFadeIn delay="200ms">
            <span className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-4 block">Our Mission</span>
            <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">Eliminating the gap between problem and solution.</h2>
            <p className="text-xl font-medium mb-8 italic border-l-4 border-primary pl-6 py-2 text-foreground/80 leading-relaxed">
              "Our mission is to eliminate the gap between 'we have this problem' and 'we have a working solution' — by building AI-native software that is precise, fast, and built to actually solve real pain rather than check a feature box."
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Founded with the vision to fuse cutting-edge technology with strategic business insights, QuantumFusion Solutions empowers organizations to navigate the complexities of the digital age. We believe in the transformative power of AI, the scalability of the Cloud, the efficiency of DevOps, and the agility of SaaS.
            </p>
          </ScrollFadeIn>
        </div>

        {/* Founder Section */}
        <ScrollFadeIn className="mb-24">
          <Card className="overflow-hidden border-none shadow-2xl bg-secondary/10 rounded-[3rem]">
            <div className="grid md:grid-cols-3 gap-0">
              <div className="bg-primary flex items-center justify-center py-12 md:py-0 text-white relative">
                <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white/40 shadow-2xl">
                  <Image 
                    src="/images/Prabhat.png" 
                    alt="Prabhat Sharma" 
                    fill 
                    className="object-cover" 
                    unoptimized
                  />
                </div>
              </div>
              <div className="md:col-span-2 p-8 md:p-12">
                <span className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-2 block">Meet Our Founder</span>
                <h3 className="text-3xl font-black mb-1">Prabhat Sharma</h3>
                <p className="text-primary font-bold mb-6">Founder & Lead Architect</p>
                <div className="space-y-4 text-muted-foreground leading-relaxed mb-8">
                  <p>
                    Prabhat Sharma is the visionary Founder and Lead Architect of QuantumFusion Solutions, holding a Bachelor of Engineering in Computer Science. A specialist Java Backend Developer, he brings expertise in architecting high-performance systems using Spring Boot and cloud-native infrastructures (AWS/GCP).
                  </p>
                  <p>
                    Before embarking on his journey as a solo founder, Prabhat spent significant years as an engineer at Netcore Cloud. During his tenure there, he specialized in architecting and maintaining backend systems at massive scale—handling millions of real-time events and data streams.
                  </p>
                  <p>
                    Today, he leverages that high-scale expertise to build QuantumFusion's portfolio of SaaS products, including AcquisitionOS (AI CRM) and SystemFoundry (Architecture Simulator), while helping global clients solve their most complex technical bottlenecks through precision engineering.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button asChild size="sm" className="rounded-full shadow-lg h-12 px-8 font-bold">
                    <Link href="https://www.linkedin.com/in/prabhat-kumar-6963661a4/" target="_blank" className="flex items-center gap-2">
                      <Linkedin className="h-5 w-5" /> LinkedIn Profile
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-full h-12 px-8 font-bold">
                    <Link href="https://www.prabhat.online/" target="_blank" className="flex items-center gap-2">
                      <Globe className="h-5 w-5" /> Engineering Hub
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </ScrollFadeIn>

        <ScrollFadeIn className="mb-24">
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { 
                title: "AI-Native Focus", 
                text: "We are AI-native from day one, not as a feature add-on. Every solution we build leverages the latest in intelligent automation.", 
                icon: Brain 
              },
              { 
                title: "Product Builders", 
                text: "We build our own products — so we understand exactly what it takes to ship, maintain, and scale complex software systems.", 
                icon: Code2 
              },
              { 
                title: "Results Oriented", 
                text: "Fixed-scope, milestone-based delivery ensures you pay for results and tangible outcomes, not just billable hours.", 
                icon: Target 
              }
            ].map((value, i) => (
              <Card key={i} className="p-8 rounded-[2.5rem] border-zinc-100 dark:border-zinc-800 shadow-xl bg-card hover:border-primary/30 transition-all group">
                <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <value.icon className="h-8 w-8 text-primary" />
                </div>
                <h4 className="text-2xl font-black mb-4 tracking-tight">{value.title}</h4>
                <p className="text-zinc-500 font-medium leading-relaxed">{value.text}</p>
              </Card>
            ))}
          </div>
        </ScrollFadeIn>

        {/* Journey Timeline */}
        <ScrollFadeIn className="mb-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Our Journey</h2>
          </div>
          <div className="max-w-4xl mx-auto space-y-12">
            {[
              {
                year: "2024",
                title: "Inception",
                description: "QuantumFusion Solutions founded. CodeGuard AI published on VS Code Marketplace (AWS cost intelligence)."
              },
              {
                year: "2025",
                title: "Growth",
                description: "AcquisitionOS and SystemFoundry launched. Expansion into AI-native CRM and architecture simulation."
              },
              {
                year: "2026",
                title: "New Frontiers",
                description: "AaharAI India-first health companion in development. First major client engagement: Maa-Aarogyam Health Centre."
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 md:gap-10 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-black text-xl shadow-xl shadow-primary/20">
                    {item.year}
                  </div>
                  {i !== 2 && <div className="w-1 h-24 bg-gradient-to-b from-primary to-transparent opacity-20"></div>}
                </div>
                <div className="pt-2">
                  <h4 className="text-2xl font-black text-primary mb-2">{item.title}</h4>
                  <p className="text-lg text-muted-foreground font-medium">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
