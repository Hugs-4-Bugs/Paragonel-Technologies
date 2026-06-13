"use client";

import { CareersSection } from '@/components/sections/careers-section';
import { useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

export default function CareersPage() {
  const jobsQuery = useMemo(() => 
    query(
      collection(db, 'jobs'), 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    ), 
  []);
  
  const { data: jobs, loading } = useCollection(jobsQuery);

  return (
    <div className="bg-background">
      {loading ? (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-zinc-500 gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="font-medium animate-pulse">Loading current opportunities...</p>
        </div>
      ) : (
        <CareersSection initialJobs={jobs || []} />
      )}
    </div>
  );
}
