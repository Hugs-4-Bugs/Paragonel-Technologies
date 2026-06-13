
"use client";

import React, { useState } from 'react';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Cloud, Rocket, Laptop, Zap, Users, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CareersPage() {
  const [department, setDepartment] = useState('All');
  const [type, setType] = useState('All');

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-black/20 z-0"></div>
        <div className="container relative z-10 px-4 md:px-6 text-center">
          <ScrollFadeIn>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">Careers at <br/><span className="opacity-80">QuantumFusion</span></h1>
            <p className="text-xl max-w-2xl mx-auto opacity-90">Building real products. Solving complex challenges. No bureaucracy.</p>
          </ScrollFadeIn>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Join Us</h2>
          </ScrollFadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Brain, title: "Interesting Problems", text: "Work on AI, cloud architecture, and real SaaS products." },
              { icon: Laptop, title: "Remote-Friendly", text: "Bangalore based with full flexibility to work where you are best." },
              { icon: Zap, title: "Learn by Shipping", text: "We build real products used by real people every day." },
              { icon: Users, title: "Founder Access", text: "Direct access to leadership. Your voice actually matters." }
            ].map((perk, i) => (
              <ScrollFadeIn key={i} delay={`${i * 100}ms`}>
                <Card className="h-full border-none shadow-md bg-secondary/20">
                  <CardHeader>
                    <perk.icon className="h-10 w-10 text-primary mb-2" />
                    <CardTitle className="text-lg">{perk.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{perk.text}</p>
                  </CardContent>
                </Card>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="section-padding bg-secondary/10" id="open-roles">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Current Openings</h2>
          </ScrollFadeIn>

          {/* Filter Bar */}
          <ScrollFadeIn className="flex flex-col md:flex-row gap-4 mb-12 max-w-4xl mx-auto">
            <div className="flex-grow flex gap-4">
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Departments</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Full Time">Full Time</SelectItem>
                  <SelectItem value="Part Time">Part Time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="shrink-0"><Search className="mr-2 h-4 w-4" /> Filter</Button>
          </ScrollFadeIn>

          {/* Empty State */}
          <ScrollFadeIn className="text-center py-20 bg-background border border-dashed border-primary/30 rounded-3xl">
            <Rocket className="h-16 w-16 text-primary/20 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-2">No active openings right now</h3>
            <p className="text-muted-foreground mb-8">But we are always looking for great talent. Drop your resume at:</p>
            <a href="mailto:careers@quantumfusion.in" className="text-2xl font-black text-primary hover:underline">careers@quantumfusion.in</a>
            <p className="mt-4 text-sm text-muted-foreground">We'll reach out when something fits your profile.</p>
          </ScrollFadeIn>
        </div>
      </section>

      {/* Application Process */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Application Process</h2>
          </ScrollFadeIn>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              "Apply via careers or chatbot",
              "Resume screening (within 48h)",
              "Practical technical interview",
              "Offer & Onboarding"
            ].map((step, i) => (
              <ScrollFadeIn key={i} delay={`${i * 100}ms`} className="p-6 bg-secondary/10 rounded-2xl relative">
                <span className="text-primary font-black text-xl mb-4 block">0{i+1}</span>
                <p className="font-bold">{step}</p>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Perks Grid */}
      <section className="section-padding bg-secondary/10">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Perks & Benefits</h2>
          </ScrollFadeIn>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            {[
              "Remote-first", "Founder Mentorship", "Real Products", "Fast Growth", "Competitive Pay", "Learning Budget"
            ].map((p, i) => (
              <ScrollFadeIn key={i} delay={`${i * 50}ms`} className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-bold">{p}</span>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
