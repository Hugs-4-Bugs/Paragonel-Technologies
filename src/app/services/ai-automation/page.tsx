
"use client";

import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Zap, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AiAutomationPage() {
  return (
    <div className="section-padding bg-background min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn>
          <Button asChild variant="ghost" className="mb-8">
            <Link href="/services"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Services</Link>
          </Button>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Zap className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">AI Automation & Integration</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mb-12">
            Add intelligence to your existing workflows. We automate repetitive tasks and integrate advanced LLMs to save your team hundreds of hours.
          </p>
        </ScrollFadeIn>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <ScrollFadeIn delay="200ms" className="space-y-6">
            <h2 className="text-2xl font-bold">Intelligent Workflows</h2>
            <p className="text-muted-foreground">
              Don't just use AI; integrate it into your business processes. We build custom RAG (Retrieval Augmented Generation) pipelines that understand your company's documents and data.
            </p>
            <ul className="space-y-4">
              {[
                "LLM Integration (Claude, Gemini, GPT)",
                "Multi-agent AI systems using CrewAI",
                "Automated document intelligence & RAG",
                "Repetitive task automation & AI scripting"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ScrollFadeIn>
          <ScrollFadeIn delay="400ms" className="bg-secondary/10 p-8 rounded-3xl border border-primary/10">
            <h3 className="text-xl font-bold mb-4 text-primary">Efficiency First</h3>
            <p className="text-muted-foreground mb-6 italic">"AI automation isn't about replacing people; it's about giving them 60 hours back every month to focus on what matters."</p>
            <div className="space-y-4 text-sm font-medium">
              <p>Impact: 20-60 hours saved/month/user</p>
              <p>Integration: Legacy and Modern systems</p>
            </div>
          </ScrollFadeIn>
        </div>
      </div>
    </div>
  );
}
