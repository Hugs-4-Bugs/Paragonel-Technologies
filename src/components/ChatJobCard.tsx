
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Clock } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
  department: string;
}

interface ChatJobCardProps {
  job: Job;
  onApply: (job: Job) => void;
  isApplied?: boolean;
}

export function ChatJobCard({ job, onApply, isApplied }: ChatJobCardProps) {
  return (
    <div className="w-full bg-card border rounded-lg p-3 my-2 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-bold text-sm text-foreground leading-tight">{job.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{job.department}</p>
        </div>
        <Briefcase className="h-4 w-4 text-primary opacity-50" />
      </div>
      
      <div className="flex flex-wrap gap-2 mt-3">
        <div className="flex items-center text-[10px] text-muted-foreground">
          <MapPin className="h-3 w-3 mr-1" />
          {job.location}
        </div>
        <div className="flex items-center text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {job.type}
        </div>
      </div>

      <Button 
        onClick={() => onApply(job)}
        size="sm"
        disabled={isApplied}
        className="w-full mt-3 h-8 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-none"
      >
        {isApplied ? 'Application Ready' : 'Click to Apply'}
      </Button>
    </div>
  );
}
