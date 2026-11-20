"use client";

import { useState } from 'react';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Send, Loader2, Briefcase } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

export function ContactSection() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Phase 1B: submissions go through the server-side /api/contact route
    // (validation, rate limiting, dedupe, Firebase Admin SDK write to the CRM,
    // and email notifications). The browser never writes to Firestore directly,
    // and Firebase credentials are never exposed to the client.
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const payload = await res.json().catch(() => ({}));

      if (res.status === 201) {
        toast({
          title: "Message Sent!",
          description: "Thank you for reaching out to Paragonel. We'll get back to you soon.",
        });
        setFormData({ name: '', email: '', company: '', message: '' });
      } else if (res.status === 409) {
        toast({ title: "Already received", description: payload.error || "This message was already submitted.", variant: "destructive" });
      } else if (res.status === 429) {
        toast({ title: "Too many attempts", description: "Please wait a moment and try again.", variant: "destructive" });
      } else {
        toast({ title: "Submission Error", description: payload.error || "Please check your details and try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network Error", description: "Could not reach the server. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section-padding bg-secondary/30 dark:bg-secondary/10">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <Mail className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Get In <span className="text-primary">Touch</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We're excited to discuss how Paragonel can elevate your business. Reach out to us for inquiries, partnerships, or career opportunities.
          </p>
        </ScrollFadeIn>

        <div className="grid lg:grid-cols-5 gap-12">
          <ScrollFadeIn className="lg:col-span-3">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" name="email" type="email" placeholder="your.email@example.com" value={formData.email} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company">Company (Optional)</Label>
                    <Input id="company" name="company" placeholder="Business Name" value={formData.company} onChange={handleChange} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" name="message" placeholder="Tell us how we can help..." rows={5} value={formData.message} onChange={handleChange} required />
                  </div>
                  <div>
                    <Button type="submit" size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                      ) : (
                        <><Send className="mr-2 h-4 w-4" /> Send Message</>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </ScrollFadeIn>

          <ScrollFadeIn delay="200ms" className="lg:col-span-2">
            <Card className="shadow-xl h-full">
              <CardHeader>
                <CardTitle className="text-2xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-muted-foreground">
                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-primary mt-1 neon-icon flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Our Headquarters</h4>
                    <p>HSR Layout, Bangalore, 560102, India</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-primary mt-1 neon-icon flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Email Us</h4>
                    <a href="mailto:contact@paragonel.com" className="hover:text-primary transition-colors">contact@paragonel.com</a>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-primary mt-1 neon-icon flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Call Us</h4>
                    <a href="tel:+919663076023" className="hover:text-primary transition-colors">+91 9663076023</a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollFadeIn>
        </div>
      </div>
    </section>
  );
}
