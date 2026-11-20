
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import Link from 'next/link';

const jobSchema = z.object({
  jobId: z.string().min(3, 'Job ID is required'),
  title: z.string().min(2, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  employmentType: z.string().min(1, 'Employment type is required'),
  workArrangement: z.string().min(1, 'Arrangement is required'),
  experienceRequired: z.string().min(1, 'Experience is required'),
  salaryRange: z.string().optional(),
  skills: z.string().min(2, 'Skills are required'),
  description: z.string().min(50, 'Full job description is required'),
  deadline: z.string().optional(),
  status: z.string().default('Active'),
});

type JobFormValues = z.infer<typeof jobSchema>;

export default function EditJobPage() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        // Phase 4 IU-0 slice 2: load via JWT-verified server route (Admin SDK),
        // since drafts/archived jobs are no longer readable by the client SDK.
        const res = await fetch(`/api/admin/jobs/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const j = data.job;
        if (j) {
          form.reset({
            jobId: j.jobId,
            title: j.title,
            department: j.department,
            location: j.location,
            employmentType: j.employmentType,
            workArrangement: j.workArrangement || 'Remote',
            experienceRequired: j.experienceRequired,
            salaryRange: j.salaryRange || '',
            skills: Array.isArray(j.skills) ? j.skills.join(', ') : '',
            description: j.description,
            deadline: j.deadline || '',
            status: j.status || (j.isActive ? 'Active' : 'Draft'),
          });
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load job details.', variant: 'destructive' });
      } finally {
        setIsFetching(false);
      }
    };
    fetchJob();
  }, [id, form, toast]);

  async function onSubmit(values: JobFormValues) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.issues?.join('; ') || data?.error || 'Update failed.');
      }
      toast({ title: 'Success', description: 'Job details updated successfully.' });
      router.push('/admin/jobs');
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to update job.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return <div className="h-80 flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-20">
      <ScrollFadeIn>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/jobs"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" />
            Edit Job Opening
          </h1>
        </div>
      </ScrollFadeIn>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="bg-zinc-50/50 border-b">
              <CardTitle className="text-lg">Role Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="jobId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job ID</FormLabel>
                    <FormControl><Input {...field} className="font-mono h-11" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Title</FormLabel>
                    <FormControl><Input {...field} className="h-11" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {['Engineering', 'Design', 'Marketing', 'Operations', 'HR', 'Sales'].map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="employmentType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {['Full Time', 'Part Time', 'Contract', 'Internship'].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="workArrangement" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arrangement</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-11"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {['Remote', 'Onsite', 'Hybrid'].map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="bg-zinc-50/50 border-b">
              <CardTitle className="text-lg">Content & Skills</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <FormField control={form.control} name="skills" render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Skills</FormLabel>
                  <FormControl><Input {...field} className="h-11" /></FormControl>
                  <FormDescription>Comma-separated list of skills.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Job Description</FormLabel>
                  <FormControl><Textarea className="min-h-[300px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 sticky bottom-6 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-4 rounded-2xl border shadow-xl">
            <Button variant="outline" onClick={() => router.back()} disabled={isLoading} size="lg">Cancel</Button>
            <Button type="submit" disabled={isLoading} size="lg" className="min-w-[160px]">
              {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="mr-2 h-5 w-5" />} Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
