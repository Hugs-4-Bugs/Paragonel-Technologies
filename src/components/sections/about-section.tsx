
"use client";

import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Rocket, Target, Award, Milestone, Brain, Cloud, GitFork } from 'lucide-react';

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
              src="https://placehold.co/600x450.png"
              alt="QuantumFusion Solutions Team Collaboration"
              width={600}
              height={450}
              className="rounded-xl shadow-2xl object-cover"
              data-ai-hint="abstract tech innovation"
            />
          </ScrollFadeIn>
          <ScrollFadeIn delay="200ms">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Founded with the vision to fuse cutting-edge technology with strategic business insights, QuantumFusion Solutions empowers organizations to navigate the complexities of the digital age. We believe in the transformative power of AI, the scalability of the Cloud, the efficiency of DevOps, and the agility of SaaS.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our journey began with a commitment to innovation and a passion for solving complex challenges. Today, we partner with businesses globally, helping them achieve quantum leaps in performance and market leadership.
            </p>
          </ScrollFadeIn>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <ScrollFadeIn delay="0ms">
            <Card className="h-full text-center shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Target className="h-12 w-12 text-primary mx-auto mb-4 neon-icon" />
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To deliver transformative IT solutions that drive innovation, efficiency, and sustainable growth for our clients worldwide.
                </p>
              </CardContent>
            </Card>
          </ScrollFadeIn>
          <ScrollFadeIn delay="200ms">
            <Card className="h-full text-center shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Rocket className="h-12 w-12 text-primary mx-auto mb-4 neon-icon" />
                <CardTitle className="text-2xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To be the leading catalyst in our clients' digital transformation journeys, shaping a future where technology and human ingenuity converge.
                </p>
              </CardContent>
            </Card>
          </ScrollFadeIn>
          <ScrollFadeIn delay="400ms">
            <Card className="h-full text-center shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Award className="h-12 w-12 text-primary mx-auto mb-4 neon-icon" />
                <CardTitle className="text-2xl">Our Values</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside text-left pl-4">
                  <li>Innovation First</li>
                  <li>Client Centricity</li>
                  <li>Unwavering Integrity</li>
                  <li>Collaborative Spirit</li>
                  <li>Pursuit of Excellence</li>
                </ul>
              </CardContent>
            </Card>
          </ScrollFadeIn>
        </div>

        <ScrollFadeIn className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-10">Our Journey: Milestones</h2>
            <div className="relative">
                <div className="hidden md:block border-l-2 border-primary absolute h-full top-0 left-1/2 transform -translate-x-1/2"></div>
                
                {[
                    { year: "2020", title: "Inception & Vision", description: "QuantumFusion Solutions founded with a focus on next-gen IT.", icon: Rocket, side: "left" },
                    { year: "2021", title: "AI Lab Established", description: "Launched dedicated AI research and development wing.", icon: Brain, side: "right" },
                    { year: "2022", title: "Cloud Partnerships", description: "Forged strategic alliances with major cloud providers.", icon: Cloud, side: "left" },
                    { year: "2023", title: "DevOps Excellence", description: "Recognized for DevOps automation and CI/CD implementations.", icon: GitFork, side: "right" },
                    { year: "2024", title: "Global Expansion", description: "Expanded operations to serve a wider international client base.", icon: Milestone, side: "left" },
                ].map((item, index) => (
                    <div key={index} className={`mb-8 flex md:justify-between items-center w-full ${item.side === 'left' ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                        <div className="order-1 md:w-5/12"></div>
                        <div className="z-20 flex items-center order-1 bg-primary shadow-xl w-12 h-12 rounded-full md:w-10 md:h-10">
                            <item.icon className="mx-auto font-semibold text-lg text-white w-6 h-6 neon-icon" />
                        </div>
                        <div className={`order-1 rounded-lg shadow-xl w-full md:w-5/12 px-6 py-4 ${item.side === 'left' ? 'bg-card md:text-right' : 'bg-card'}`}>
                            <p className="font-bold text-primary text-xl">{item.year}</p>
                            <h3 className="mb-3 font-bold text-foreground text-lg">{item.title}</h3>
                            <p className="text-sm leading-snug tracking-wide text-muted-foreground text-opacity-100">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollFadeIn>

      </div>
    </section>
  );
}
