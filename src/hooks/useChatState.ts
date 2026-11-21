import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type MessageRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string | React.ReactNode;
  timestamp: number;
}

export type CareerFlowStep = 
  | 'idle' 
  | 'offering_help' 
  | 'resume_upload' 
  | 'analyzing_resume' 
  | 'confirm_details' 
  | 'matching_jobs' 
  | 'apply_behalf' 
  | 'submitting' 
  | 'submitted';

export interface CandidateProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  experienceYears: number;
  education: string;
  domain: string;
  seniority: string;
  summary: string;
  projects?: string[];
  resumeUrl?: string;
  resumeDataUri?: string;
}

export interface ChatState {
  sessionId: string;
  messages: ChatMessage[];
  careerStep: CareerFlowStep;
  candidateProfile: CandidateProfile | null;
  selectedJob: any | null;
  jobListings: any[];
  matchedJobs: any[];
}

const SESSION_KEY = 'qfai_chat_session_id_v2';

export function useChatState() {
  const [state, setState] = useState<ChatState>({
    sessionId: '',
    messages: [],
    careerStep: 'idle',
    candidateProfile: null,
    selectedJob: null,
    jobListings: [],
    matchedJobs: [],
  });

  useEffect(() => {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    setState(prev => ({ ...prev, sessionId: sid! }));
  }, []);

  const addMessage = useCallback(async (role: MessageRole, content: string | React.ReactNode) => {
    const timestamp = Date.now();
    const id = Math.random().toString(36).substr(2, 9);
    
    const newMessage: ChatMessage = { id, role, content, timestamp };
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));

    if (typeof content === 'string' && db && state.sessionId) {
      try {
        const messagesRef = collection(db, 'chatSessions', state.sessionId, 'messages');
        await addDoc(messagesRef, {
          role,
          content,
          timestamp: serverTimestamp(),
        });
      } catch {}
    }
  }, [state.sessionId]);

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
    const sid = 'sid_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem(SESSION_KEY, sid);
    setState({
      sessionId: sid,
      messages: [],
      careerStep: 'idle',
      candidateProfile: null,
      selectedJob: null,
      jobListings: [],
      matchedJobs: [],
    });
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
