"use client";

import React, { useMemo } from 'react';
import { ServicesSection } from '@/components/sections/services-section';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Layers } from 'lucide-react';

export default function ServicesPage() {
  const firestore = useFirestore();

  const servicesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'services'), 
      where('isActive', '==', true), 
      orderBy('order', 'asc')
    );
  }, [firestore]);

  const { data: services, loading } = useCollection(servicesQuery);

  return (
    <div className="bg-background min-h-screen">
      <section className="section-padding relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-20">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/10">
              <Layers className="h-10 w-10 text-primary neon-icon" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
              Our <span className="text-primary">Services</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
              Four focused engineering services — AI, cloud infrastructure, DevOps, and custom product engineering — grounded in products we have shipped ourselves.
            </p>
          </ScrollFadeIn>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-80 rounded-[2.5rem]" />)}
            </div>
          ) : (
            <ServicesSection isFullPage />
          )}
        </div>
      </section>
    </div>
  );
}