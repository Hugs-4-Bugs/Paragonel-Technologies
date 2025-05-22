
"use client";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Job, ApplicationFormValues as FormValues } from "@/types"; // Renamed for clarity
import { formatApplicationEmail } from "@/ai/flows/format-application-email-flow";
import React, { useState, useEffect } from "react"; // Import React
import { Loader2, Send, FileText, Briefcase } from "lucide-react";

interface ApplyJobModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]; // PDF and DOCX

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  linkedinProfile: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  resume: z.any()
    .refine((files): files is FileList => files instanceof FileList && files.length > 0, "Resume is required.")
    .refine((files): files is FileList => files instanceof FileList && files?.[0]?.size <= MAX_FILE_SIZE, `Resume size must be less than 5MB.`)
    .refine(
      (files): files is FileList => files instanceof FileList && ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Resume must be a PDF or DOCX file."
    ),
  experienceLevel: z.enum(["fresher", "experienced"], { required_error: "Please select your experience level." }),
  workExperience: z.string().optional(),
  coverLetter: z.string().optional(),
  jobId: z.string(),
  jobTitle: z.string(),
}).refine(data => data.experienceLevel === "fresher" || (data.experienceLevel === "experienced" && data.workExperience && data.workExperience.trim().length > 0), {
  message: "Work experience is required if you are experienced.",
  path: ["workExperience"], 
});


export function ApplyJobModal({ isOpen, onOpenChange, job }: ApplyJobModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      linkedinProfile: "",
      // resume: undefined, // Will be handled by FileList
      experienceLevel: undefined,
      workExperience: "",
      coverLetter: "",
      jobId: job?.id || "",
      jobTitle: job?.title || "",
    },
  });
  
  // Update defaultValues when job changes
  useEffect(() => {
    if (job) {
      form.reset({
        fullName: "",
        email: "",
        phone: "",
        linkedinProfile: "",
        experienceLevel: undefined,
        workExperience: "",
        coverLetter: "",
        jobId: job.id,
        jobTitle: job.title,
        resume: undefined as any, // Reset resume field
      });
    }
  }, [job, form]);

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  async function onSubmit(values: FormValues) {
    if (!job) return;
    setIsSubmitting(true);

    try {
      const resumeFile = values.resume[0];
      const resumeDataUri = await readFileAsDataURL(resumeFile);

      const emailInput = {
        applicantName: values.fullName,
        applicantEmail: values.email,
        applicantPhone: values.phone,
        jobTitle: job.title,
        jobId: job.id,
        resumeDataUri,
        resumeFileName: resumeFile.name,
        experienceLevel: values.experienceLevel,
        workExperience: values.workExperience,
        coverLetter: values.coverLetter,
        linkedinProfile: values.linkedinProfile,
      };
      
      const formattedEmail = await formatApplicationEmail(emailInput);

      console.log("SIMULATION: Application email ready to be sent to erprabhat72@gmail.com");
      console.log("Subject:", formattedEmail.emailSubject);
      console.log("Body:", formattedEmail.emailBody);
      // console.log("Resume Data URI (first 100 chars):", resumeDataUri.substring(0,100));


      toast({
        title: "Application Submitted!",
        description: "Your application for " + job.title + " has been received (simulated).",
        variant: "default",
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90svh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            <Briefcase className="mr-2 h-6 w-6 text-primary neon-icon" /> Apply for: {job.title}
          </DialogTitle>
          <DialogDescription>
            Fill in your details to apply for the {job.title} position at QuantumFusion Solutions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto px-1 py-2 flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Prabhat Kumar" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input type="email" placeholder="your.email@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl><Input type="tel" placeholder="+1234567890" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedinProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile (Optional)</FormLabel>
                    <FormControl><Input placeholder="https://linkedin.com/in/yourprofile" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="resume"
                render={({ field: { onChange, value, ...rest } }) => ( // Destructure onChange
                  <FormItem>
                    <FormLabel>Resume (PDF or DOCX, Max 5MB)</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept=".pdf,.docx" 
                        onChange={(e) => onChange(e.target.files)} // Pass FileList to RHF
                        {...rest} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="experienceLevel"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Experience Level</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="fresher" /></FormControl>
                        <FormLabel className="font-normal">Fresher</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="experienced" /></FormControl>
                        <FormLabel className="font-normal">Experienced</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("experienceLevel") === "experienced" && (
              <FormField
                control={form.control}
                name="workExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Experience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your previous roles and responsibilities..."
                        className="resize-y min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us why you're a good fit for this role..."
                      className="resize-y min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <input type="hidden" {...form.register("jobId")} />
            <input type="hidden" {...form.register("jobTitle")} />
          </form>
        </Form>
        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Submit Application
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
