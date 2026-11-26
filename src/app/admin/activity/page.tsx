"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { History, ShieldAlert, Clock, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useAdminRealtime } from '@/hooks/useAdminRealtime';

type Log = {
  id: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  adminEmail?: string;
  actorRole?: string;
  outcome?: string;
  timestamp?: { seconds: number };
};

export default function ActivityLogsPage() {
  // Realtime over SSE: the server holds an Admin-SDK onSnapshot on
  // adminActivityLogs (locked to clients) and pushes the newest 100 entries.
  // Replaces the previous one-shot fetch — admins now see new audit events
  // arrive live without a manual reload.
  const { data, loading, error } = useAdminRealtime<Log[]>('activity');
  const logs = data ?? null;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          Security & Audit Logs
        </h1>
        <p className="text-zinc-500">Live record of all administrative + candidate lifecycle actions (real-time, read-only).</p>
      </div>

      {error && (
        <div className="text-xs font-medium rounded-xl border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300">
          {error}
        </div>
      )}

      <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-6"><Skeleton className="h-12 w-full" /></div>
              ))
            ) : logs && logs.length > 0 ? (
              logs.map((log) => (
                <div key={log.id} className="p-6 flex items-start gap-6 hover:bg-zinc-50/50 transition-colors">
                  <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm">{log.action}</span>
                      <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-bold uppercase text-zinc-500">
                        {log.resourceType}
                      </span>
                      {log.outcome && log.outcome !== 'success' && (
                        <span className="text-[10px] bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-full font-bold uppercase text-red-600">
                          {log.outcome}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {log.adminEmail}</span>
                      {log.actorRole && log.actorRole !== 'admin' && (
                        <span className="text-[10px] uppercase">{log.actorRole}</span>
                      )}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {log.timestamp?.seconds ? formatDistanceToNow(log.timestamp.seconds * 1000, { addSuffix: true }) : 'Just now'}</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400">ID: {log.resourceId?.substring(0, 8)}...</div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center text-zinc-400 italic">No activity recorded yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
