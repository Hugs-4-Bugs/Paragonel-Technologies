
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
import { formatApplicationEmail, type FormatApplicationEmailOutput } from "@/ai/flows/format-application-email-flow";
import { Loader2, Send, Briefcase, User, GraduationCap, BriefcaseBusiness, Info, ShieldCheck, BellDot, Link as LinkIcon } from "lucide-react";
import { educationQualifications, noticePeriods, generateYearOptions, locations as preferredLocations } from "@/lib/data";

interface ApplyJobModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]; // PDF, DOCX, DOC

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).regex(/^\+?[0-9\s-()]+$/, "Invalid phone number format."),
  resume: z.any()
    .refine((files): files is FileList => files instanceof FileList && files.length > 0, "Resume is required.")
    .refine((files): files is FileList => files instanceof FileList && files?.[0]?.size <= MAX_FILE_SIZE, `Resume size must be less than 5MB.`)
    .refine(
      (files): files is FileList => files instanceof FileList && ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Resume must be a PDF, DOC, or DOCX file."
    ),
  linkedinProfile: z.string().url({ message: "Please enter a valid LinkedIn Profile URL." }).optional().or(z.literal('')),
  portfolioWebsite: z.string().url({ message: "Please enter a valid Portfolio Website URL." }).optional().or(z.literal('')),
  codingProfileUrl: z.string().url({ message: "Please enter a valid Coding Profile URL." }).optional().or(z.literal('')),
  
  highestQualification: z.string().min(1, "Highest qualification is required."),
  specialization: z.string().min(2, "Specialization/Branch is required."),
  university: z.string().min(2, "University/College name is required."),
  passingYear: z.string().min(4, "Passing year is required."),
  marks: z.string().min(1, "Marks/Percentage/CGPA is required."),

  primarySkills: z.string().min(2, "Primary skills are required. (e.g., Java, Python, SQL)"),
  secondarySkills: z.string().optional(),

  isFresher: z.boolean().default(false),
  companyName: z.string().optional(),
  jobTitleExperience: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  isCurrentlyWorking: z.boolean().optional().default(false),
  jobDescription: z.string().optional(),
  
  coverLetter: z.string().optional(),
  preferredJobLocation: z.string().min(1, "Preferred job location is required."),
  currentCTC: z.string().optional(),
  expectedSalary: z.string().min(1, "Expected salary is required."),
  noticePeriod: z.string().min(1, "Notice period is required."),

  acceptTerms: z.boolean().refine(val => val === true, { message: "You must accept the Terms and Conditions and Privacy Policy." }),
  notifySimilarJobs: z.boolean().default(false),

  jobId: z.string(),
  jobTitle: z.string(),
}).superRefine((data, ctx) => {
  if (!data.isFresher) {
    if (!data.companyName || data.companyName.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Company name is required for experienced candidates.", path: ["companyName"] });
    }
    if (!data.jobTitleExperience || data.jobTitleExperience.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Job title is required for experienced candidates.", path: ["jobTitleExperience"] });
    }
    if (!data.fromDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "From date is required for experienced candidates.", path: ["fromDate"] });
    }
    if (!data.isCurrentlyWorking && !data.toDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "To date is required if not currently working.", path: ["toDate"] });
    }
    if (data.fromDate && data.toDate && !data.isCurrentlyWorking && new Date(data.toDate) < new Date(data.fromDate)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "'To Date' cannot be earlier than 'From Date'.", path: ["toDate"] });
    }
    if (!data.jobDescription || data.jobDescription.length < 10) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Job description/roles are required (min 10 chars).", path: ["jobDescription"] });
    }
  }
});

const passingYearOptions = generateYearOptions();

