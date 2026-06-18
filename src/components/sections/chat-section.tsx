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
    let score = 0;
    const reasons: string[] = [];

    // 1. Skills (40%)
    const jobSkills = (job.skills || []).map((s: string) => s.toLowerCase());
    const userSkills = (profile.skills || []).map((s: string) => s.toLowerCase());
    const matchedSkills = jobSkills.filter((s: string) => userSkills.includes(s));
    const skillScore = (matchedSkills.length / Math.max(1, jobSkills.length)) * 40;
    score += skillScore;
    if (matchedSkills.length > 0) reasons.push(`${matchedSkills.length} key skills matched`);

    // 2. Experience (25%)
    const jobExp = parseInt(job.experienceRequired) || 0;
    if (profile.experienceYears >= jobExp) {
      score += 25;
      reasons.push("Experience meets requirement");
    } else if (profile.experienceYears >= jobExp - 1) {
      score += 15;
      reasons.push("Experience closely aligns");
    }

    // 3. Domain (20%)
    if (profile.domain.toLowerCase().includes(job.department.toLowerCase()) || 
        job.title.toLowerCase().includes(profile.domain.toLowerCase())) {
      score += 20;
      reasons.push(`${profile.domain} specialization`);
    }

    // 4. Seniority & Education (15%)
    if (job.title.toLowerCase().includes(profile.seniority.toLowerCase())) {
      score += 10;
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
        addMessage('ai', response.answer);
      } else {
        addMessage('ai', response.answer);
      }
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

    updateCareerStep('submitting'); // Show loader
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
        ? `I've found ${matches.length} roles that align with your ${candidateProfile?.domain} background! Select a role to apply instantly.` 
        : "I couldn't find a high-affinity match (60%+) right now, but our team reviews all profiles. You can still apply manually.");
    } catch (e) {
      addMessage('ai', "Failed to fetch live roles. Please try again.");
      updateCareerStep('idle');
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

    updateCareerStep('submitting');
    setIsLoading(true);

    try {
      const appId = 'APP_' + Math.random().toString(36).substr(2, 9);
      await addDoc(collection(db, 'jobApplications'), {
        applicationId: appId,
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        candidateName: candidateProfile?.name,
        candidateEmail: candidateProfile?.email,
        candidatePhone: candidateProfile?.phone,
        skills: candidateProfile?.skills,
        experienceYears: candidateProfile?.experienceYears,
        candidate_score: selectedJob.matchScore,
        recommended_by_ai: true,
        appliedAt: serverTimestamp(),
        appliedVia: 'ai_agent',
        status: 'New'
      });

      console.log(`SIMULATION: Email sent to ${candidateProfile?.email} (Application Received)`);
      console.log(`SIMULATION: Email sent to hr@quantumfusion.in (New AI Match: ${selectedJob.matchScore}%)`);
      
      updateCareerStep('submitted');
      addMessage('ai', (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
          <p className="font-black text-green-700 text-sm">Application Submitted Successfully!</p>
          <p className="text-xs text-green-600 mt-1">Reference: {appId}</p>
          <p className="text-[10px] text-zinc-500 mt-2">A confirmation has been sent to your email. Our HR team has been notified of your high-affinity match.</p>
        </div>
      ));
    } catch (e) {
      addMessage('ai', "Submission failed. Please apply manually on the careers page.");
      updateCareerStep('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '' || isLoading) return;
    const userText = inputValue;
    addMessage('user', userText);
    setInputValue('');
    handleNormalQna(userText);
  };

  const renderContent = (content: string | React.ReactNode) => {
    if (typeof content !== 'string') return content;
    const parts = content.split(/(\[.*?\]\(.*?\))/g);
    return (
      <div className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          const match = part.match(/\[(.*?)\]\((.*?)\)/);
          if (match) {
            const isExternal = match[2].startsWith('http');
            return (
              <Link 
                key={i} 
                href={match[2]} 
                className="text-primary font-black hover:underline inline-flex items-center gap-0.5 mx-1"
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
              >
                {match[1]}
                {isExternal && <ExternalLink className="h-2 w-2" />}
              </Link>
            );
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
        size="lg"
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-[40] bg-primary text-white hover:scale-110 transition-transform p-0 flex items-center justify-center border-4 border-white/20"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-8 w-8" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-0 right-0 w-full sm:w-[420px] h-[80vh] sm:h-[700px] sm:bottom-6 sm:right-6 shadow-2xl z-[40] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden border-none bg-background animate-in slide-in-from-bottom duration-300">
      <CardHeader className="flex flex-row items-center justify-between p-5 border-b bg-primary text-primary-foreground flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-black tracking-tight">QuantumAI</CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Active Talent Agent</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={clearChat} className="h-9 w-9 hover:bg-white/20 text-white rounded-xl"><Trash2 className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-9 w-9 hover:bg-white/20 text-white rounded-xl"><X className="h-5 w-5" /></Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow p-0 overflow-hidden bg-background">
        <ScrollArea className="h-full p-5" ref={scrollAreaRef}>
          <div className="space-y-6 pb-6">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? 'items-end' : 'items-start')}>
                <div className={cn(
                    "max-w-[90%] rounded-[1.5rem] px-5 py-4 text-sm shadow-sm transition-all leading-relaxed font-medium",
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-foreground rounded-tl-none border border-zinc-200 dark:border-zinc-800'
                  )}>
                  {renderContent(msg.content)}
                </div>
                <span className="text-[9px] text-zinc-400 mt-1.5 px-2 font-black uppercase tracking-tighter">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
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
              />
            )}

            {isLoading && (
              <div className="flex justify-start items-center space-x-3 animate-in fade-in duration-300">
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-2.5 h-10 w-10 flex items-center justify-center border">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
                <span className="text-[11px] text-zinc-500 font-black italic uppercase tracking-widest">Processing...</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-5 border-t bg-background flex-shrink-0">
        <div className="relative w-full flex items-center gap-3">
          <Input
            type="text"
            placeholder="Ask about hiring, products, or services..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-grow h-14 rounded-2xl text-sm focus-visible:ring-primary border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 pr-14 font-medium"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            disabled={isLoading || inputValue.trim() === ''} 
            className="absolute right-1.5 top-1.5 h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
