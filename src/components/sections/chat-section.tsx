
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, X, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import knowledge from '@/data/company-knowledge.json';
import { useChatState } from '@/hooks/useChatState';
import { ChatCareerFlow } from '@/components/ChatCareerFlow';

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
  }, [messages, careerStep]);

  const detectIntent = (text: string) => {
    const t = text.toLowerCase();
    
    if (t.includes('founder') || t.includes('built this') || t.includes('owns') || t.includes('ceo') || t.includes('prabhat')) {
      return `QuantumFusion Solutions was founded by ${knowledge.company.founder}. ${knowledge.company.description}`;
    }
    
    if (t.includes('service') || t.includes('offering') || t.includes('what do you do')) {
      const servicesHtml = knowledge.services.map(s => `• <a href="${s.url}" class="text-primary underline font-medium">${s.name}</a>: ${s.description}`).join('<br/>');
      return `Our core services include:<br/><br/>${servicesHtml}`;
    }
    
    if (t.includes('product') || t.includes('built')) {
      const productsHtml = knowledge.products.map(p => `• <strong>${p.name}</strong> (${p.status}): ${p.description}`).join('<br/>');
      return `Here are some of our innovative products:<br/><br/>${productsHtml}`;
    }
    
    if (t.includes('pricing') || t.includes('cost') || t.includes('budget')) {
      return `Our pricing typically ranges from ₹75K–₹10L+ for custom projects, with ongoing support retainers available from ₹20K–₹60K/month. Would you like to discuss a specific project? <a href="/contact" class="text-primary underline">Talk to our team</a>.`;
    }
    
    if (t.includes('contact') || t.includes('reach out') || t.includes('email')) {
      return `You can reach us at ${knowledge.company.email} or via our <a href="/contact" class="text-primary underline">Contact Page</a>.`;
    }

    if (t.includes('blog') || t.includes('article') || t.includes('insight')) {
      return `Check out our latest insights and tech news on our <a href="/blog" class="text-primary underline">Blog Page</a>.`;
    }

    if (t.includes('about') || t.includes('who are you') || t.includes('what is quantumfusion')) {
      return `${knowledge.company.description} Learn more <a href="/about" class="text-primary underline">About Us here</a>.`;
    }

    if (t.includes('portfolio') || t.includes('past work') || t.includes('case study')) {
      return `Explore our successful collaborations and projects in our <a href="/portfolio" class="text-primary underline">Portfolio</a>.`;
    }

    if (t.includes('job') || t.includes('career') || t.includes('hiring') || t.includes('opening') || t.includes('work here')) {
      return 'TRIGGER_CAREER_FLOW';
    }

    // Direct page matches
    for (const page of knowledge.pages) {
      if (t.includes(page.name.toLowerCase())) {
        return `You can find information about ${page.name} here: <a href="${page.url}" class="text-primary underline">Open ${page.name} Page →</a>`;
      }
    }

    return "I can help with info about QuantumFusion's services, products, team, careers, or anything on our website. What would you like to know?";
  };

  const startCareerFlow = async () => {
    updateCareerStep('showing_jobs');
    addMessage('ai', "Great! Let me show you our current openings.");
    
    setIsLoading(true);
    try {
      // Simulation of API fetch
      // In production: const res = await fetch('/api/careers/jobs'); const data = await res.json();
      const mockJobs = [
        { id: '1', title: 'Full Stack Developer', location: 'Remote', type: 'Full Time', department: 'Engineering' },
        { id: '2', title: 'AI/ML Engineer', location: 'Bangalore', type: 'Full Time', department: 'Engineering' },
        { id: '3', title: 'UI/UX Designer', location: 'Remote', type: 'Full Time', department: 'Product' }
      ];
      setTimeout(() => {
        setJobListings(mockJobs);
        setIsLoading(false);
      }, 800);
    } catch (e) {
      addMessage('ai', "I'm having trouble fetching job listings right now. Please check our <a href='/careers'>Careers page</a>.");
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    const userText = inputValue;
    addMessage('user', userText);
    setInputValue('');

    // Handle Career Flow specific user responses (Text based)
    if (careerStep === 'confirm_details') {
      if (userText.toLowerCase().includes('yes')) {
        handleConfirmProfile(true);
        return;
      }
    }

    const intentResponse = detectIntent(userText);
    
    if (intentResponse === 'TRIGGER_CAREER_FLOW') {
      startCareerFlow();
    } else {
      setIsLoading(true);
      setTimeout(() => {
        addMessage('ai', intentResponse);
        setIsLoading(false);
      }, 600);
    }
  };

  const handleJobSelect = (job: any) => {
    setSelectedJob(job);
    updateCareerStep('resume_upload');
    addMessage('ai', `You've selected ${job.title}. To apply, please upload your resume (PDF or DOCX).`);
  };

  const handleFileUpload = async (file: File) => {
    // In production: use FormData to send to /api/careers/parse-resume
    // const formData = new FormData(); formData.append('resume', file);
    // const res = await fetch('/api/careers/parse-resume', { method: 'POST', body: formData });
    
    // Mock parsing result
    const mockProfile = {
      name: "Prabhat Sharma", // Simplified for demo
      email: "candidate@example.com",
      phone: "+91-9876543210",
      skills: ["React", "Next.js", "Java", "Tailwind"],
      experienceYears: 4,
      education: "B.Tech Computer Science"
    };

    setCandidateProfile(mockProfile);
    updateCareerStep('confirm_details');
    addMessage('ai', "I found the following details from your resume. Is this correct? Reply YES to confirm.");
  };

  const handleConfirmProfile = (confirmed: boolean) => {
    if (confirmed) {
      updateCareerStep('matching_jobs');
      addMessage('ai', "Perfect! Based on your profile, you're a strong match for these roles:");
      
      // Simulation of matching
      setMatchedJobs([selectedJob, ...jobListings.filter(j => j.id !== selectedJob.id).slice(0, 1)]);
      
      // Prompt for application step
      setTimeout(() => {
        updateCareerStep('apply_behalf');
        addMessage('ai', `Should I submit your application for ${selectedJob.title} on your behalf? I have all your details ready.`);
      }, 1000);
    } else {
      addMessage('ai', "I understand. Please tell me what needs to be corrected, or visit our <a href='/careers'>Careers page</a> to apply manually.");
      updateCareerStep('idle');
    }
  };

  const handleFinalApply = async (method: 'ai' | 'manual') => {
    if (method === 'manual') {
      addMessage('ai', `Understood. You can apply manually here: <a href="/careers" class="text-primary underline">View Roles</a>`);
      updateCareerStep('idle');
      return;
    }

    setIsLoading(true);
    try {
      // Simulation of application submission
      // In production: call /api/careers/apply
      setTimeout(() => {
        updateCareerStep('submitted');
        addMessage('ai', `Your application for ${selectedJob.title} has been submitted! A confirmation has been sent to ${candidateProfile.email}.`);
        setIsLoading(false);
      }, 2000);
    } catch (e) {
      addMessage('ai', "There was an error submitting your application. Please try again later.");
      setIsLoading(false);
    }
  };

  const renderMessageContent = (content: string | React.ReactNode) => {
    if (typeof content === 'string') {
      return <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content }} />;
    }
    return content;
  };

  if (!isOpen) {
    return (
      <Button
        variant="default"
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-[100] bg-gradient-to-br from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity p-0 flex items-center justify-center"
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
      >
        <MessageCircle className="h-7 w-7" />
      </Button>
    );
  }

  return (
    <Card className={cn(
        "fixed bottom-0 right-0 w-full sm:w-[400px] h-full sm:h-[600px] sm:bottom-6 sm:right-6 shadow-2xl z-[100] flex flex-col rounded-none sm:rounded-2xl overflow-hidden border-none bg-background",
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
                  {renderMessageContent(msg.content)}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {careerStep !== 'idle' && (
              <div className="flex flex-col items-start w-full">
                <div className="bg-muted text-foreground rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm border border-border/50 w-[90%]">
                  <ChatCareerFlow 
                    step={careerStep}
                    jobListings={jobListings}
                    matchedJobs={matchedJobs}
                    selectedJob={selectedJob}
                    candidateProfile={candidateProfile}
                    onJobSelect={handleJobSelect}
                    onFileUpload={handleFileUpload}
                    onConfirmProfile={handleConfirmProfile}
                    onFinalApply={handleFinalApply}
                  />
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start items-center space-x-2">
                <div className="bg-muted rounded-full p-2 h-8 w-8 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
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
            placeholder="Ask about QuantumFusion..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-grow h-10 text-sm focus-visible:ring-primary border-muted"
            disabled={isLoading || careerStep !== 'idle'}
          />
          <Button type="submit" size="icon" disabled={isLoading || inputValue.trim() === '' || careerStep !== 'idle'} className="bg-primary h-10 w-10">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
