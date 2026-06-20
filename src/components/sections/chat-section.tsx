"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, X, Loader2, Bot, Trash2, ShieldCheck, FileText, Target, Brain } from 'lucide-react';
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
    matchedJobs, setMatchedJobs,
    clearChat
  } = useChatState();

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage('ai', "Hi! I'm QuantumAI, your career & company companion. I can help you find your next engineering role at QuantumFusion. How can I help?");
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
    
    score += (matchedSkills.length / Math.max(1, jobSkills.length)) * 40;
    if (matchedSkills.length > 0) reasons.push(`${matchedSkills.length} skills match`);

    const jobExp = parseInt(job.experienceRequired) || 0;
    if (profile.experienceYears >= jobExp) {
      score += 25;
      reasons.push("Experience requirement met");
    }

    if (profile.domain?.toLowerCase().includes(job.department?.toLowerCase() || "")) {
      score += 20;
      reasons.push(`${profile.domain} domain expert`);
    }
    
    return { 
      score: Math.min(100, Math.round(score)), 
      reason: reasons.slice(0, 3).join(', ') + '.' 
    };
  }, []);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;
    const userText = inputValue;
    addMessage('user', userText);
    setInputValue('');
    
    setIsLoading(true);
    try {
      const response = await companyQnaFlow({ question: userText });
      if (response.intent === 'careers') {
        updateCareerStep('offering_help');
      }
      addMessage('ai', response.answer);
    } catch (e) {
      addMessage('ai', "I encountered a sync issue. You can explore [Careers](/careers) manually.");
    } finally {
      setIsLoading(false);
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
        const profile = await analyzeResume({ resumeDataUri: dataUri });
        setCandidateProfile({ ...profile, resumeUrl: file.name, resumeDataUri: dataUri });
        updateCareerStep('confirm_details');
        addMessage('ai', "Extraction complete. Here is the profile I built for you. Please confirm to see your job matches.");
      } catch (err) {
        addMessage('ai', "I couldn't parse that file. Please try pasting your resume content.");
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
      const allJobs = jobsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const matches = allJobs.map(job => {
        const { score, reason } = calculateMatchScore(job, candidateProfile);
        return { ...job, matchScore: score, matchReason: reason };
      })
      .filter(j => j.matchScore >= 60)
      .sort((a, b) => b.matchScore - a.matchScore);

      setMatchedJobs(matches);
      updateCareerStep('matching_jobs');
      addMessage('ai', matches.length > 0 
        ? `Found ${matches.length} roles matching your profile!` 
        : "I couldn't find a direct match (>60%), but you can still apply manually.");
    } catch (e) {
      addMessage('ai', "Failed to sync live roles.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (content: any) => {
    if (typeof content !== 'string') return content;
    const parts = content.split(/(\[.*?\]\(.*?\))/g);
    return (
      <div className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          const match = part.match(/\[(.*?)\]\((.*?)\)/);
          if (match) return <Link key={i} href={match[2]} className="text-primary font-bold hover:underline mx-0.5">{match[1]}</Link>;
          return part;
        })}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <Button variant="default" className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-50 bg-primary hover:scale-110 transition-transform" onClick={() => setIsOpen(true)}>
        <MessageCircle className="h-8 w-8" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed z-50 flex flex-col bg-background shadow-2xl border-none overflow-hidden transition-all duration-300",
      "bottom-0 right-0 w-full h-[100dvh] sm:bottom-6 sm:right-6 sm:w-[360px] sm:h-[600px] sm:max-h-[85vh] sm:rounded-[2rem]"
    )}>
      <CardHeader className="flex flex-row items-center justify-between p-5 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center"><Bot className="h-6 w-6" /></div>
          <div>
            <CardTitle className="text-sm font-black">QuantumAI</CardTitle>
            <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /><span className="text-[9px] font-bold opacity-70 uppercase">Production Ready</span></div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8 text-white"><Trash2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-white"><X className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow p-0 overflow-hidden bg-background">
        <ScrollArea className="h-full p-5" ref={scrollAreaRef}>
          <div className="space-y-6 pb-6">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  "max-w-[85%] rounded-[1.5rem] px-5 py-3 text-sm shadow-sm transition-all leading-relaxed",
                  msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-zinc-100 dark:bg-zinc-900 rounded-tl-none border border-zinc-200 dark:border-zinc-800'
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
                onAcceptHelp={(acc) => acc ? updateCareerStep('resume_upload') : updateCareerStep('idle')}
                onFileUpload={handleFileUpload}
                onConfirmProfile={handleConfirmProfile}
                onApplyOnBehalf={(job) => { setSelectedJob(job); updateCareerStep('apply_behalf'); }}
                onFinalSubmit={async (approved) => {
                  if (!approved) return updateCareerStep('matching_jobs');
                  setIsLoading(true);
                  try {
                    await addDoc(collection(db, 'jobApplications'), {
                      jobId: selectedJob.id,
                      jobTitle: selectedJob.title,
                      candidateName: candidateProfile?.name,
                      candidateEmail: candidateProfile?.email,
                      matchScore: selectedJob.matchScore,
                      appliedAt: serverTimestamp(),
                      appliedVia: 'ai_agent',
                      status: 'New'
                    });
                    updateCareerStep('submitted');
                    addMessage('ai', "Success! Your application has been persisted to our production database.");
                  } catch (e) { addMessage('ai', "Sync failure. Please apply manually."); }
                  finally { setIsLoading(false); }
                }}
              />
            )}
            {isLoading && <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-background">
        <div className="relative w-full flex items-center gap-2">
          <Input 
            placeholder="Type your message..." 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
            className="flex-grow h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1" 
          />
          <Button onClick={handleSendMessage} size="icon" className="h-10 w-10 rounded-xl bg-primary"><Send className="h-4 w-4" /></Button>
        </div>
      </CardFooter>
    </Card>
  );
}
