
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, X, Loader2, Bot, Trash2, ArrowRight } from 'lucide-react';
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
    clearChat,
    sessionId
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
        startCareerFlow();
      } else if (response.intent === 'navigate' && response.navigationLink) {
        addMessage('ai', (
          <div className="flex flex-col gap-2">
            <p>{response.answer}</p>
            <Button asChild size="sm" variant="outline" className="self-start">
              <a href={response.navigationLink}>Open {response.navigationLink.replace('/', '') || 'Home'} Page <ArrowRight className="ml-2 h-3 w-3" /></a>
            </Button>
          </div>
        ));
      } else {
        addMessage('ai', response.answer);
      }
    } catch (e) {
      console.error(e);
      addMessage('ai', "I'm sorry, I encountered an error. Please try again or visit our [Contact Page](/contact).");
    } finally {
      setIsLoading(false);
    }
  };

  const startCareerFlow = () => {
    updateCareerStep('offering_help');
    addMessage('ai', "I see you're interested in careers at QuantumFusion! Would you like me to help find the most suitable role for you?");
  };

  const handleAcceptHelp = (accepted: boolean) => {
    if (accepted) {
      updateCareerStep('showing_jobs');
      setJobListings(dummyJobs);
      addMessage('ai', "Great! Here are our current openings. You can select one to start, or upload your resume for matching.");
    } else {
      updateCareerStep('idle');
      addMessage('ai', "No problem! You can explore roles at your own pace here: [Open Careers Page](/careers)");
    }
  };

  const handleJobSelect = (job: any) => {
    setSelectedJob(job);
    updateCareerStep('resume_upload');
    addMessage('ai', `Excellent choice: ${job.title}. To apply, please upload your resume (PDF or DOCX) so I can prepare your application.`);
  };

  const handleFileUpload = async (file: File) => {
    updateCareerStep('analyzing_resume');
    setIsLoading(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        const analysis = await analyzeResume({ resumeDataUri: dataUri });
        
        setCandidateProfile({
          ...analysis,
          resumeDataUri: dataUri,
          resumeUrl: file.name // Mocking URL as name for display
        });
        
        updateCareerStep('confirm_details');
        addMessage('ai', "I've analyzed your resume! Here's what I found. Is this information correct?");
        setIsLoading(false);
      };
    } catch (e) {
      console.error(e);
      addMessage('ai', "Failed to analyze resume. Please try again or upload a different file.");
      updateCareerStep('resume_upload');
      setIsLoading(false);
    }
  };

  const handleConfirmProfile = (confirmed: boolean) => {
    if (confirmed) {
      updateCareerStep('matching_jobs');
      
      // Calculate matching
      const matches = dummyJobs.map(job => {
        const jobSkills = job.requiredSkills.map(s => s.toLowerCase());
        const userSkills = candidateProfile?.skills.map(s => s.toLowerCase()) || [];
        const overlap = jobSkills.filter(s => userSkills.includes(s)).length;
        const score = Math.round((overlap / Math.max(1, jobSkills.length)) * 100);
        return { ...job, matchScore: score };
      }).sort((a, b) => b.matchScore - a.matchScore);

      setMatchedJobs(matches);
      addMessage('ai', "Based on your skills and experience, here are the best matches for you:");
    } else {
      addMessage('ai', "I understand. Please visit our [Careers Page](/careers) to apply manually with your updated details.");
      updateCareerStep('idle');
    }
  };

  const handleApplyOnBehalf = (job: any) => {
    setSelectedJob(job);
    updateCareerStep('apply_behalf');
    addMessage('ai', `Would you like me to submit this application for ${job.title} on your behalf? I have all your details ready.`);
  };

  const handleFinalSubmit = async (approved: boolean) => {
    if (!approved) {
      updateCareerStep('idle');
      addMessage('ai', "Understood. You can still apply manually on our website.");
      return;
    }

    updateCareerStep('submitting');
    setIsLoading(true);

    try {
      if (!db) throw new Error("Firebase not initialized");
      
      const appId = 'APP_' + Math.random().toString(36).substr(2, 9);
      const applicationData = {
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
        status: 'submitted'
      };

      await addDoc(collection(db, 'jobApplications'), applicationData);

      // Simulation of email
      console.log(`REAL-TIME EMAIL SIMULATION: Sending confirmation to ${candidateProfile?.email}...`);
      
      updateCareerStep('submitted');
      addMessage('ai', (
        <div className="flex flex-col gap-2">
          <p className="font-bold text-green-600">Application Submitted Successfully!</p>
          <p>Role: {selectedJob.title}</p>
          <p>Application ID: {appId}</p>
          <p className="text-xs text-muted-foreground">A confirmation email has been sent to {candidateProfile?.email}. Our team will review it shortly.</p>
        </div>
      ));
    } catch (e) {
      console.error(e);
      addMessage('ai', "Failed to submit application. There was a backend error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;
    const userText = inputValue;
    addMessage('user', userText);
    setInputValue('');
    handleNormalQna(userText);
  };

  if (!isOpen) {
    return (
      <Button
        variant="default"
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-[100] bg-gradient-to-br from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity p-0 flex items-center justify-center"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-7 w-7" />
      </Button>
    );
  }

  return (
    <Card className={cn(
        "fixed bottom-0 right-0 w-full sm:w-[450px] h-[100svh] sm:h-[650px] sm:bottom-6 sm:right-6 shadow-2xl z-[100] flex flex-col rounded-none sm:rounded-2xl overflow-hidden border-none bg-background",
        "animate-in slide-in-from-bottom duration-300"
      )}>
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-primary text-primary-foreground">
        <CardTitle className="text-lg font-bold flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          QuantumAI
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8 hover:bg-white/20 text-white" title="Clear Chat">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 hover:bg-white/20 text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow p-0 overflow-hidden bg-background">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? 'items-end' : 'items-start')}>
                <div className={cn(
                    "flex max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-muted text-foreground rounded-tl-none border border-border/50'
                  )}>
                  {typeof msg.content === 'string' ? <div className="whitespace-pre-wrap">{msg.content}</div> : msg.content}
                </div>
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
              <div className="flex justify-start items-center space-x-2">
                <div className="bg-muted rounded-full p-2 h-8 w-8 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
                <span className="text-xs text-muted-foreground italic">QuantumAI is thinking...</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-3 border-t bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex w-full items-center space-x-2"
        >
          <Input
            type="text"
            placeholder="Ask QuantumAI anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-grow h-10 text-sm focus-visible:ring-primary border-muted"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || inputValue.trim() === ''} className="bg-primary h-10 w-10">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
