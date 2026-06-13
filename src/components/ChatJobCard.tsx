
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Clock, Star } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
  department: string;
  matchScore?: number;
}

interface ChatJobCardProps {
  job: Job;
  onApply: (job: Job) => void;
  isApplied?: boolean;
}

export function ChatJobCard({ job, onApply, isApplied }: ChatJobCardProps) {
  return (
    <div className="w-full bg-card border rounded-xl p-3 my-2 shadow-sm hover:shadow-md transition-shadow border-muted">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-bold text-sm text-foreground leading-tight line-clamp-1">{job.title}</h4>
          <p className="text-[10px] text-muted-foreground mt-0.5">{job.department}</p>
        </div>
        {job.matchScore !== undefined && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-primary">{job.matchScore}% Match</span>
            <div className="w-12 h-1 bg-muted rounded-full mt-1 overflow-hidden">
               <div className="h-full bg-primary" style={{ width: `${job.matchScore}%` }} />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
        <div className="flex items-center text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3 mr-1 text-primary" />
          {job.location}
        </div>
        <div className="flex items-center text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3 mr-1 text-primary" />
          {job.type}
        </div>
      </div>

      <Button 
        onClick={() => onApply(job)}
        size="sm"
        disabled={isApplied}
        className="w-full mt-3 h-8 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-none transition-colors"
      >
        {isApplied ? 'Application Selected' : 'Click to Apply'}
      </Button>
    </div>
  );
}
