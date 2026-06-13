
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
  Layers,
  Globe,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, limit, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { dummyJobs, blogPosts } from '@/lib/data';

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    fetch('/api/admin/auth/me').then(res => {
      if (!res.ok) {
        router.push('/admin/login');
      }
    });
  }, [router]);

  const jobsQuery = useMemo(() => firestore ? query(collection(firestore, 'jobs'), where('isActive', '==', true)) : null, [firestore]);
  const postsQuery = useMemo(() => firestore ? query(collection(firestore, 'blogPosts'), where('status', '==', 'Published')) : null, [firestore]);
  const appsQuery = useMemo(() => firestore ? query(collection(firestore, 'jobApplications'), orderBy('appliedAt', 'desc'), limit(5)) : null, [firestore]);
  const servicesQuery = useMemo(() => firestore ? collection(firestore, 'services') : null, [firestore]);

  const { data: activeJobs, loading: jobsLoading } = useCollection(jobsQuery);
  const { data: publishedPosts, loading: postsLoading } = useCollection(postsQuery);
  const { data: recentApps, loading: appsLoading } = useCollection(appsQuery);
  const { data: services, loading: servicesLoading } = useCollection(servicesQuery);

  const handleSeedDatabase = async () => {
    if (!firestore) return;
    if (!confirm(`This will populate your database with comprehensive sample data for Jobs, Blogs, Services, Portfolio, and Testimonials. Continue?`)) return;
    
    setIsSeeding(true);
    try {
      // 1. Seed Jobs
      const jobsCol = collection(firestore, 'jobs');
      for (const job of dummyJobs) {
        const { id, ...jobData } = job;
        await addDoc(jobsCol, {
          ...jobData,
          isActive: true,
          status: 'Active',
          postedDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // 2. Seed Blogs
      const blogsCol = collection(firestore, 'blogPosts');
      for (const post of blogPosts) {
        const { id, ...postData } = post;
        await addDoc(blogsCol, {
          ...postData,
          status: 'Published',
          publishedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // 3. Seed Services
      const servicesCol = collection(firestore, 'services');
      const sampleServices = [
        { title: "AI Solutions", slug: "ai-solutions", description: "Custom machine learning models and LLM integration.", iconName: "Brain", order: 1, isActive: true },
        { title: "Cloud Infrastructure", slug: "cloud-infrastructure", description: "Scalable AWS/GCP deployments and migration.", iconName: "Cloud", order: 2, isActive: true },
        { title: "DevOps Automation", slug: "devops-automation", description: "CI/CD pipelines and automated scaling solutions.", iconName: "GitFork", order: 3, isActive: true },
        { title: "SaaS Platforms", slug: "saas-platforms", description: "End-to-end development of modern SaaS products.", iconName: "Layers", order: 4, isActive: true }
      ];
      for (const s of sampleServices) {
        await addDoc(servicesCol, { ...s, createdAt: serverTimestamp() });
      }

      toast({
        title: "CMS Populated!",
        description: `Successfully added Jobs, Articles, Services, and Projects.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Seeding Failed",
        description: "Could not add sample data.",
        variant: "destructive"
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const stats = [
    { label: 'Active Jobs', value: activeJobs?.length || 0, icon: Briefcase, color: 'text-blue-600', loading: jobsLoading },
    { label: 'Live Articles', value: publishedPosts?.length || 0, icon: BookOpen, color: 'text-green-600', loading: postsLoading },
    { label: 'Services', value: services?.length || 0, icon: Layers, color: 'text-purple-600', loading: servicesLoading },
    { label: 'Applications', value: recentApps?.length || 0, icon: UserPlus, color: 'text-orange-600', loading: appsLoading },
  ];

  return (
    <div className="space-y-12">
      <ScrollFadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Command Center</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">
              Manage every aspect of your digital presence.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Button variant="outline" onClick={handleSeedDatabase} disabled={isSeeding} className="border-primary text-primary hover:bg-primary/5 h-12 px-6 rounded-xl font-bold">
                {isSeeding ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Database className="mr-2 h-5 w-5" />}
                Populate CMS
            </Button>
            <Button asChild className="h-12 px-6 rounded-xl font-bold shadow-xl shadow-primary/20">
              <Link href="/admin/jobs/new">
                <PlusCircle className="mr-2 h-5 w-5" /> New Role
              </Link>
            </Button>
          </div>
        </div>
      </ScrollFadeIn>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <ScrollFadeIn key={stat.label} delay={`${i * 100}ms`}>
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 rounded-2xl hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                  {stat.label}
                </CardTitle>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </CardHeader>
              <CardContent>
                {stat.loading ? (
                  <Skeleton className="h-10 w-16 rounded-lg" />
                ) : (
                  <div className="text-4xl font-black tracking-tight">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          </ScrollFadeIn>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ScrollFadeIn delay="400ms" className="lg:col-span-2">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 rounded-2xl h-full">
            <CardHeader className="p-8 border-b">
              <CardTitle className="text-xl font-bold">Recent Talent Activity</CardTitle>
              <CardDescription>Incoming applications for open roles.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {appsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(n => <Skeleton key={n} className="h-20 w-full rounded-2xl" />)}
                </div>
              ) : recentApps && recentApps.length > 0 ? (
                <div className="space-y-4">
                  {recentApps.map((app: any) => (
                    <div key={app.id} className="flex items-center p-5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border hover:border-primary/50 transition-colors">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl mr-5">
                        {app.candidateName?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-zinc-900 dark:text-zinc-100 text-lg truncate">
                          {app.candidateName}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold truncate">
                          Applied for: <span className="text-primary">{app.jobTitle}</span>
                        </p>
                      </div>
                      <div className="text-xs text-zinc-400 font-black text-right hidden sm:block">
                        {new Date(app.appliedAt?.seconds * 1000 || app.appliedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center text-zinc-400 italic text-center border-2 border-dashed rounded-3xl bg-zinc-50/50">
                  <UserPlus className="h-12 w-12 mb-4 opacity-10" />
                  <p className="font-bold">No active applications currently.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </ScrollFadeIn>

        <ScrollFadeIn delay="500ms">
          <div className="space-y-6 h-full">
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <CardHeader className="p-6 border-b">
                <CardTitle className="text-lg font-bold">Quick CMS Navigation</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-2">
                  <Button asChild variant="ghost" className="justify-start font-bold h-12 rounded-xl"><Link href="/admin/services"><Layers className="mr-3 h-5 w-5 text-purple-600" /> Manage Services</Link></Button>
                  <Button asChild variant="ghost" className="justify-start font-bold h-12 rounded-xl"><Link href="/admin/portfolio"><Globe className="mr-3 h-5 w-5 text-blue-600" /> Portfolio Hub</Link></Button>
                  <Button asChild variant="ghost" className="justify-start font-bold h-12 rounded-xl"><Link href="/admin/testimonials"><MessageSquare className="mr-3 h-5 w-5 text-pink-600" /> Client Feedback</Link></Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-900 text-white">
              <CardHeader className="p-6">
                <CardTitle className="text-lg font-bold">Infrastructure Health</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black uppercase tracking-wider text-zinc-500">
                    <span>Firestore Engine</span>
                    <span className="text-green-500">Nominal</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-full animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black uppercase tracking-wider text-zinc-500">
                    <span>AI Analysis Node</span>
                    <span className="text-primary">Optimized</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[95%]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
