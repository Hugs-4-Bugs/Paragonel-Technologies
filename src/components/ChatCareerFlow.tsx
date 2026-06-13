
"use client";

import React, { useState } from 'react';
import { ChatJobCard } from './ChatJobCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatCareerFlowProps {
  step: string;
  jobListings: any[];
  matchedJobs: any[];
  selectedJob: any;
  candidateProfile: any;
  onAcceptHelp: (accepted: boolean) => void;
  onJobSelect: (job: any) => void;
  onFileUpload: (file: File) => void;
  onConfirmProfile: (confirmed: boolean) => void;
  onApplyOnBehalf: (job: any) => void;
  onFinalSubmit: (approved: boolean) => void;
}

export function ChatCareerFlow({
  step,
  jobListings,
  matchedJobs,
  selectedJob,
  candidateProfile,
  onAcceptHelp,
  onJobSelect,
  onFileUpload,
  onConfirmProfile,
  onApplyOnBehalf,
  onFinalSubmit
}: ChatCareerFlowProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a resume smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid format",
        description: "Only PDF and DOCX files are supported.",
        variant: "destructive"
      });
      return;
    }

    onFileUpload(file);
  };

  if (step === 'offering_help') {
    return (
      <div className="flex gap-2 mt-2">
        <Button onClick={() => onAcceptHelp(true)} size="sm" className="flex-1 bg-primary text-white">Yes, help me find a role</Button>
        <Button onClick={() => onAcceptHelp(false)} size="sm" variant="outline" className="flex-1">No, I'll browse</Button>
      </div>
    );
  }

  if (step === 'showing_jobs') {
    return (
      <div className="flex flex-col space-y-2 w-full max-w-[90%]">
        {jobListings.map(job => (
          <ChatJobCard 
            key={job.id} 
            job={job} 
            onApply={() => onJobSelect(job)} 
            isApplied={selectedJob?.id === job.id}
          />
        ))}
      </div>
    );
  }

  if (step === 'resume_upload') {
    return (
      <div className="w-full mt-2 bg-muted/30 p-4 rounded-xl border border-dashed border-primary/40">
        <label className="flex flex-col items-center justify-center cursor-pointer text-center">
          <Upload className="h-8 w-8 mb-2 text-primary animate-pulse" />
          <p className="text-sm font-semibold">Click to upload your Resume</p>
          <p className="text-[10px] text-muted-foreground">Supported: PDF, DOCX (Max 5MB)</p>
          <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
        </label>
      </div>
    );
  }

  if (step === 'analyzing_resume') {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg w-fit">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-xs italic">Analyzing your profile...</span>
      </div>
    );
  }

  if (step === 'confirm_details' && candidateProfile) {
    return (
      <div className="w-full bg-card border rounded-xl p-4 my-2 text-xs space-y-3 shadow-lg">
        <h5 className="font-bold text-primary flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Candidate Profile Summary
        </h5>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <p><span className="text-muted-foreground">Name:</span> {candidateProfile.name}</p>
          <p><span className="text-muted-foreground">Email:</span> {candidateProfile.email}</p>
          <p><span className="text-muted-foreground">Phone:</span> {candidateProfile.phone}</p>
          <p><span className="text-muted-foreground">Exp:</span> {candidateProfile.experienceYears} Years</p>
          <p className="col-span-2"><span className="text-muted-foreground">Education:</span> {candidateProfile.education}</p>
          <p className="col-span-2"><span className="text-muted-foreground">Skills:</span> {candidateProfile.skills.join(', ')}</p>
        </div>
        <div className="flex gap-2 mt-4 pt-2 border-t">
          <Button onClick={() => onConfirmProfile(true)} size="sm" className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white">Confirm & Match</Button>
          <Button onClick={() => onConfirmProfile(false)} variant="outline" size="sm" className="flex-1 h-8">Edit Details</Button>
        </div>
      </div>
    );
  }

  if (step === 'matching_jobs') {
    return (
      <div className="flex flex-col space-y-2 w-full max-w-[95%] mt-2">
        {matchedJobs.slice(0, 3).map(job => (
          <ChatJobCard 
            key={job.id} 
            job={job} 
            onApply={() => onApplyOnBehalf(job)} 
            isApplied={selectedJob?.id === job.id}
          />
        ))}
      </div>
    );
  }

  if (step === 'apply_behalf') {
    return (
      <div className="flex flex-col gap-2 mt-2 w-full bg-primary/5 p-4 rounded-xl border border-primary/20">
        <div className="flex items-start gap-3 mb-3">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-xs">
            <p className="font-bold mb-1">Application Summary</p>
            <p><span className="text-muted-foreground">Applying for:</span> {selectedJob?.title}</p>
            <p><span className="text-muted-foreground">Resume:</span> {candidateProfile?.resumeUrl}</p>
            <p className="mt-2 text-[10px] text-muted-foreground italic">QuantumAI will submit your profile details and resume for this role.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onFinalSubmit(true)} className="flex-1 bg-primary text-white font-bold h-10 shadow-lg">Submit Application</Button>
          <Button onClick={() => onFinalSubmit(false)} variant="outline" className="flex-1 h-10">Cancel</Button>
        </div>
      </div>
    );
  }

  if (step === 'submitting') {
    return (
      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg w-fit">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-xs italic">Submitting your application...</span>
      </div>
    );
  }

  return null;
}
