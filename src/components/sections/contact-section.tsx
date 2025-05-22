
"use client";

import { useState } from 'react';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


export function ContactSection() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Form data submitted:', formData);
    toast({
      title: "Message Sent!",
      description: "Thank you for reaching out. We'll get back to you soon.",
      variant: "default", 
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <section className="section-padding bg-secondary/30 dark:bg-secondary/10">
      <div className="container px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <Mail className="h-16 w-16 text-primary mx-auto mb-6 neon-icon" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Get In <span className="text-primary">Touch</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We're here to help and answer any question you might have. We look forward to hearing from you!
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
                      <Input id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" name="subject" placeholder="Regarding..." value={formData.subject} onChange={handleChange} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" name="message" placeholder="Your message here..." rows={5} value={formData.message} onChange={handleChange} required />
                  </div>
                  <div>
                    <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" /> Send Message
                        </>
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
                    <h4 className="font-semibold text-foreground">Our Office</h4>
                    <p>123 Innovation Drive, Tech City, CA 94000</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-primary mt-1 neon-icon flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Email Us</h4>
                    <a href="mailto:info@quantumleap.com" className="hover:text-primary transition-colors">info@quantumleap.com</a>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-primary mt-1 neon-icon flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Call Us</h4>
                    <a href="tel:+1234567890" className="hover:text-primary transition-colors">+1 (234) 567-890</a>
                  </div>
                </div>
                <div className="pt-4">
                    <h4 className="font-semibold text-foreground mb-2">Office Hours</h4>
                    <p>Monday - Friday: 9:00 AM - 6:00 PM (PST)</p>
                    <p>Saturday - Sunday: Closed</p>
                </div>
              </CardContent>
            </Card>
          </ScrollFadeIn>
        </div>
      </div>
    </section>
  );
}
