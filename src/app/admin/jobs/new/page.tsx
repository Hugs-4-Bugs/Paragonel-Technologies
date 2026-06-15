
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import Link from 'next/link';

const jobSchema = z.object({
  jobId: z.string().min(3, 'Job ID is required (e.g. ABC123)'),
  title: z.string().min(2, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  employmentType: z.string().min(1, 'Employment type is required'),
  workArrangement: z.string().min(1, 'Arrangement is required'),
  experienceRequired: z.string().min(1, 'Experience range is required'),
  salaryRange: z.string().optional(),
  skills: z.string().min(2, 'At least one skill is required'),
  description: z.string().min(50, 'Full job description is required'),
  deadline: z.string().optional(),
  status: z.string().default('Active'),
});

type JobFormValues = z.infer<typeof jobSchema>;

export default function NewJobPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      jobId: '',
      title: '',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'Full Time',
      workArrangement: 'Remote',
      experienceRequired: '',
      salaryRange: '',
      skills: '',
      description: '',
      deadline: '',
      status: 'Active',
    },
  });

  async function onSubmit(values: JobFormValues) {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      if (!db) throw new Error("Database not initialized");

      const jobData = {
        ...values,
        isActive: values.status === 'Active',
        skills: values.skills.split(',').map(s => s.trim()).filter(Boolean),
        postedDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'jobs'), jobData);
      toast({ title: 'Success', description: 'Job opening posted successfully.' });
      router.push('/admin/jobs');
    } catch (error: any) {
      console.error("Post Job Error:", error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to post job. Please try again.', 
        variant: 'destructive' 
      });
      setIsLoading(false);
    }
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
            Create New Role
          </h1>
        </div>
      </ScrollFadeIn>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="border-b bg-zinc-50/50">
              <CardTitle className="text-lg font-bold">General Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="jobId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job ID (Unique)</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC123" {...field} className="font-mono uppercase h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Senior Frontend Engineer" {...field} className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['Engineering', 'Design', 'Marketing', 'Operations', 'HR', 'Sales'].map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['Full Time', 'Part Time', 'Contract', 'Internship'].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workArrangement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrangement</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['Remote', 'Onsite', 'Hybrid'].map(a => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="border-b bg-zinc-50/50">
              <CardTitle className="text-lg font-bold">Details & Skills</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specific Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Bangalore / Remote" {...field} className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experienceRequired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Required</FormLabel>
                      <FormControl>
                        <Input placeholder="2-4 Years" {...field} className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Skills</FormLabel>
                    <FormControl>
                      <Input placeholder="React, TypeScript, Next.js (comma separated)" {...field} className="h-11" />
                    </FormControl>
                    <FormDescription>Comma-separated list of required technologies.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Description (Markdown supported)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write roles, responsibilities, and requirements here..." 
                        className="min-h-[250px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200">
             <CardHeader className="border-b bg-zinc-50/50">
              <CardTitle className="text-lg font-bold">Status & Visibility</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active (Visible on Careers Page)</SelectItem>
                          <SelectItem value="Draft">Draft (Internal Only)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Deadline (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-4 sticky bottom-6 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-4 rounded-2xl border shadow-xl">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading} size="lg">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} size="lg" className="min-w-[160px]">
              {isLoading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-5 w-5" /> Post Job Role</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