export function ApplyJobModal({ isOpen, onOpenChange, job }: ApplyJobModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      linkedinProfile: "",
      portfolioWebsite: "",
      codingProfileUrl: "",
      highestQualification: "",
      specialization: "",
      university: "",
      passingYear: "",
      marks: "",
      primarySkills: "",
      secondarySkills: "",
      isFresher: false,
      companyName: "",
      jobTitleExperience: "",
      fromDate: "",
      toDate: "",
      isCurrentlyWorking: false,
      jobDescription: "",
      coverLetter: "",
      preferredJobLocation: "",
      currentCTC: "",
      expectedSalary: "",
      noticePeriod: "",
      acceptTerms: false,
      notifySimilarJobs: false,
      jobId: job?.id || "",
      jobTitle: job?.title || "",
      resume: undefined as any,
    },
  });
  
  useEffect(() => {
    if (job) {
      form.reset({
        fullName: "",
        email: "",
        phone: "",
        linkedinProfile: "",
        portfolioWebsite: "",
        codingProfileUrl: "",
        highestQualification: "",
        specialization: "",
        university: "",
        passingYear: "",
        marks: "",
        primarySkills: "",
        secondarySkills: "",
        isFresher: false,
        companyName: "",
        jobTitleExperience: "",
        fromDate: "",
        toDate: "",
        isCurrentlyWorking: false,
        jobDescription: "",
        coverLetter: "",
        preferredJobLocation: "",
        currentCTC: "",
        expectedSalary: "",
        noticePeriod: "",
        acceptTerms: false,
        notifySimilarJobs: false,
        jobId: job.id,
        jobTitle: job.title,
        resume: undefined as any,
      });
    }
  }, [job, form, isOpen]);

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  async function onSubmit(values: ApplicationFormValues) {
    if (!job) return;
    setIsSubmitting(true);

    try {
      const resumeFile = values.resume[0];
      const resumeDataUri = await readFileAsDataURL(resumeFile);

      const emailInput = {
        ...values,
        resumeDataUri, // For Genkit flow context if needed, but not directly in email body
        resumeFileName: resumeFile.name,
        jobTitle: job.title,
        jobId: job.id,
      };
      
      // Exclude the FileList object from Genkit input
      const { resume, ...inputForGenkit } = emailInput;
      
      const emailOutput: FormatApplicationEmailOutput = await formatApplicationEmail(inputForGenkit);

      // --- START: Simulated Email Sending ---
      console.log("SIMULATION: Application data and prepared emails:");
      
      console.log("\n--- Email to Admin (erprabhat72@gmail.com) ---");
      console.log("Subject:", emailOutput.adminEmailSubject);
      console.log("Body:\n", emailOutput.adminEmailBody);
      console.log("Resume to attach (simulated):", resumeFile.name);

      console.log("\n--- Confirmation Email to Applicant (" + values.email + ") ---");
      console.log("Subject:", emailOutput.applicantConfirmationSubject);
      console.log("Body:\n", emailOutput.applicantConfirmationBody);
      // --- END: Simulated Email Sending ---

      toast({
        title: "Application Submitted!",
        description: `Thank you, ${values.fullName}! Your application for "${job.title}" has been received. A confirmation email will be sent to you shortly (simulated).`,
        duration: 5000,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Error",
        description: "Could not submit your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!job) return null;
  const watchIsFresher = form.watch("isFresher");
  const watchIsCurrentlyWorking = form.watch("isCurrentlyWorking");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl flex flex-col h-[95svh] sm:h-[90svh] shadow-2xl border-primary/30 p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b flex-shrink-0">
          <DialogTitle className="text-2xl md:text-3xl flex items-center font-bold text-foreground">
            <Briefcase className="mr-3 h-7 w-7 text-primary neon-icon" /> Apply for: {job.title}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Fill in your details carefully to apply for the {job.title} position at QuantumFusion Solutions.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              <section className="space-y-6 p-6 rounded-lg border bg-card shadow-sm">
                <h3 className="text-xl font-semibold flex items-center text-primary"><User className="mr-2 h-5 w-5"/>Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <FormField control={form.control} name="fullName" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Prabhat Kumar" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="your.email@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="+91 1234567890" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="linkedinProfile" render={({ field }) => (<FormItem><FormLabel>LinkedIn Profile URL (Optional)</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/yourprofile" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="portfolioWebsite" render={({ field }) => (<FormItem><FormLabel>Portfolio Website URL (Optional)</FormLabel><FormControl><Input placeholder="https://yourportfolio.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="codingProfileUrl" render={({ field }) => (<FormItem><FormLabel>Coding Profile URL (Optional)</FormLabel><FormControl><Input placeholder="https://github.com/yourusername" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="resume" render={({ field: { onChange, value, ...rest } }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Resume (PDF, DOC, DOCX - Max 5MB)</FormLabel>
                        <FormControl><Input type="file" accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => onChange(e.target.files)} {...rest} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                </div>
              </section>

              <section className="space-y-6 p-6 rounded-lg border bg-card shadow-sm">
                <h3 className="text-xl font-semibold flex items-center text-primary"><GraduationCap className="mr-2 h-5 w-5"/>Education Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <FormField control={form.control} name="highestQualification" render={({ field }) => (<FormItem><FormLabel>Highest Qualification</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select qualification" /></SelectTrigger></FormControl><SelectContent>{educationQualifications.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="specialization" render={({ field }) => (<FormItem><FormLabel>Specialization / Branch</FormLabel><FormControl><Input placeholder="e.g., Computer Science" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="university" render={({ field }) => (<FormItem><FormLabel>University / College Name</FormLabel><FormControl><Input placeholder="e.g., XYZ University" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="passingYear" render={({ field }) => (<FormItem><FormLabel>Passing Year</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger></FormControl><SelectContent>{passingYearOptions.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="marks" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Marks / Percentage / CGPA</FormLabel><FormControl><Input placeholder="e.g., 85% or 8.5 CGPA" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </section>

              <section className="space-y-6 p-6 rounded-lg border bg-card shadow-sm">
                <h3 className="text-xl font-semibold flex items-center text-primary"><Info className="mr-2 h-5 w-5"/>Skills</h3>
                <FormField control={form.control} name="primarySkills" render={({ field }) => (<FormItem><FormLabel>Primary Skills (Comma separated)</FormLabel><FormControl><Textarea placeholder="e.g., Java, Python, React, AWS" {...field} /></FormControl><FormDescription>List your core technical skills.</FormDescription><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="secondarySkills" render={({ field }) => (<FormItem><FormLabel>Secondary Skills (Optional, Comma separated)</FormLabel><FormControl><Textarea placeholder="e.g., Communication, Teamwork, Git" {...field} /></FormControl><FormDescription>List other relevant skills.</FormDescription><FormMessage /></FormItem>)} />
              </section>

              <section className="space-y-6 p-6 rounded-lg border bg-card shadow-sm">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold flex items-center text-primary"><BriefcaseBusiness className="mr-2 h-5 w-5"/>Work Experience</h3>
                    <FormField control={form.control} name="isFresher" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="isFresher" /></FormControl>
                            <FormLabel htmlFor="isFresher" className="font-normal cursor-pointer">I am a Fresher</FormLabel>
                        </FormItem>
                    )} />
                </div>
                {!watchIsFresher && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <FormField control={form.control} name="companyName" render={({ field }) => (<FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="Latest Company" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="jobTitleExperience" render={({ field }) => (<FormItem><FormLabel>Job Title / Designation</FormLabel><FormControl><Input placeholder="Your Role" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="fromDate" render={({ field }) => (<FormItem><FormLabel>From Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="toDate" render={({ field }) => (
                            <FormItem>
                                <FormLabel>To Date {watchIsCurrentlyWorking && "(Leave blank if current)"}</FormLabel>
                                <FormControl><Input type="date" {...field} disabled={watchIsCurrentlyWorking} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="isCurrentlyWorking" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="isCurrentlyWorking" /></FormControl>
                            <FormLabel htmlFor="isCurrentlyWorking" className="font-normal cursor-pointer">I am currently working here</FormLabel>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="jobDescription" render={({ field }) => (<FormItem><FormLabel>Job Description / Roles & Responsibilities</FormLabel><FormControl><Textarea placeholder="Describe your key responsibilities and achievements..." className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                )}
              </section>

              <section className="space-y-6 p-6 rounded-lg border bg-card shadow-sm">
                <h3 className="text-xl font-semibold flex items-center text-primary"><Info className="mr-2 h-5 w-5"/>Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <FormField control={form.control} name="preferredJobLocation" render={({ field }) => (<FormItem><FormLabel>Preferred Job Location</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger></FormControl><SelectContent>{preferredLocations.filter(l => l !== "All Locations").map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="currentCTC" render={({ field }) => (<FormItem><FormLabel>Current CTC (Annual, Optional)</FormLabel><FormControl><Input placeholder="e.g., 10 LPA or 1000000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="expectedSalary" render={({ field }) => (<FormItem><FormLabel>Expected Salary (Annual)</FormLabel><FormControl><Input placeholder="e.g., 12 LPA or 1200000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="noticePeriod" render={({ field }) => (<FormItem><FormLabel>Notice Period</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select notice period" /></SelectTrigger></FormControl><SelectContent>{noticePeriods.map(np => <SelectItem key={np} value={np}>{np}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="coverLetter" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Cover Letter (Optional)</FormLabel><FormControl><Textarea placeholder="Tell us why you are a great fit for this role..." className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </section>

              <section className="space-y-6 p-6 rounded-lg border bg-card shadow-sm">
                <h3 className="text-xl font-semibold flex items-center text-primary"><ShieldCheck className="mr-2 h-5 w-5"/>Declarations</h3>
                <FormField control={form.control} name="acceptTerms" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-background">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer">I accept the Terms and Conditions and Privacy Policy.</FormLabel>
                            <FormDescription>By submitting this application, you agree to our data handling practices.</FormDescription>
                            <FormMessage />
                        </div>
                    </FormItem>
                )} />
                <FormField control={form.control} name="notifySimilarJobs" render={({ field }) => (
                     <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="notifySimilarJobs" /></FormControl>
                        <FormLabel htmlFor="notifySimilarJobs" className="font-normal cursor-pointer text-sm">Notify me of similar jobs in the future.</FormLabel>
                     </FormItem>
                )} />
              </section>

              {/* Hidden fields for job ID and title */}
              <input type="hidden" {...form.register("jobId")} />
              <input type="hidden" {...form.register("jobTitle")} />
            </form>
          </Form>
      </ScrollArea>

      <DialogFooter className="p-6 border-t flex-shrink-0 flex justify-end gap-3 sticky bottom-0 bg-background z-10">
        <DialogClose asChild>
          <Button variant="outline" disabled={isSubmitting} size="lg">Cancel</Button>
          </DialogClose>
          <Button
            type="button" // Changed from submit to prevent direct form submission, handled by onClick
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</>
            ) : (
              <><Send className="mr-2 h-5 w-5" /> Submit Application</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

