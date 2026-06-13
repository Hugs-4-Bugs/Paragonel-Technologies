
"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function NewsletterSubscription() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribing(true);
    
    try {
      if (db) {
        await addDoc(collection(db, 'newsletterSubscribers'), {
          email,
          source: 'Website Footer',
          subscribedAt: serverTimestamp(),
        });
      }
      toast({ title: "Subscribed!", description: "Thank you for joining our community." });
      setEmail('');
    } catch (e) {
      toast({ title: "Subscription Error", variant: "destructive" });
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
