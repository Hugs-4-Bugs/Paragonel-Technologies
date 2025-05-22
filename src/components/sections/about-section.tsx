
"use client";

import Image from 'next/image';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Rocket, Target, Award, Milestone } from 'lucide-react';

export function AboutSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            About <span className="text-primary">QuantumLeap</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Pioneering the future of career development and talent acquisition through innovative technology and personalized experiences.
          </p>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <ScrollFadeIn>
            <Image
              src="https://placehold.co/600x400/3498DB/FFFFFF.png?text=Our+Journey"
              alt="QuantumLeap Team Collaboration"
              width={600}
              height={400}
              className="rounded-xl shadow-2xl object-cover"
              data-ai-hint="team collaboration"
            />
          </ScrollFadeIn>
          <ScrollFadeIn delay="200ms">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Founded with the vision to revolutionize how talent connects with opportunity, QuantumLeap has been dedicated to creating a platform that empowers individuals and organizations alike. We believe in the power of technology to unlock human potential.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our journey started with a simple idea: to make career exploration more intuitive, insightful, and inspiring. Today, we leverage cutting-edge AI and a user-centric approach to deliver on that promise.
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
                  To empower individuals to achieve their career aspirations and help organizations find the perfect talent by providing an intelligent, seamless, and inspiring platform.
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
                  To be the leading force in shaping the future of work, where every connection between talent and opportunity is meaningful, efficient, and transformative.
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
                  <li>Innovation</li>
                  <li>Integrity</li>
                  <li>User-Centricity</li>
                  <li>Collaboration</li>
                  <li>Excellence</li>
                </ul>
              </CardContent>
            </Card>
          </ScrollFadeIn>
        </div>

        <ScrollFadeIn className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-10">Company Timeline</h2>
            <div className="relative">
                {/* Desktop Timeline */}
                <div className="hidden md:block border-l-2 border-primary absolute h-full top-0 left-1/2 transform -translate-x-1/2"></div>
                
                {[
                    { year: "2021", title: "Conceptualization", description: "QuantumLeap idea was born.", side: "left" },
                    { year: "2022", title: "Platform Development", description: "Core platform and AI engine built.", side: "right" },
                    { year: "2023", title: "Beta Launch", description: "Launched to early adopters, gathered feedback.", side: "left" },
                    { year: "2024", title: "Public Release", description: "Official launch with enhanced features.", side: "right" },
                ].map((item, index) => (
                    <div key={index} className={`mb-8 flex md:justify-between items-center w-full ${item.side === 'left' ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                        <div className="order-1 md:w-5/12"></div>
                        <div className="z-20 flex items-center order-1 bg-primary shadow-xl w-12 h-12 rounded-full md:w-10 md:h-10">
                            <Milestone className="mx-auto font-semibold text-lg text-white w-6 h-6" />
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
