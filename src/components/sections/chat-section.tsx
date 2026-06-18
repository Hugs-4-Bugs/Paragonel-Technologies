
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
import { dummyJobs } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

  const initialGreeting = "Hi! I'm QuantumAI, your intelligent assistant for QuantumFusion Solutions. I can help you explore our products, services, careers, company information, and answer questions about everything available on this website.";

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage('ai', initialGreeting);
    }
  }, [isOpen, messages.length, addMessage]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages, careerStep, isLoading]);

  const handleNormalQna = async (text: string) => {
    setIsLoading(true);
    try {
      const response = await companyQnaFlow({ question: text });
      
      if (response.intent === 'careers') {
        updateCareerStep('offering_help');
        addMessage('ai', response.answer);
      } else if (response.intent === 'navigate' && response.navigationLink) {
        addMessage('ai', (
          <div className="flex flex-col gap-2">
            <p>{response.answer}</p>
            <Button asChild size="sm" variant="outline" className="self-start mt-1">
              <Link href={response.navigationLink}>
                Go to {response.navigationLink.replace('/', '') || 'Home'} <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </div>
        ));
      } else {
        addMessage('ai', response.answer);
      }
    } catch (e) {
      console.error(e);
      addMessage('ai', "I'm sorry, I'm having trouble connecting to my brain right now. Please try again or visit our [Contact Page](/contact).");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptHelp = (accepted: boolean) => {
    if (accepted) {
      updateCareerStep('showing_jobs');
      setJobListings(dummyJobs);
      addMessage('ai', "Great! Here are our current openings. Select one that interests you, or upload your resume and I'll find the best match.");
    } else {
      updateCareerStep('idle');
      addMessage('ai', "No problem! You can explore all roles here: [Browse Careers](/careers)");
    }
  };

  const handleJobSelect = (job: any) => {
    setSelectedJob(job);
    updateCareerStep('resume_upload');
    addMessage('ai', `Excellent choice: ${job.title}. To analyze your profile for this role, please upload your resume (PDF or DOCX).`);
  };

  const handleFileUpload = async (file: File) => {
    updateCareerStep('analyzing_resume');
    setIsLoading(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        try {
          const analysis = await analyzeResume({ resumeDataUri: dataUri });
          
          setCandidateProfile({
            ...analysis,
            resumeDataUri: dataUri,
            resumeUrl: file.name
          });
          
          updateCareerStep('confirm_details');
          addMessage('ai', "I've analyzed your resume! Please verify the details below so I can calculate your match score.");
        } catch (err) {
          addMessage('ai', "I couldn't parse that file correctly. Please ensure it's a standard PDF or DOCX format and try again.");
          updateCareerStep('resume_upload');
        } finally {
          setIsLoading(false);
        }
      };
    } catch (e) {
      console.error(e);
      addMessage('ai', "Failed to upload file. Please check your connection and try again.");
      updateCareerStep('resume_upload');
      setIsLoading(false);
    }
  };

  const handleConfirmProfile = (confirmed: boolean) => {
    if (confirmed) {
      updateCareerStep('matching_jobs');
      
      const matches = dummyJobs.map(job => {
        const jobSkills = job.skills.map(s => s.toLowerCase());
        const userSkills = candidateProfile?.skills.map(s => s.toLowerCase()) || [];
        const overlap = jobSkills.filter(s => userSkills.includes(s)).length;
        const score = Math.round((overlap / Math.max(1, jobSkills.length)) * 100);
        return { ...job, matchScore: score };
      }).sort((a, b) => b.matchScore - a.matchScore);

      setMatchedJobs(matches);
      
      if (selectedJob) {
        const selectedMatch = matches.find(m => m.id === selectedJob.id);
        const score = selectedMatch?.matchScore || 0;
        addMessage('ai', `I've calculated your fit! For the ${selectedJob.title} role, your match score is **${score}%**. Would you like me to submit your profile?`);
      } else {
        addMessage('ai', "Based on your skills and experience, here are the best matches for you across our open roles:");
      }
    } else {
      addMessage('ai', "I understand. You can update your details and try again, or apply manually: [Manual Application](/careers)");
      updateCareerStep('idle');
    }
  };

  const handleApplyOnBehalf = (job: any) => {
    setSelectedJob(job);
    updateCareerStep('apply_behalf');
    addMessage('ai', `Ready to apply for ${job.title}? I'll package your resume and profile and send it to our HR team immediately.`);
  };

  const handleFinalSubmit = async (approved: boolean) => {
    if (!approved) {
      updateCareerStep('idle');
      addMessage('ai', "Understood. Your profile was not submitted. You can still apply manually later.");
      return;
    }

    updateCareerStep('submitting');
    setIsLoading(true);

    try {
      if (db) {
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
          appliedAt: serverTimestamp(),
          appliedVia: 'ai',
          status: 'New'
        });
        
        updateCareerStep('submitted');
        addMessage('ai', (
          <div className="flex flex-col gap-2">
            <p className="font-bold text-green-600">Application Submitted!</p>
            <p className="text-sm">Role: {selectedJob.title}</p>
            <p className="text-xs text-muted-foreground">ID: {appId}</p>
            <p className="text-xs italic mt-1">Our hiring team will review your profile and reach out via email.</p>
          </div>
        ));
      }
    } catch (e) {
      addMessage('ai', "I encountered an error during submission. Please apply manually on the [Careers Page](/careers).");
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
    
    // Parse Markdown links [text](url)
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
                className="text-primary font-bold hover:underline inline-flex items-center gap-0.5"
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
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-[40] bg-gradient-to-br from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity p-0 flex items-center justify-center"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-7 w-7" />
      </Button>
    );
  }

  return (
    <Card className={cn(
        "fixed bottom-0 right-0 w-full sm:w-[420px] h-[75vh] sm:h-[650px] sm:max-h-[calc(100vh-120px)] sm:bottom-6 sm:right-6 shadow-2xl z-[40] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden border-none bg-background",
        "animate-in slide-in-from-bottom duration-300"
      )}>
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-primary text-primary-foreground flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-black tracking-tight">QuantumAI</CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-white/70 uppercase">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8 hover:bg-white/20 text-white rounded-lg">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-white/20 text-white rounded-lg">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow p-0 overflow-hidden bg-background">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-6 pb-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? 'items-end' : 'items-start')}>
                <div className={cn(
                    "flex max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all",
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-muted/50 text-foreground rounded-tl-none border border-border/50 backdrop-blur-sm'
                  )}>
                  {renderContent(msg.content)}
                </div>
                <span className="text-[9px] text-muted-foreground mt-1 px-1 font-bold">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {careerStep !== 'idle' && (
              <ChatCareerFlow 
                step={careerStep}
                jobListings={jobListings}
                matchedJobs={matchedJobs}
                selectedJob={selectedJob}
                candidateProfile={candidateProfile}
                onAcceptHelp={handleAcceptHelp}
                onJobSelect={handleJobSelect}
                onFileUpload={handleFileUpload}
                onConfirmProfile={handleConfirmProfile}
                onApplyOnBehalf={handleApplyOnBehalf}
                onFinalSubmit={handleFinalSubmit}
              />
            )}

            {isLoading && (
              <div className="flex justify-start items-center space-x-2 animate-in fade-in duration-300">
                <div className="bg-muted rounded-xl p-2 h-8 w-8 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
                <span className="text-[11px] text-muted-foreground font-bold italic">QuantumAI is typing...</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-background flex-shrink-0">
        <div className="relative w-full flex items-center gap-2">
          <Input
            type="text"
            placeholder="Ask about products, jobs, or services..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-grow h-12 rounded-xl text-sm focus-visible:ring-primary border-muted bg-zinc-50 dark:bg-zinc-900 pr-12"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            disabled={isLoading || inputValue.trim() === ''} 
            className="absolute right-1 top-1 h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 transition-all shadow-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
