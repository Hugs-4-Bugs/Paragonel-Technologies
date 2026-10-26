"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Zap, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ChatJobCardProps {
  job: any;
  onApply: (job: any) => void;
  isApplied?: boolean;
}

export function ChatJobCard({ job, onApply, isApplied }: ChatJobCardProps) {
  return (
    <div className="w-full bg-card border rounded-2xl p-4 my-2 shadow-sm border-muted hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-black text-sm text-foreground leading-tight truncate">{job.title}</h4>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">{job.department}</p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1 text-primary mb-1">
            <Zap className="h-3 w-3 fill-primary" />
            <span className="text-[11px] font-black">{job.matchScore}% Match</span>
          </div>
          <Progress value={job.matchScore} className="h-1.5 w-16 bg-muted" />
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <div className="flex items-center text-[10px] font-medium text-zinc-500">
            <MapPin className="h-3 w-3 mr-1 text-primary/70" />
            {job.location}
          </div>
          <div className="flex items-center text-[10px] font-medium text-zinc-500">
            <Clock className="h-3 w-3 mr-1 text-primary/70" />
            {job.employmentType || job.type}
          </div>
        </div>
        
        {job.matchReason && (
          <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-[10px] text-primary font-bold mb-1 flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" /> Why you match:
            </p>
            <p className="text-[10px] text-zinc-600 leading-relaxed italic">{job.matchReason}</p>
          </div>
        )}
      </div>

      <Button 
        onClick={() => onApply(job)}
        size="sm"
        disabled={isApplied}
        className={cn(
          "w-full h-9 text-xs font-bold rounded-xl transition-all",
          isApplied 
            ? "bg-green-100 text-green-700 border-none hover:bg-green-100" 
            : "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02]"
        )}
      >
        {isApplied ? 'Application Selected' : 'Apply with ParagonelAI'}
      </Button>
    </div>
  );
}
