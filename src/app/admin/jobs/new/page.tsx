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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Briefcase } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';

const jobSchema = z.object({
  title: z.string().min(2, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  employmentType: z.string().min(1, 'Employment type is required'),
  experience: z.string().optional(),
  skills: z.string().describe('Comma-separated list of skills'),
  salaryRange: z.string().optional(),
  description: z.string().min(10, 'Full job description is required'),
  deadline: z.string().optional(),
  isActive: z.boolean().default(true),
});

type JobFormValues = z.infer<typeof jobSchema>;

export default function NewJobPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'Full Time',
      experience: '',
      skills: '',
      salaryRange: '',
      description: '',
      deadline: '',
      isActive: true,
    },
  });

  async function onSubmit(values: JobFormValues) {
    setIsLoading(true);
    try {
      const jobData = {
        ...values,
        skills: values.skills.split(',').map(s => s.trim()).filter(Boolean),
        status: values.isActive ? 'Active' : 'Draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'jobs'), jobData);
      toast({ title: 'Success', description: 'Job opening posted successfully.' });
      router.push('/admin/jobs');
      router.refresh();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save job opening.', variant: 'destructive' });
    } finally {
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
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-4">
              <CardTitle className="text-lg font-bold">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Senior Frontend Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Remote / Bangalore" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
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
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50 px-6 py-4">
              <CardTitle className="text-lg font-bold">Requirements & Comp</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Required</FormLabel>
                      <FormControl>
                        <Input placeholder="2-4 Years" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salaryRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary Range (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="₹12L - ₹18L" {...field} />
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
                    <FormLabel>Required Skills</FormLabel>
                    <FormControl>
                      <Input placeholder="React, TypeScript, Next.js, CSS" {...field} />
                    </FormControl>
                    <FormDescription>Separate skills with commas.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Job Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write detailed responsibilities, qualifications, and benefits..." 
                        className="min-h-[250px] font-sans" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-900 border rounded-xl">
            <div className="space-y-0.5">
              <h4 className="font-bold">Publish Immediately</h4>
              <p className="text-sm text-zinc-500">If disabled, the job will be saved as a draft.</p>
            </div>
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-4 sticky bottom-6 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-4 border rounded-2xl shadow-xl">
            <Button variant="outline" onClick={() => router.back()} disabled={isLoading} size="lg">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} size="lg" className="min-w-[150px]">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" /> Post Job Opening
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
