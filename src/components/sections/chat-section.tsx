"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, X, Loader2, Bot, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatState } from '@/hooks/useChatState';
import { ChatCareerFlow } from '@/components/ChatCareerFlow';
import { analyzeResume } from '@/ai/flows/analyze-resume-flow';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

/** Suggested example questions (Prompt 05O §9). */
const SUGGESTED_QUESTIONS = [
  'What does Paragonel do?',
  'Tell me about AcquisitionOS',
  'What services do you offer?',
  'Are you hiring?',
  'How do I contact Paragonel?',
];

export function ChatSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    messages, addMessage, updateMessage,
    sessionId,
    careerStep, updateCareerStep,
    candidateProfile, setCandidateProfile,
    selectedJob, setSelectedJob,
    matchedJobs, setMatchedJobs,
    clearChat
  } = useChatState();

  // Detect screen size for mobile mode
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prompt 05O §9: the chat is click-to-open only (the floating button is the
  // obvious affordance). The previous 2.5s auto-open was intrusive + caused
  // the panel buttons to appear in Lighthouse's a11y scan before interaction.
  // Removed in favor of a non-intrusive default.

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage(
        'ai',
        "Hi! I'm **Paragonel AI**, your company + product knowledge assistant. I can answer questions about our services, products (AcquisitionOS, SystemFoundry, CodeGuard AI), careers, and Paragonel itself — using only verified, published info. How can I help?",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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

  const handleSendMessage = async (overrideText?: string) => {
    const userText = (overrideText ?? inputValue).trim();
    if (userText === '' || isLoading) return;
    if (!overrideText) setInputValue('');

    // Build bounded history BEFORE adding the new user message (last 8 prior turns).
    const history = messages
      .filter((m) => typeof m.content === 'string' && m.status !== 'loading' && m.status !== 'error')
      .slice(-8)
      .map((m) => ({ role: (m.role === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant', content: m.content as string }));

    addMessage('user', userText);
    const loadingId = addMessage('ai', '', { status: 'loading' });
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, sessionId, history }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      updateMessage(loadingId, {
        content: data.answer || "I couldn't generate a response. Please try again.",
        citations: Array.isArray(data.citations) ? data.citations : [],
        status: 'ok',
      });
    } catch {
      updateMessage(loadingId, {
        content: "I'm having trouble responding right now. Please try again, or reach the Paragonel team via the [Contact](/contact) page.",
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /** Retry the last failed AI message by re-sending the preceding user question. */
  const handleRetry = (errorId: string) => {
    const idx = messages.findIndex((m) => m.id === errorId);
    if (idx <= 0) return;
    // Find the user message immediately before the error.
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === 'user' && typeof messages[i].content === 'string') {
        updateMessage(errorId, { content: '', status: 'loading' });
        handleSendMessage(messages[i].content as string);
        return;
      }
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
      } catch {
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
      const jobsSnap = await getDocs(query(collection(db, 'jobs'), where('isActive', '==', true), where('deletedAt', '==', null)));
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
    } catch {
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
      <Button
        variant="default"
        className="fixed bottom-6 right-6 h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-2xl z-50 bg-primary hover:scale-110 transition-transform p-0"
        onClick={() => setIsOpen(true)}
        aria-label="Open Paragonel AI chat assistant"
      >
        <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8 text-white" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed z-[100] flex flex-col bg-background shadow-2xl border-none overflow-hidden transition-all duration-300",
      "bottom-4 right-4 left-4 w-auto h-[85dvh] max-h-[85dvh] rounded-[2rem]",
      "sm:left-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:h-[650px] sm:max-h-[80vh]"
    )}>
      {/* Sticky Header */}
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between p-4 sm:p-5 border-b bg-primary text-primary-foreground h-[60px] sm:h-auto">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/20 flex items-center justify-center"><Bot className="h-5 w-5 sm:h-6 sm:w-6" /></div>
          <div>
            <CardTitle className="text-sm sm:text-base font-black">ParagonelAI</CardTitle>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={clearChat} aria-label="Clear chat conversation" className="h-8 w-8 text-white hover:bg-white/10 rounded-full">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close chat" className="h-8 w-8 text-white hover:bg-white/10 rounded-full">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      
      {/* Scrollable Chat Area */}
      <CardContent className="flex-grow p-0 overflow-hidden bg-background relative">
        <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
          <div className="p-4 sm:p-5 space-y-6 pb-10">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex flex-col w-full", msg.role === 'user' ? 'items-end' : 'items-start')}>
                <div className={cn(
                  "max-w-[85%] rounded-[1.25rem] sm:rounded-[1.5rem] px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base shadow-sm transition-all leading-relaxed",
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-zinc-100 dark:bg-zinc-900 rounded-tl-none border border-zinc-200 dark:border-zinc-800'
                )}>
                  {msg.status === 'loading' ? (
                    <div className="flex items-center gap-1 py-1" aria-label="Paragonel AI is typing">
                      <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    renderContent(msg.content)
                  )}
                  {msg.status === 'error' && (
                    <button
                      onClick={() => handleRetry(msg.id)}
                      className="mt-2 text-xs font-semibold text-primary hover:underline"
                      aria-label="Retry the last message"
                    >
                      Retry
                    </button>
                  )}
                </div>
                {msg.role === 'ai' && msg.status === 'ok' && msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5 max-w-[85%]" aria-label="Source links">
                    {msg.citations.map((c, i) => (
                      <Link
                        key={`${msg.id}-cite-${i}`}
                        href={c.path}
                        className="inline-flex items-center gap-1 text-[11px] sm:text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                      >
                        {c.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {/* Suggested example questions — only when the chat has just the greeting (no user messages yet). */}
            {messages.length === 1 && messages[0]?.role === 'ai' && !isLoading && careerStep === 'idle' && (
              <div className="flex flex-wrap gap-2 pt-1" aria-label="Suggested questions">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    className="text-xs sm:text-sm px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-primary hover:text-primary transition-colors text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {careerStep !== 'idle' && (
              <div className="w-full">
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
                      addMessage('ai', "Success! Your application has been received. Our team will review your profile shortly.");
                    } catch { addMessage('ai', "I had trouble saving your application. Please try applying manually on the Careers page."); }
                    finally { setIsLoading(false); }
                  }}
                />
              </div>
            )}
            {isLoading && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Sticky Bottom Input Bar */}
      <CardFooter className="flex-shrink-0 p-3 sm:p-4 border-t bg-background pb-[calc(12px+env(safe-area-inset-bottom))] sm:pb-4">
        <div className="relative w-full">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Ask Paragonel AI…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              aria-label="Ask Paragonel AI a question"
              className="flex-grow h-11 sm:h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1 text-sm sm:text-base px-4"
            />
            <Button
              onClick={() => handleSendMessage()}
              size="icon"
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-primary text-white shadow-lg hover:scale-105 active:scale-95 transition-transform shrink-0"
            >
              <Send className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] sm:text-[11px] text-muted-foreground leading-tight">
            Paragonel AI answers from verified site info. Conversations are not stored server-side.{' '}
            <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
