"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { History, ShieldAlert, Clock, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

type Log = {
  id: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  adminEmail?: string;
  timestamp?: { seconds: number };
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/activity', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data.logs as Log[]);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          Security & Audit Logs
        </h1>
        <p className="text-zinc-500">Historical record of all administrative actions (Read-only).</p>
      </div>

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
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {log.adminEmail}</span>
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
