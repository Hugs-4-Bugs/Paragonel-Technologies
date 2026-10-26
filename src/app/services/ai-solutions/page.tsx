
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Zap, ChevronRight, Lightbulb, LineChart, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Solutions | Paragonel',
  description: 'Custom AI solutions including machine learning, NLP, and computer vision to drive innovation and efficiency for your business.',
};

const aiFeatures = [
  { title: "Machine Learning Models", description: "Develop predictive models and data-driven insights.", icon: Lightbulb },
  { title: "Natural Language Processing", description: "Enable machines to understand and process human language.", icon: Zap },
  { title: "Computer Vision Systems", description: "Extract information and insights from images and videos.", icon: CheckCircle },
  { title: "AI Strategy & Consulting", description: "Define and implement a roadmap for AI integration.", icon: LineChart },
];

export default function AISolutionsPage() {
  return (
    <div className="section-padding bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn>
          <header className="text-center mb-16">
            <Brain className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              AI <span className="text-primary">Solutions</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Harness the power of Artificial Intelligence with Paragonel. We build custom AI models, develop intelligent automation, and provide strategic consulting to transform your business operations and unlock new opportunities.
            </p>
          </header>
        </ScrollFadeIn>

        <ScrollFadeIn delay="200ms">
          <div className="relative w-full h-72 md:h-96 rounded-xl overflow-hidden shadow-2xl mb-16">
            <Image
              src="/images/ai-abstract.png"
              alt="Abstract AI technology visualization"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              data-ai-hint="AI data network abstract"
              priority
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          </div>
        </ScrollFadeIn>
        
        <ScrollFadeIn delay="300ms" className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-10">Our AI Capabilities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {aiFeatures.map((feature, index) => (
              <Card key={index} className="text-center shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mx-auto mb-3 neon-icon" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollFadeIn>

        <ScrollFadeIn delay="400ms" className="mb-16">
          <Card className="bg-card shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">Transform Your Business with AI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                At Paragonel, we go beyond off-the-shelf AI. We partner with you to understand your unique challenges and opportunities, designing and implementing bespoke AI solutions that deliver measurable results. From automating complex processes to uncovering hidden insights in your data, our AI expertise can help you innovate faster, make smarter decisions, and gain a competitive edge.
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Custom model development and deployment.</li>
                <li>Integration with existing enterprise systems.</li>
                <li>Ethical AI practices and bias mitigation.</li>
                <li>Ongoing support and model optimization.</li>
              </ul>
            </CardContent>
          </Card>
        </ScrollFadeIn>

        <ScrollFadeIn delay="500ms" className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to Innovate with AI?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Let's discuss how our AI solutions can drive your business forward.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/contact">
              Contact Our AI Experts <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
