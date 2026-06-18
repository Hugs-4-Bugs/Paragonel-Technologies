'use client';

import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
  className?: string;
}

export function SaveStatusIndicator({ status, className }: SaveStatusIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border bg-background/50 backdrop-blur-sm shadow-sm", className)}>
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span>Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          <span>Draft Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-3 w-3 text-destructive" />
          <span>Sync Failed</span>
        </>
      )}
      {status === 'offline' && (
        <>
          <CloudOff className="h-3 w-3 text-zinc-400" />
          <span>Offline (Local Save)</span>
        </>
      )}
      {status === 'idle' && (
        <>
          <div className="h-2 w-2 rounded-full bg-zinc-300" />
          <span className="text-zinc-500">Ready</span>
        </>
      )}
    </div>
  );
}
