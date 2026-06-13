
"use client";

import React, { useState } from 'react';
import { ChatJobCard } from './ChatJobCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatCareerFlowProps {
  step: string;
  jobListings: any[];
  matchedJobs: any[];
  selectedJob: any;
  candidateProfile: any;
  onJobSelect: (job: any) => void;
  onFileUpload: (file: File) => void;
  onConfirmProfile: (confirmed: boolean) => void;
  onFinalApply: (method: 'ai' | 'manual') => void;
}

export function ChatCareerFlow({
  step,
  jobListings,
  matchedJobs,
  selectedJob,
  candidateProfile,
  onJobSelect,
  onFileUpload,
  onConfirmProfile,
  onFinalApply
}: ChatCareerFlowProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true);
    // Simulation of upload time
    setTimeout(() => {
      onFileUpload(file);
      setIsUploading(false);
    }, 1500);
  };

  if (step === 'showing_jobs') {
    return (
      <div className="flex flex-col space-y-2 w-full">
        {jobListings.length > 0 ? (
          jobListings.map(job => (
            <ChatJobCard 
              key={job.id} 
              job={job} 
              onApply={() => onJobSelect(job)} 
              isApplied={selectedJob?.id === job.id}
            />
          ))
        ) : (
          <div className="flex items-center p-3 text-xs text-muted-foreground bg-muted/30 rounded-lg">
            <Loader2 className="h-3 w-3 animate-spin mr-2" />
            Fetching latest openings...
          </div>
        )}
      </div>
    );
  }

  if (step === 'resume_upload') {
    return (
      <div className="w-full mt-2">
        <label 
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors border-primary/20"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 mb-3 text-primary" />
                <p className="mb-2 text-xs text-foreground font-semibold">Click to upload resume</p>
                <p className="text-[10px] text-muted-foreground">PDF or DOCX (Max 5MB)</p>
              </>
            )}
          </div>
          <Input 
            id="dropzone-file" 
            type="file" 
            className="hidden" 
            accept=".pdf,.docx"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>
    );
  }

  if (step === 'confirm_details' && candidateProfile) {
    return (
      <div className="w-full bg-card border rounded-lg p-4 my-2 text-xs space-y-2">
        <h5 className="font-bold text-primary flex items-center">
          <FileText className="h-3 w-3 mr-2" />
          Profile Details
        </h5>
        <div className="space-y-1 mt-2">
          <p><span className="text-muted-foreground">Name:</span> {candidateProfile.name}</p>
          <p><span className="text-muted-foreground">Email:</span> {candidateProfile.email}</p>
          <p><span className="text-muted-foreground">Phone:</span> {candidateProfile.phone}</p>
          <p><span className="text-muted-foreground">Skills:</span> {candidateProfile.skills.join(', ')}</p>
          <p><span className="text-muted-foreground">Experience:</span> {candidateProfile.experienceYears} Years</p>
        </div>
        <div className="flex gap-2 mt-4">
          <Button 
            onClick={() => onConfirmProfile(true)}
            size="sm" 
            className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white"
          >
            YES, Confirm
          </Button>
          <Button 
            onClick={() => onConfirmProfile(false)}
            variant="outline" 
            size="sm" 
            className="flex-1 h-8"
          >
            Edit Info
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'matching_jobs') {
    return (
      <div className="flex flex-col space-y-2 w-full mt-2">
        {matchedJobs.map(job => (
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

  if (step === 'apply_behalf') {
    return (
      <div className="flex flex-col gap-2 mt-2 w-full">
        <Button 
          onClick={() => onFinalApply('ai')}
          className="w-full bg-primary text-primary-foreground font-bold h-10 shadow-lg hover:shadow-xl transition-all"
        >
          Yes, Apply For Me
        </Button>
        <Button 
          onClick={() => onFinalApply('manual')}
          variant="outline" 
          className="w-full h-10 border-primary/20 text-primary"
        >
          I'll Apply Manually →
        </Button>
      </div>
    );
  }

  if (step === 'submitted') {
    return (
      <div className="w-full bg-green-500/10 border border-green-500/20 rounded-lg p-4 my-2 text-center">
        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
        <h5 className="font-bold text-green-600 text-sm">Application Submitted!</h5>
        <p className="text-[10px] text-muted-foreground mt-1">
          Your details for <span className="font-semibold text-foreground">{selectedJob?.title}</span> have been sent.
        </p>
      </div>
    );
  }

  return null;
}
