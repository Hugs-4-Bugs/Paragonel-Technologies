
"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export function NewsletterSubscription() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribing(true);

    // Phase 1B: subscriptions go through the server-side /api/newsletter route
    // (validation, rate limiting, duplicate check, Firebase Admin SDK write).
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await res.json().catch(() => ({}));

      if (res.status === 201) {
        toast({ title: "Subscribed!", description: "Thank you for joining our community." });
        setEmail('');
      } else if (res.status === 409) {
        toast({ title: "Already subscribed", description: payload.error || "You're already on the list." });
      } else if (res.status === 429) {
        toast({ title: "Too many attempts", description: "Please wait a moment and try again.", variant: "destructive" });
      } else {
        toast({ title: "Subscription Error", description: payload.error || "Please check your email and try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network Error", description: "Could not reach the server. Please try again.", variant: "destructive" });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="py-8 px-4 bg-muted/50 dark:bg-muted/20 rounded-lg">
      <h3 className="text-xl font-semibold text-center text-foreground mb-1">Stay Updated</h3>
      <p className="text-sm text-center text-muted-foreground mb-4 max-w-md mx-auto">
        Latest insights and career opportunities delivered to your inbox.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-grow bg-background"
        />
        <Button type="submit" disabled={isSubscribing}>
          {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          Join
        </Button>
      </form>
    </div>
  );
}
