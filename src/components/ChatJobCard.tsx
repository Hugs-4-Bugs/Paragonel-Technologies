
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Clock, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
    <div className="w-full bg-card border rounded-2xl p-4 my-2 shadow-sm hover:shadow-md transition-all border-muted group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-sm text-foreground leading-tight truncate">{job.title}</h4>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">{job.department}</p>
        </div>
        {job.matchScore !== undefined && (
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 text-primary mb-1">
              <Zap className="h-3 w-3 fill-primary" />
              <span className="text-[11px] font-black">{job.matchScore}% Match</span>
            </div>
            <Progress value={job.matchScore} className="h-1.5 w-16 bg-muted" />
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
        <div className="flex items-center text-[10px] font-medium text-zinc-500">
          <MapPin className="h-3 w-3 mr-1.5 text-primary/70" />
          {job.location}
        </div>
        <div className="flex items-center text-[10px] font-medium text-zinc-500">
          <Clock className="h-3 w-3 mr-1.5 text-primary/70" />
          {job.type}
        </div>
      </div>

      <Button 
        onClick={() => onApply(job)}
        size="sm"
        disabled={isApplied}
        className={cn(
          "w-full mt-4 h-9 text-xs font-bold rounded-xl transition-all",
          isApplied 
            ? "bg-muted text-muted-foreground border-none" 
            : "bg-primary/5 text-primary hover:bg-primary hover:text-white border-none shadow-sm"
        )}
      >
        {isApplied ? 'Application Selected' : 'Analyze My Profile'}
      </Button>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
