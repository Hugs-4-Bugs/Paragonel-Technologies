
"use client";

import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  ShieldCheck, 
  Scaling, 
  Award, 
  CheckCircle2, 
  Brain, 
  Code2, 
  Cloud, 
  LineChart 
} from 'lucide-react';

const solutions = [
  {
    title: "AI Solutions",
    icon: Brain,
    description: "Build intelligent systems that automate repetitive work, improve decision-making, and deliver personalized customer experiences.",
    capabilities: ["AI Agents", "Internal AI Copilots", "Knowledge Assistants", "Customer Support Automation", "Document Intelligence"]
  },
  {
    title: "Custom Software Development",
    icon: Code2,
    description: "Design and build scalable software tailored to your business processes and growth objectives.",
    capabilities: ["SaaS Platforms", "Enterprise Applications", "Internal Business Systems", "Workflow Automation", "Customer Portals"]
  },
  {
    title: "Cloud & DevOps",
    icon: Cloud,
    description: "Modernize infrastructure, improve reliability, and deploy software faster with cloud-native solutions.",
    capabilities: ["Cloud Migration", "CI/CD Automation", "Infrastructure Management", "Monitoring & Observability", "Scalability Engineering"]
  },
  {
    title: "Data & Analytics",
    icon: LineChart,
    description: "Transform raw data into actionable insights that support better business decisions.",
    capabilities: ["Dashboards", "Business Intelligence", "Data Pipelines", "Reporting Systems", "KPI Monitoring"]
  }
];

const trustFactors = [
  {
    title: "Faster Delivery",
    description: "Reduce development cycles through modern engineering practices and automation.",
    icon: Zap
  },
  {
    title: "Scalable Architecture",
    description: "Build systems designed to grow with your business and handle massive user loads.",
    icon: Scaling
  },
  {
    title: "Security First",
    description: "Implement secure-by-design practices across applications and cloud infrastructure.",
    icon: ShieldCheck
  },
  {
    title: "End-to-End Ownership",
    description: "From strategy and design to deployment and ongoing proactive support.",
    icon: Award
  }
];

export function TechStackSection() {
  return (
    <div className="space-y-20">
      {/* 3. Problems We Solve / Solutions Section */}
      <section id="solutions" className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
              Solutions That <span className="text-primary">Drive Growth</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
              We help startups, enterprises, and growing businesses eliminate operational bottlenecks, automate workflows, modernize software systems, and accelerate growth using AI, cloud, and custom software solutions.
            </p>
          </ScrollFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {solutions.map((item, i) => (
              <ScrollFadeIn key={item.title} delay={`${i * 100}ms`}>
                <Card className="h-full border-zinc-200 dark:border-zinc-800 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-[2rem] bg-card flex flex-col group">
                  <CardHeader className="pb-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">{item.title}</CardTitle>
                    <CardDescription className="text-sm font-medium leading-relaxed pt-2">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <div className="space-y-2">
                      {item.capabilities.map((cap) => (
                        <div key={cap} className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          {cap}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us Section */}
      <section className="section-padding bg-secondary/30 dark:bg-secondary/10 border-y border-zinc-100 dark:border-zinc-800">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Why Businesses Choose <span className="text-primary">Paragonel</span>
            </h2>
          </ScrollFadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {trustFactors.map((factor, i) => (
              <ScrollFadeIn key={factor.title} delay={`${i * 100}ms`}>
                <div className="p-8 rounded-[2rem] bg-background border border-zinc-100 dark:border-zinc-800 shadow-lg hover:border-primary/30 transition-colors">
                  <div className="p-3 bg-primary/5 rounded-xl inline-block mb-6">
                    <factor.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-black text-lg mb-3 tracking-tight">{factor.title}</h4>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">{factor.description}</p>
                </div>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function CompactTechShowcase() {
  const techs = ["Java", "Spring Boot", "Python", "React", "Next.js", "PostgreSQL", "AWS", "Docker", "Kubernetes", "Firebase"];
  
  return (
    <section className="py-24 bg-background border-t border-zinc-100 dark:border-zinc-900">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-12">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-3 block">
            Technical Foundation
          </span>
          <h2 className="text-2xl md:text-3xl font-bold">Technologies We Work With</h2>
        </ScrollFadeIn>
        
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
          {techs.map((tech) => (
            <div 
              key={tech} 
              className="px-6 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-primary hover:border-primary/50 hover:shadow-lg transition-all cursor-default"
            >
              {tech}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
