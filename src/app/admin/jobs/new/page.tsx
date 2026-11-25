"use client";

import React, { useState, useEffect } from 'react';
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
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import Link from 'next/link';
import { useAutosave, loadServerDraft } from '@/hooks/useAutosave';
import { SaveStatusIndicator } from '@/components/cms/SaveStatusIndicator';
import { JobStructuredSections } from '@/components/admin/job-structured-sections';

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
  // 05R: optional matching fields. Absent = the matcher treats the dimension as
  // N/A (no penalty, no reward) — never invents requirements.
  preferredSkills: z.string().optional().or(z.literal('')),
  seniority: z.string().optional().or(z.literal('')),
  educationRequired: z.string().optional().or(z.literal('')),
  // Structured job-posting fields (Task 2/3) — all optional.
  summary: z.string().max(500).optional().or(z.literal('')),
  responsibilities: z.string().max(5000).optional().or(z.literal('')),
  qualifications: z.string().max(5000).optional().or(z.literal('')),
  preferredQualifications: z.string().max(5000).optional().or(z.literal('')),
  benefits: z.string().max(3000).optional().or(z.literal('')),
  certifications: z.string().max(500).optional().or(z.literal('')),
  reportingManager: z.string().max(200).optional().or(z.literal('')),
  shiftHours: z.string().max(200).optional().or(z.literal('')),
  travelRequired: z.string().max(200).optional().or(z.literal('')),
  aboutTeam: z.string().max(3000).optional().or(z.literal('')),
  companyCulture: z.string().max(3000).optional().or(z.literal('')),
  additionalNotes: z.string().max(3000).optional().or(z.literal('')),
  screeningQuestions: z.string().max(3000).optional().or(z.literal('')),
  resumeRequired: z.boolean().optional(),
  linkedinRequired: z.boolean().optional(),
  portfolioRequired: z.boolean().optional(),
  description: z.string().min(50, 'Full job description is required'),
  deadline: z.string().optional(),
  status: z.string().default('Active'),
});

type JobFormValues = z.infer<typeof jobSchema>;

const AUTOSAVE_KEY = 'qf_job_new_draft';

export default function NewJobPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

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
      preferredSkills: '',
      seniority: '',
      educationRequired: '',
      summary: '',
      responsibilities: '',
      qualifications: '',
      preferredQualifications: '',
      benefits: '',
      certifications: '',
      reportingManager: '',
      shiftHours: '',
      travelRequired: '',
      aboutTeam: '',
      companyCulture: '',
      additionalNotes: '',
      screeningQuestions: '',
      resumeRequired: false,
      linkedinRequired: false,
      portfolioRequired: false,
      description: '',
      deadline: '',
      status: 'Active',
    },
  });

  const formValues = form.watch();

  // Initialize draft ID
  useEffect(() => {
    const sid = localStorage.getItem('current_draft_id_job') || `draft_job_${Date.now()}`;
    setDraftId(sid);
    localStorage.setItem('current_draft_id_job', sid);
  }, []);

  const { saveStatus } = useAutosave({
    db: firestore,
    collectionName: 'jobs',
    docId: draftId,
    data: formValues,
    enabled: isDirty,
    storageKey: AUTOSAVE_KEY,
  });

  // Recovery logic — try the server-backed draft first (cross-device), then
  // fall back to the localStorage backup (offline / server outage).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const serverDraft = await loadServerDraft('jobs');
      if (cancelled) return;
      let candidate: { data: Record<string, unknown>; timestamp: number } | null = null;
      if (serverDraft?.data) {
        candidate = {
          data: serverDraft.data,
          timestamp: serverDraft.updatedAt ? new Date(serverDraft.updatedAt).getTime() : Date.now(),
        };
      } else {
        const saved = localStorage.getItem(AUTOSAVE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed?.data) candidate = { data: parsed.data, timestamp: parsed.timestamp ?? Date.now() };
          } catch {
            localStorage.removeItem(AUTOSAVE_KEY);
          }
        }
      }
      if (!candidate) return;
      const timeStr = new Date(candidate.timestamp).toLocaleTimeString();
      if (confirm(`Found an unsaved job draft from ${timeStr}. Restore it?`)) {
        form.reset(candidate.data);
        setIsDirty(true);
      } else {
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form]);

  // Handle unsaved changes protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const subscription = form.watch(() => setIsDirty(true));
    return () => subscription.unsubscribe();
  }, [form.watch]);

  async function onSubmit(values: JobFormValues) {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Phase 4 IU-0 slice 2: create via JWT-verified server route (Admin SDK).
      // The server re-validates and writes; the client no longer touches Firestore.
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.issues?.join('; ') || data?.error || 'The server rejected the request.');
      }

      // Clear draft
      localStorage.removeItem(AUTOSAVE_KEY);
      localStorage.removeItem('current_draft_id_job');

      setIsDirty(false);
      toast({ title: 'Job Posted', description: 'The role is now visible on the Careers page.' });
      router.push('/admin/jobs');
    } catch (error: any) {
      console.error("Post Job Error:", error);
      toast({
        title: 'Posting Failed',
        description: error.message || 'Check your database permissions.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between sticky top-0 z-20 bg-background/80 backdrop-blur-md py-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/jobs"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Create New Role</h1>
        </div>
        <SaveStatusIndicator status={saveStatus} />
      </div>

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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <Select onValueChange={field.onChange} value={field.value}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="seniority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target seniority (optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Not specified" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Not specified</SelectItem>
                          {['Junior', 'Mid', 'Senior', 'Lead', 'Principal'].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Used by the job-match engine when set.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="educationRequired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education requirement (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="B.Tech in CS or equivalent" {...field} className="h-11" />
                      </FormControl>
                      <FormDescription>Free text; matched against candidate qualifications.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="preferredSkills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred skills (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="GraphQL, AWS, Figma (comma separated)" {...field} className="h-11" />
                    </FormControl>
                    <FormDescription>Nice-to-have skills, weighed lower than required skills in matching.</FormDescription>
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

          <JobStructuredSections form={form} />

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
