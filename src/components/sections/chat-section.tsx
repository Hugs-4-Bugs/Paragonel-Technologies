
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, X, Loader2, Bot, Trash2, ArrowRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { useChatState } from '@/hooks/useChatState';
import { ChatCareerFlow } from '@/components/ChatCareerFlow';
import { companyQnaFlow } from '@/ai/flows/company-qna-flow';
import { analyzeResume } from '@/ai/flows/analyze-resume-flow';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

export function ChatSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const {
    messages, addMessage, 
    careerStep, updateCareerStep, 
    candidateProfile, setCandidateProfile,
    selectedJob, setSelectedJob,
    jobListings, setJobListings,
    matchedJobs, setMatchedJobs,
    clearChat
  } = useChatState();

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage('ai', "Hi! I'm QuantumAI. I can help you explore our services, products, or help you find your next career leap at QuantumFusion Solutions. How can I assist today?");
    }
  }, [isOpen, messages.length, addMessage]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) scrollViewport.scrollTop = scrollViewport.scrollHeight;
    }
  }, [messages, careerStep, isLoading]);

  const calculateMatchScore = useCallback((job: any, profile: any) => {
    if (!profile) return { score: 0, reason: "" };
    let score = 0;
    const reasons: string[] = [];

    const jobSkills = (job.skills || []).map((s: string) => s.toLowerCase());
    const userSkills = (profile.skills || []).map((s: string) => s.toLowerCase());
    const matchedSkills = jobSkills.filter((s: string) => userSkills.includes(s));
    const skillScore = (matchedSkills.length / Math.max(1, jobSkills.length)) * 40;
    score += skillScore;
    if (matchedSkills.length > 0) reasons.push(`${matchedSkills.length} key skills matched`);

    const jobExp = parseInt(job.experienceRequired) || 0;
    if (profile.experienceYears >= jobExp) {
      score += 25;
      reasons.push("Experience meets requirement");
    }

    if (profile.domain?.toLowerCase().includes(job.department?.toLowerCase() || "")) {
      score += 20;
      reasons.push(`${profile.domain} specialization`);
    }
    
    return { 
      score: Math.min(100, Math.round(score)), 
      reason: reasons.slice(0, 3).join(', ') + '.' 
    };
  }, []);

  const handleNormalQna = async (text: string) => {
    setIsLoading(true);
    try {
      const response = await companyQnaFlow({ question: text });
      if (response.intent === 'careers') {
        updateCareerStep('offering_help');
      }
      addMessage('ai', response.answer);
    } catch (e) {
      addMessage('ai', "I'm having a small connection sync issue. You can browse our [Careers](/careers) or [Services](/services) directly.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptHelp = (accepted: boolean) => {
    if (accepted) {
      updateCareerStep('resume_upload');
      addMessage('ai', "Perfect. Please upload your resume so I can build your profile and match you to our engineering team.");
    } else {
      updateCareerStep('idle');
      addMessage('ai', "Understood! Feel free to browse our [Open Roles](/careers) whenever you're ready.");
    }
  };

  const handleFileUpload = async (file: File) => {
    updateCareerStep('analyzing_resume');
    setIsLoading(true);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const dataUri = reader.result as string;
      try {
        const analysis = await analyzeResume({ resumeDataUri: dataUri });
        setCandidateProfile({ ...analysis, resumeUrl: file.name, resumeDataUri: dataUri });
        updateCareerStep('confirm_details');
        addMessage('ai', "Analysis complete! I've extracted your core details. Please confirm them so I can run our matching engine.");
      } catch (err) {
        addMessage('ai', "I couldn't parse that file correctly. Please ensure it's a PDF or DOCX.");
        updateCareerStep('resume_upload');
      } finally {
        setIsLoading(false);
      }
    };
  };

  const handleConfirmProfile = async (confirmed: boolean) => {
    if (!confirmed) {
      updateCareerStep('resume_upload');
      return;
    }

    setIsLoading(true);
    try {
      const jobsSnap = await getDocs(query(collection(db, 'jobs'), where('isActive', '==', true)));
      const jobs = jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const matches = jobs.map(job => {
        const { score, reason } = calculateMatchScore(job, candidateProfile);
        return { ...job, matchScore: score, matchReason: reason };
      })
      .filter(j => j.matchScore >= 60)
      .sort((a, b) => b.matchScore - a.matchScore);

      setMatchedJobs(matches);
      updateCareerStep('matching_jobs');
      addMessage('ai', matches.length > 0 
        ? `I've found ${matches.length} roles that align with your background! Select a role to apply instantly.` 
        : "I couldn't find a high-affinity match right now, but our team reviews all profiles.");
    } catch (e) {
      addMessage('ai', "Failed to fetch live roles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyOnBehalf = (job: any) => {
    setSelectedJob(job);
    updateCareerStep('apply_behalf');
    addMessage('ai', `I'm ready to submit your profile for the ${job.title} position. Ready?`);
  };

  const handleFinalSubmit = async (approved: boolean) => {
    if (!approved) {
      updateCareerStep('matching_jobs');
      return;
    }

    setIsLoading(true);
    try {
      const appId = 'APP_' + Math.random().toString(36).substr(2, 9);
      await addDoc(collection(db, 'jobApplications'), {
        applicationId: appId,
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        candidateName: candidateProfile?.name,
        candidateEmail: candidateProfile?.email,
        appliedAt: serverTimestamp(),
        appliedVia: 'ai_agent',
        status: 'New'
      });

      updateCareerStep('submitted');
      addMessage('ai', "Application Submitted Successfully! Our team will review your profile shortly.");
    } catch (e) {
      addMessage('ai', "Submission failed. Please apply manually on the careers page.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (content: string | React.ReactNode) => {
    if (typeof content !== 'string') return content;
    const parts = content.split(/(\[.*?\]\(.*?\))/g);
    return (
      <div className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          const match = part.match(/\[(.*?)\]\((.*?)\)/);
          if (match) {
            return <Link key={i} href={match[2]} className="text-primary font-bold hover:underline mx-1">{match[1]}</Link>;
          }
          return part;
        })}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <Button
        variant="default"
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-[40] bg-primary text-white hover:scale-110 transition-transform p-0 flex items-center justify-center"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-8 w-8" />
      </Button>
    );
  }

  return (
    <Card 
      className={cn(
        "fixed z-[40] flex flex-col bg-background animate-in slide-in-from-bottom duration-300 shadow-2xl border-none overflow-hidden",
        "bottom-0 right-0 w-full h-[100dvh] rounded-none", // Mobile Fit Fix
        "sm:bottom-6 sm:right-6 sm:w-[340px] sm:h-[550px] sm:max-h-[80vh] sm:rounded-[2rem]", // Compact Desktop
        "md:w-[360px] md:h-[600px]",
        "lg:w-[380px]"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between p-5 border-b bg-primary text-primary-foreground flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-black tracking-tight">QuantumAI</CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8 hover:bg-white/20 text-white"><Trash2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-white/20 text-white"><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow p-0 overflow-hidden bg-background">
        <ScrollArea className="h-full p-5" ref={scrollAreaRef}>
          <div className="space-y-6 pb-6">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? 'items-end' : 'items-start')}>
                <div className={cn(
                    "max-w-[85%] rounded-[1.5rem] px-5 py-3 text-sm shadow-sm transition-all leading-relaxed",
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-foreground rounded-tl-none border border-zinc-200 dark:border-zinc-800'
                  )}>
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}

            {careerStep !== 'idle' && (
              <ChatCareerFlow 
                step={careerStep}
                matchedJobs={matchedJobs}
                selectedJob={selectedJob}
                candidateProfile={candidateProfile}
                onAcceptHelp={handleAcceptHelp}
                onFileUpload={handleFileUpload}
                onConfirmProfile={handleConfirmProfile}
                onApplyOnBehalf={handleApplyOnBehalf}
                onFinalSubmit={handleFinalSubmit}
                onManualEntry={() => updateCareerStep('resume_upload')} // Simple mapping for V2
              />
            )}

            {isLoading && (
              <div className="flex justify-start items-center space-x-2 animate-pulse">
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-full h-8 w-8 flex items-center justify-center border">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-background flex-shrink-0">
        <div className="relative w-full flex items-center gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-grow h-12 rounded-2xl text-sm focus-visible:ring-primary bg-zinc-50 dark:bg-zinc-900 pr-12"
            disabled={isLoading}
          />
          <Button 
            onClick={() => {
              if (inputValue.trim() === '' || isLoading) return;
              const userText = inputValue;
              addMessage('user', userText);
              setInputValue('');
              handleNormalQna(userText);
            }} 
            size="icon" 
            disabled={isLoading || inputValue.trim() === ''} 
            className="absolute right-1.5 top-1.5 h-9 w-9 rounded-xl bg-primary"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  function handleSendMessage() {
    if (inputValue.trim() === '' || isLoading) return;
    const userText = inputValue;
    addMessage('user', userText);
    setInputValue('');
    handleNormalQna(userText);
  }
}
