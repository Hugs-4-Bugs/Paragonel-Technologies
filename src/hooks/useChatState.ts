
import { useState, useEffect, useCallback } from 'react';

export type MessageRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string | React.ReactNode;
  timestamp: number;
}

export type CareerFlowStep = 'idle' | 'showing_jobs' | 'resume_upload' | 'confirm_details' | 'matching_jobs' | 'apply_behalf' | 'submitted';

export interface CandidateProfile {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experienceYears: number;
  education: string;
  resumeUrl?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  careerStep: CareerFlowStep;
  candidateProfile: CandidateProfile | null;
  selectedJob: any | null;
  jobListings: any[];
  matchedJobs: any[];
}

const SESSION_KEY = 'qfai_chat_history';

export function useChatState() {
  const [state, setState] = useState<ChatState>({
    messages: [],
    careerStep: 'idle',
    candidateProfile: null,
    selectedJob: null,
    jobListings: [],
    matchedJobs: [],
  });

  const [isLoaded, setIsMounted] = useState(false);

  // Initialize from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only load messages, reset flow state for fresh experience but keep context if desired
        // For this requirement, we load the messages but let the logic resume
        setState(prev => ({
          ...prev,
          messages: parsed.messages || [],
        }));
      } catch (e) {
        console.error("Failed to load chat history", e);
      }
    }
    setIsMounted(true);
  }, []);

  // Save to sessionStorage
  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ messages: state.messages }));
    }
  }, [state.messages, isLoaded]);

  const addMessage = useCallback((role: MessageRole, content: string | React.ReactNode) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: Date.now(),
    };
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  }, []);

  const updateCareerStep = useCallback((step: CareerFlowStep) => {
    setState(prev => ({ ...prev, careerStep: step }));
  }, []);

  const setCandidateProfile = useCallback((profile: CandidateProfile | null) => {
    setState(prev => ({ ...prev, candidateProfile: profile }));
  }, []);

  const setSelectedJob = useCallback((job: any | null) => {
    setState(prev => ({ ...prev, selectedJob: job }));
  }, []);

  const setJobListings = useCallback((jobs: any[]) => {
    setState(prev => ({ ...prev, jobListings: jobs }));
  }, []);

  const setMatchedJobs = useCallback((jobs: any[]) => {
    setState(prev => ({ ...prev, matchedJobs: jobs }));
  }, []);

  const clearChat = useCallback(() => {
    setState({
      messages: [],
      careerStep: 'idle',
      candidateProfile: null,
      selectedJob: null,
      jobListings: [],
      matchedJobs: [],
    });
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return {
    ...state,
    addMessage,
    updateCareerStep,
    setCandidateProfile,
    setSelectedJob,
    setJobListings,
    setMatchedJobs,
    clearChat,
  };
}
