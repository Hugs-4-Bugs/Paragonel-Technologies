
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Newsletter subscription for:', email);
    toast({
      title: "Subscribed!",
      description: "Thank you for subscribing to our newsletter.",
    });
    setEmail('');
    setIsSubscribing(false);
  };

  return (
    <div className="py-8 px-4 bg-muted/50 dark:bg-muted/20 rounded-lg">
      <h3 className="text-xl font-semibold text-center text-foreground mb-1">Stay Updated</h3>
      <p className="text-sm text-center text-muted-foreground mb-4 max-w-md mx-auto">
        Subscribe to our newsletter for the latest insights, news, and career opportunities.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-grow bg-background focus:bg-background/90"
          aria-label="Email for newsletter"
        />
        <Button type="submit" variant="default" className="sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubscribing}>
          {isSubscribing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Subscribe
        </Button>
      </form>
    </div>
  );
}
