"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Briefcase,
  BookOpen,
  UserPlus,
  PlusCircle,
  Loader2,
  Activity,
  Mail,
  Users as UsersIcon,
  ChevronRight,
  RefreshCcw
} from 'lucide-react';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAdminRealtime } from '@/hooks/useAdminRealtime';
import { formatDistanceToNow } from 'date-fns';

type Stats = {
  jobs: number;
  blogs: number;
  leads: number;
  subscribers: number;
};

type RecentApp = {
  id: string;
  candidateName?: string;
  jobTitle?: string;
  matchScore?: number;
  appliedAt?: { seconds: number };
};

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  // Realtime dashboard stats over SSE (server-backed Admin-SDK onSnapshot on the
  // 5 count/recent-app queries — see src/lib/realtime/admin-realtime.ts).
  // Replaces the previous one-shot /api/admin/stats fetch: counts + the pipeline
  // preview now update live when the underlying records change.
  const { data: statsData, loading: rtLoading } = useAdminRealtime<{ stats: Stats; recentApplications: RecentApp[] }>('stats');
  const stats = statsData?.stats ?? null;
  const recentApps = statsData?.recentApplications ?? [];
  const loading = rtLoading && !statsData;

  // Real system health (replaces the previously HARDCODED "Firestore Persistence:
  // Online" + "AI Matching Engine: Ready 95%" card, which were literal strings
  // with no underlying check). Booleans only — never keys or credentials.
  const [health, setHealth] = useState<{ firestore: boolean; resumeStorage: boolean; ai: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/admin/auth/me').then(res => {
      if (!res.ok) router.push('/admin/login');
    });
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/system/health', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(d => { if (!cancelled) setHealth(d?.health ?? null); })
      .catch(() => { if (!cancelled) setHealth(null); });
    return () => { cancelled = true; };
  }, []);

  const statsCards = [
    { label: 'Total Jobs', value: stats?.jobs ?? 0, icon: Briefcase, color: 'text-blue-600' },
    { label: 'Total Blogs', value: stats?.blogs ?? 0, icon: BookOpen, color: 'text-green-600' },
    { label: 'Total Leads', value: stats?.leads ?? 0, icon: Mail, color: 'text-purple-600' },
    { label: 'Subscribers', value: stats?.subscribers ?? 0, icon: UsersIcon, color: 'text-orange-600' },
  ];

  const handleSeedDatabase = async () => {
    // Phase 4 IU-0 slice 2: seeding now runs server-side via /api/admin/seed
    // (Admin SDK batch), because jobs/blogPosts writes are locked to public
    // clients. The route re-checks NODE_ENV and refuses in production.
    if (process.env.NODE_ENV === 'production') {
      toast({
        title: 'Seeding disabled in production',
        description: 'Use the admin CMS to manage content.',
        variant: 'destructive',
      });
      return;
    }
    if (isSeeding) return;
    if (!confirm("This will populate your local database with foundation data. Proceed?")) return;

    setIsSeeding(true);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast({
        title: "Database Seeded",
        description: `Local data loaded (${data.seeded?.jobs ?? 0} jobs, ${data.seeded?.blogPosts ?? 0} posts, ${data.seeded?.services ?? 0} services).`,
      });
    } catch {
      toast({ title: "Seeding Failed", variant: "destructive" });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-10">
      <ScrollFadeIn>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              Command Center
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              Real-time monitoring of your production CMS.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={handleSeedDatabase} disabled={isSeeding} className="h-11 px-5 rounded-xl font-bold border-primary/20">
              {isSeeding ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
              Seed Database
            </Button>
            <Button asChild className="h-11 px-5 rounded-xl font-bold shadow-xl shadow-primary/20">
              <Link href="/admin/jobs/new"><PlusCircle className="mr-2 h-4 w-4" /> New Role</Link>
            </Button>
            <Button asChild variant="secondary" className="h-11 px-5 rounded-xl font-bold">
              <Link href="/admin/blog/new"><PlusCircle className="mr-2 h-4 w-4" /> New Insight</Link>
            </Button>
          </div>
        </div>
      </ScrollFadeIn>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {statsCards.map((stat, i) => (
          <ScrollFadeIn key={stat.label} delay={`${i * 100}ms`}>
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md transition-shadow group">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-primary transition-colors">
                  {stat.label}
                </CardTitle>
                <div className={cn("p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900", stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-10 w-16 rounded-lg" /> : <div className="text-2xl md:text-3xl font-black tracking-tight">{stat.value}</div>}
              </CardContent>
            </Card>
          </ScrollFadeIn>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 rounded-2xl h-full">
            <CardHeader className="p-6 border-b flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg font-bold">Talent Acquisition Pipeline</CardTitle>
                <CardDescription className="text-xs">Live incoming job applications and AI scores.</CardDescription>
              </div>
              <Button asChild size="sm" variant="ghost" className="text-primary font-bold">
                <Link href="/admin/applications">View Full Pipeline <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(n => <Skeleton key={n} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : recentApps.length > 0 ? (
                <div className="space-y-3">
                  {recentApps.map((app) => (
                    <Link key={app.id} href={`/admin/applications/${app.id}`}>
                      <div className="flex items-center p-4 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-primary/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm mr-4">
                          {app.candidateName?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{app.candidateName}</p>
                          <p className="text-[10px] text-zinc-500 font-medium truncate">Applied for <span className="text-primary font-bold">{app.jobTitle}</span></p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-[10px] font-black text-primary mb-1">{app.matchScore}% Match</div>
                          <div className="text-[9px] text-zinc-400 font-bold">{app.appliedAt?.seconds ? formatDistanceToNow(app.appliedAt.seconds * 1000, { addSuffix: true }) : 'Recently'}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center text-zinc-400 italic text-center border-2 border-dashed rounded-3xl bg-zinc-50/50">
                  <UserPlus className="h-10 w-10 mb-4 opacity-10" />
                  <p className="text-sm font-bold">No active applications currently.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <CardHeader className="p-6 border-b">
              <CardTitle className="text-lg font-bold">System Health</CardTitle>
              <CardDescription className="text-xs">Derived from live service configuration.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {([
                { label: 'Firestore Persistence', ok: health?.firestore, on: 'Online', off: 'Unconfigured' },
                { label: 'Resume Storage', ok: health?.resumeStorage, on: 'Ready', off: 'Unconfigured' },
                { label: 'AI Matching Engine', ok: health?.ai, on: 'Ready', off: 'No API key' },
              ] as const).map((ind) => {
                const checking = health === null;
                const ok = ind.ok === true;
                const barColor = checking ? 'bg-zinc-300' : ok ? 'bg-green-500' : 'bg-red-400';
                const textColor = checking ? 'text-zinc-400' : ok ? 'text-green-500' : 'text-red-500';
                const status = checking ? 'Checking…' : ok ? ind.on : ind.off;
                return (
                  <div key={ind.label} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-zinc-500">
                      <span>{ind.label}</span>
                      <span className={cn('font-bold', textColor)}>{status}</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={cn('h-full', barColor, checking ? 'w-1/2' : 'w-full')} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
