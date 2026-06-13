"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, BookOpen, UserPlus, TrendingUp, Clock } from 'lucide-react';
import { useCollection } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const jobsQuery = query(collection(db, 'jobs'), where('isActive', '==', true));
  const { data: activeJobs, loading: jobsLoading } = useCollection(jobsQuery);

  const postsQuery = query(collection(db, 'blogPosts'), where('status', '==', 'Published'));
  const { data: publishedPosts, loading: postsLoading } = useCollection(postsQuery);

  const recentAppsQuery = query(
    collection(db, 'jobApplications'), 
    orderBy('appliedAt', 'desc'), 
    limit(5)
  );
  const { data: recentApps, loading: appsLoading } = useCollection(recentAppsQuery);

  const stats = [
    { 
      label: 'Active Jobs', 
      value: activeJobs?.length || 0, 
      icon: Briefcase, 
      color: 'text-blue-600',
      loading: jobsLoading
    },
    { 
      label: 'Published Posts', 
      value: publishedPosts?.length || 0, 
      icon: BookOpen, 
      color: 'text-green-600',
      loading: postsLoading
    },
    { 
      label: 'New Applications', 
      value: recentApps?.length || 0, 
      icon: UserPlus, 
      color: 'text-purple-600',
      loading: appsLoading
    },
    { 
      label: 'Growth', 
      value: '+12%', 
      icon: TrendingUp, 
      color: 'text-orange-600',
      loading: false
    },
  ];

  return (
    <div className="space-y-10">
      <ScrollFadeIn>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-extrabold tracking-tight">Dashboard Overview</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg">
            Monitor your company's digital pulse and content status.
          </p>
        </div>
      </ScrollFadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <ScrollFadeIn key={stat.label} delay={`${i * 100}ms`}>
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  {stat.label}
                </CardTitle>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </CardHeader>
              <CardContent>
                {stat.loading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-3xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          </ScrollFadeIn>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ScrollFadeIn delay="400ms" className="lg:col-span-2">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>Recent Applications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {appsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(n => <Skeleton key={n} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : recentApps && recentApps.length > 0 ? (
                <div className="space-y-4">
                  {recentApps.map((app: any) => (
                    <div key={app.id} className="flex items-center p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border group hover:border-primary/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-4">
                        {app.candidateName?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {app.candidateName}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                          Applied for: <span className="text-primary font-medium">{app.jobTitle}</span>
                        </p>
                      </div>
                      <div className="text-xs text-zinc-400 text-right">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-zinc-400 italic">
                  <UserPlus className="h-8 w-8 mb-2 opacity-20" />
                  No recent applications found.
                </div>
              )}
            </CardContent>
          </Card>
        </ScrollFadeIn>

        <ScrollFadeIn delay="500ms">
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 h-full">
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Database Connection</span>
                    <span className="text-green-500 font-bold">Stable</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">API Latency</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">120ms</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[85%]" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </ScrollFadeIn>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
