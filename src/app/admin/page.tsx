"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Briefcase, 
  BookOpen, 
  UserPlus, 
  PlusCircle, 
  Database, 
  Loader2,
  Activity,
  Mail,
  Users as UsersIcon,
  ChevronRight,
  RefreshCcw
} from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, limit, orderBy, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { dummyJobs, blogPosts, basePortfolio, baseTestimonials, baseServices } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    fetch('/api/admin/auth/me').then(res => {
      if (!res.ok) router.push('/admin/login');
    });
  }, [router]);

  const jobsQuery = useMemo(() => firestore ? query(collection(firestore, 'jobs'), where('deletedAt', '==', null)) : null, [firestore]);
  const postsQuery = useMemo(() => firestore ? query(collection(firestore, 'blogPosts'), where('deletedAt', '==', null)) : null, [firestore]);
  const recentAppsQuery = useMemo(() => firestore ? query(collection(firestore, 'jobApplications'), orderBy('appliedAt', 'desc'), limit(6)) : null, [firestore]);
  const leadsQuery = useMemo(() => firestore ? query(collection(firestore, 'leads'), where('deletedAt', '==', null)) : null, [firestore]);
  const subsQuery = useMemo(() => firestore ? collection(firestore, 'newsletterSubscribers') : null, [firestore]);

  const { data: allJobs, loading: jobsLoading } = useCollection(jobsQuery);
  const { data: allPosts, loading: postsLoading } = useCollection(postsQuery);
  const { data: recentApps, loading: appsLoading } = useCollection(recentAppsQuery);
  const { data: leads, loading: leadsLoading } = useCollection(leadsQuery);
  const { data: subs, loading: subsLoading } = useCollection(subsQuery);

  const stats = [
    { label: 'Total Jobs', value: allJobs?.length || 0, icon: Briefcase, color: 'text-blue-600', loading: jobsLoading },
    { label: 'Total Blogs', value: allPosts?.length || 0, icon: BookOpen, color: 'text-green-600', loading: postsLoading },
    { label: 'Total Leads', value: leads?.length || 0, icon: Mail, color: 'text-purple-600', loading: leadsLoading },
    { label: 'Subscribers', value: subs?.length || 0, icon: UsersIcon, color: 'text-orange-600', loading: subsLoading },
  ];

  const handleSeedDatabase = async () => {
    if (!firestore || isSeeding) return;
    if (!confirm("This will populate your production database with the high-quality foundation data. Proceed?")) return;
    
    setIsSeeding(true);
    try {
      const batch = writeBatch(firestore);

      // Seed Jobs
      dummyJobs.forEach(job => {
        const jobRef = doc(collection(firestore, 'jobs'), job.id);
        batch.set(jobRef, { ...job, deletedAt: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });

      // Seed Blogs
      blogPosts.forEach(post => {
        const postRef = doc(collection(firestore, 'blogPosts'), post.id);
        batch.set(postRef, { ...post, deletedAt: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });

      // Seed Services
      baseServices.forEach(service => {
        const sRef = doc(collection(firestore, 'services'), service.id);
        batch.set(sRef, { ...service, createdAt: serverTimestamp() });
      });

      await batch.commit();
      toast({ title: "Database Seeded", description: "Production data is now live." });
    } catch (e) {
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
        {stats.map((stat, i) => (
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
                {stat.loading ? <Skeleton className="h-10 w-16 rounded-lg" /> : <div className="text-2xl md:text-3xl font-black tracking-tight">{stat.value}</div>}
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
              {appsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(n => <Skeleton key={n} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : recentApps && recentApps.length > 0 ? (
                <div className="space-y-3">
                  {recentApps.map((app: any) => (
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
          <Card className="shadow-sm border-zinc-200 rounded-2xl">
            <CardHeader className="p-6 border-b">
              <CardTitle className="text-lg font-bold">System Health</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-zinc-500">
                  <span>Firestore Persistence</span>
                  <span className="text-green-500 font-bold">Online</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-zinc-500">
                  <span>AI Matching Engine</span>
                  <span className="text-primary font-bold">Ready</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[95%]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
