
"use client";

import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Badge } from '@/components/ui/badge';

const groups = [
  { category: "Frontend", techs: ["Next.js", "React", "Flutter", "Tailwind CSS"] },
  { category: "Backend", techs: ["Spring Boot (Java)", "FastAPI (Python)", "Node.js"] },
  { category: "AI/ML", techs: ["Anthropic Claude API", "Gemini API", "LangChain", "CrewAI"] },
  { category: "Cloud", techs: ["AWS", "Google Cloud Platform", "Vercel", "Firebase"] },
  { category: "Database", techs: ["PostgreSQL", "MongoDB", "Redis"] },
  { category: "DevOps", techs: ["Docker", "Kubernetes", "Terraform", "GitHub Actions"] },
  { category: "Payments", techs: ["Razorpay", "Stripe"] },
];

export function TechStackSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Technology <span className="text-primary">Stack</span></h2>
        </ScrollFadeIn>
        <div className="space-y-8 max-w-4xl mx-auto">
          {groups.map((group, i) => (
            <ScrollFadeIn key={i} delay={`${i * 50}ms`} className="flex flex-col md:flex-row md:items-center gap-4">
              <span className="w-32 font-bold text-primary shrink-0">{group.category}</span>
              <div className="flex flex-wrap gap-2">
                {group.techs.map(tech => (
                  <Badge key={tech} variant="secondary" className="px-3 py-1">{tech}</Badge>
                ))}
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
