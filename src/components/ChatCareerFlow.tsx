"use client";

import React from 'react';
import { ChatJobCard } from './ChatJobCard';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Info, Brain, Target, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CandidateProfile } from '@/hooks/useChatState';
import { cn } from '@/lib/utils';

interface ChatCareerFlowProps {
  step: string;
  matchedJobs: any[];
  selectedJob: any;
  candidateProfile: CandidateProfile | null;
  onAcceptHelp: (accepted: boolean) => void;
  onFileUpload: (file: File) => void;
  onConfirmProfile: (confirmed: boolean) => void;
  onApplyOnBehalf: (job: any) => void;
  onFinalSubmit: (approved: boolean) => void;
}

export function ChatCareerFlow({
  step,
  matchedJobs,
  selectedJob,
  candidateProfile,
  onAcceptHelp,
  onFileUpload,
  onConfirmProfile,
  onApplyOnBehalf,
  onFinalSubmit
}: ChatCareerFlowProps) {
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 10MB.", variant: "destructive" });
      return;
    }

    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid format", description: "Use PDF or DOCX.", variant: "destructive" });
      return;
    }

    onFileUpload(file);
  };

  if (step === 'offering_help') {
    return (
      <div className="space-y-4 w-full mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-3">
          <p className="text-xs font-bold text-primary flex items-center gap-2">
            <Brain className="h-4 w-4" /> Hiring Assistant
          </p>
          <ul className="space-y-2">
            {["Extract skills & experience", "Match against live roles", "Calculate fit scores", "Auto-prefill your application"].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-600 font-medium">
                <Target className="h-3 w-3 text-primary" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onAcceptHelp(true)} size="sm" className="flex-1 bg-primary text-white font-bold h-11 rounded-xl shadow-sm">Upload Resume</Button>
          <Button onClick={() => onAcceptHelp(false)} size="sm" variant="outline" className="flex-1 h-11 rounded-xl">I'll Apply Later</Button>
        </div>
      </div>
    );
  }

  if (step === 'resume_upload') {
    return (
      <div className={cn(
        "w-full mt-2 bg-muted/30 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all flex items-center justify-center animate-in zoom-in-95",
        "h-[90px] sm:h-[110px] lg:h-[120px]" // Standardized responsive heights
      )}>
        <label className="flex flex-col items-center justify-center cursor-pointer text-center w-full h-full px-4">
          <Upload className="h-6 w-6 sm:h-7 sm:w-7 mb-1 text-primary animate-bounce" />
          <p className="text-xs sm:text-sm font-black">Drop your resume here</p>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground">PDF or DOCX (Max 10MB)</p>
          <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
        </label>
      </div>
    );
  }

  if (step === 'analyzing_resume') {
    return (
      <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 w-full animate-pulse my-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-xs sm:text-sm font-bold text-primary">QuantumAI is extracting your profile...</span>
      </div>
    );
  }

  if (step === 'confirm_details' && candidateProfile) {
    return (
      <div className="w-full bg-card border rounded-2xl p-4 sm:p-5 my-2 text-xs space-y-4 shadow-xl animate-in slide-in-from-right-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h5 className="font-black text-primary flex items-center gap-2 text-sm sm:text-base">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" /> Detected Profile
          </h5>
          <span className="text-[9px] sm:text-[10px] font-black uppercase text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
            {candidateProfile.seniority} {candidateProfile.domain}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-zinc-400 font-bold uppercase text-[9px] mb-0.5">Name</p><p className="font-black text-sm">{candidateProfile.name}</p></div>
          <div><p className="text-zinc-400 font-bold uppercase text-[9px] mb-0.5">Experience</p><p className="font-black text-sm">{candidateProfile.experienceYears} Years</p></div>
          <div className="col-span-2"><p className="text-zinc-400 font-bold uppercase text-[9px] mb-0.5">Key Skills</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {candidateProfile.skills.slice(0, 8).map(s => <span key={s} className="px-2 py-1 bg-zinc-100 rounded-md font-bold text-[10px]">{s}</span>)}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={() => onConfirmProfile(true)} size="sm" className="flex-1 h-11 bg-primary text-white font-black rounded-xl">Confirm & Match</Button>
          <Button onClick={() => onConfirmProfile(false)} variant="outline" size="sm" className="flex-1 h-11 rounded-xl">Try Again</Button>
        </div>
      </div>
    );
  }

  if (step === 'matching_jobs') {
    return (
      <div className="flex flex-col space-y-3 w-full mt-2 pb-2">
        {matchedJobs.length > 0 ? (
          matchedJobs.map(job => (
            <ChatJobCard 
              key={job.id} 
              job={job} 
              onApply={() => onApplyOnBehalf(job)} 
              isApplied={selectedJob?.id === job.id}
            />
          ))
        ) : (
          <div className="p-5 bg-muted/50 rounded-2xl border text-center space-y-2">
            <Info className="h-7 w-7 mx-auto text-zinc-400" />
            <p className="text-xs sm:text-sm font-bold text-zinc-500">No roles match your current profile perfectly (min. 60%).</p>
            <Button variant="link" asChild className="text-xs sm:text-sm p-0 h-auto font-black text-primary">
               <a href="/careers">Browse All Openings Manually</a>
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (step === 'apply_behalf') {
    return (
      <div className="flex flex-col gap-4 mt-2 w-full bg-primary/5 p-5 rounded-2xl border border-primary/20 shadow-lg animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>
          <div className="text-xs sm:text-sm">
            <p className="font-black mb-1">AI-Assisted Submission</p>
            <p className="text-zinc-500 font-medium leading-relaxed">
              Applying for <span className="text-primary font-bold">{selectedJob?.title}</span>. I'll prefill everything using your profile.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onFinalSubmit(true)} className="flex-1 bg-primary text-white font-black h-12 rounded-xl shadow-xl">Submit Now</Button>
          <Button onClick={() => onFinalSubmit(false)} variant="outline" className="flex-1 h-12 rounded-xl">Cancel</Button>
        </div>
      </div>
    );
  }

  return null;
}
