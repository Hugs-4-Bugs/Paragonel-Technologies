
"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Job, ApplicationFormValues } from "@/types";
import { formatApplicationEmail } from "@/ai/flows/format-application-email-flow";
import { Loader2, Send, Briefcase, User, GraduationCap, BriefcaseBusiness, Info, ShieldCheck } from "lucide-react";
import { educationQualifications, noticePeriods, generateYearOptions, locations as preferredLocations } from "@/lib/data";
import { useAuth } from "@/contexts/auth-context";

interface ApplyJobModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — aligned with server MAX_RESUME_BYTES (G17)
const ACCEPTED_FILE_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"];

const formSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  resume: z.any().refine(f => f?.length > 0, "Resume required"),
  highestQualification: z.string().min(1),
  specialization: z.string().min(1),
  university: z.string().min(1),
  passingYear: z.string().min(1),
  marks: z.string().min(1),
  primarySkills: z.string().min(1),
  secondarySkills: z.string().optional(),
  isFresher: z.boolean(),
  companyName: z.string().optional(),
  jobTitleExperience: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  isCurrentlyWorking: z.boolean().optional(),
  jobDescription: z.string().optional(),
  coverLetter: z.string().optional(),
  preferredJobLocation: z.string().min(1),
  currentCTC: z.string().optional(),
  expectedSalary: z.string().min(1),
  noticePeriod: z.string().min(1),
  acceptTerms: z.boolean().refine(v => v === true),
  notifySimilarJobs: z.boolean(),
  jobId: z.string(),
  jobTitle: z.string(),
});

export function ApplyJobModal({ isOpen, onOpenChange, job }: ApplyJobModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user: authUser, isAuthenticated } = useAuth();

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(formSchema),
  });
  
  useEffect(() => {
    if (job && isOpen) {
      form.reset({
        fullName: authUser?.fullName || "",
        email: authUser?.email || "",
        phone: "",
        isFresher: false,
        acceptTerms: false,
        notifySimilarJobs: false,
        jobId: job.id,
        jobTitle: job.title,
        resume: undefined as any,
      });
    }
  }, [job, isOpen, authUser]);

  async function onSubmit(values: ApplicationFormValues) {
    if (!job) return;
    setIsSubmitting(true);

    // Phase 1B: submit through the server-side /api/job-applications route
    // (validation, rate limiting, duplicate check, resume upload via Firebase
    // Admin Storage, Firestore write via Admin SDK). The browser no longer
    // uploads to Storage or writes to Firestore directly, and no Firebase
    // credentials reach the client.
    try {
      const form = new FormData();
      form.set('jobId', String(job.id));
      form.set('jobTitle', String(job.title));
      form.set('fullName', values.fullName);
      form.set('email', values.email);
      form.set('phone', values.phone);
      form.set('primarySkills', values.primarySkills);
      if (values.coverLetter) form.set('coverLetter', values.coverLetter);
      if (values.linkedinProfile) form.set('linkedinProfile', values.linkedinProfile);
      if (values.portfolioWebsite) form.set('portfolioWebsite', values.portfolioWebsite);
      if (values.expectedSalary) form.set('expectedSalary', values.expectedSalary);
      if (values.noticePeriod) form.set('noticePeriod', values.noticePeriod);
      if (values.preferredJobLocation) form.set('preferredJobLocation', values.preferredJobLocation);
      const resumeFile = values.resume?.[0];
      if (resumeFile) form.append('resume', resumeFile);

      const res = await fetch('/api/job-applications', { method: 'POST', body: form });
      const payload = await res.json().catch(() => ({}));

      if (res.status === 201) {
        toast({
          title: "Application Received!",
          description: `Thanks ${values.fullName}, we've received your application for ${job.title}.`,
        });
        onOpenChange(false);
      } else if (res.status === 409) {
        toast({ title: "Already applied", description: payload.error || "You have already applied for this role.", variant: "destructive" });
      } else if (res.status === 429) {
        toast({ title: "Too many attempts", description: "Please wait a moment and try again.", variant: "destructive" });
      } else {
        toast({ title: "Submission Error", description: payload.error || "Please check your details and try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network Error", description: "Could not reach the server. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!job) return null;
  const watchIsFresher = form.watch("isFresher");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl flex flex-col h-[95svh] p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b flex-shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-primary neon-icon" /> Apply for: {job.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <section className="space-y-6 p-6 rounded-lg border bg-card">
                <h3 className="text-xl font-bold flex items-center text-primary"><User className="mr-2 h-5 w-5"/>Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="email@example.com" {...field} readOnly={isAuthenticated} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="+91" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="resume" render={({ field: { onChange, value, ...rest } }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Resume (PDF/DOCX - Max 5MB)</FormLabel>
                        <FormControl><Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => onChange(e.target.files)} {...rest} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                </div>
              </section>

              <section className="space-y-6 p-6 rounded-lg border bg-card">
                <h3 className="text-xl font-bold flex items-center text-primary"><GraduationCap className="mr-2 h-5 w-5"/>Education</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="highestQualification" render={({ field }) => (<FormItem><FormLabel>Qualification</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{educationQualifications.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent></Select></FormItem>)} />
                  <FormField control={form.control} name="specialization" render={({ field }) => (<FormItem><FormLabel>Specialization</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                </div>
              </section>

              <section className="space-y-6 p-6 rounded-lg border bg-card">
                <h3 className="text-xl font-bold flex items-center text-primary"><Info className="mr-2 h-5 w-5"/>Expertise</h3>
                <FormField control={form.control} name="primarySkills" render={({ field }) => (<FormItem><FormLabel>Skills (Comma separated)</FormLabel><FormControl><Textarea placeholder="Java, React, AWS" {...field} /></FormControl></FormItem>)} />
              </section>

              <section className="space-y-6 p-6 rounded-lg border bg-card">
                <FormField control={form.control} name="acceptTerms" render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 p-4 border rounded-xl bg-background">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1">
                            <FormLabel>I accept Terms & Privacy Policy</FormLabel>
                            <FormDescription>Necessary for processing your application.</FormDescription>
                        </div>
                    </FormItem>
                )} />
              </section>
            </form>
          </Form>
      </ScrollArea>

      <DialogFooter className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-background z-10">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="font-bold min-w-[150px]">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : <><Send className="mr-2 h-4 w-4" /> Submit Application</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
