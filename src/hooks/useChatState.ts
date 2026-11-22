import { useState, useEffect, useCallback } from 'react';

export type MessageRole = 'user' | 'ai';

export interface ChatCitation {
  title: string;
  path: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string | React.ReactNode;
  timestamp: number;
  /** Optional source links attached to AI answers (Prompt 05O). */
  citations?: ChatCitation[];
  /** Flag for the loading/error state of a specific AI message (Prompt 05O). */
  status?: 'loading' | 'error' | 'ok';
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

const SESSION_KEY = 'qfai_chat_session_id_v3';

/** Browser-safe random hex session id (32 hex chars; matches /api/chat regex). */
function newSessionId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback (very old browsers) — still hex-ish.
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

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
    if (!sid || !/^[a-f0-9]{1,64}$/i.test(sid)) {
      sid = newSessionId();
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    setState((prev) => ({ ...prev, sessionId: sid! }));
  }, []);

  /**
   * Add a message to the client-side conversation state.
   *
   * Retention (Prompt 05O §7): messages live ONLY in client state (memory +
   * sessionStorage for the session id). They are NOT persisted to Firestore or
   * any server-side store. The visitor sends recent turns as `history` to
   * /api/chat for context; the server does not retain them. Clearing the chat
   * (or closing the tab) discards them. No cross-visitor leak is possible
   * because no server-side conversation store exists.
   */
  const addMessage = useCallback(
    (
      role: MessageRole,
      content: string | React.ReactNode,
      opts?: { citations?: ChatCitation[]; status?: 'loading' | 'error' | 'ok' },
    ) => {
      const timestamp = Date.now();
      const id = newSessionId().slice(0, 9);
      const newMessage: ChatMessage = {
        id,
        role,
        content,
        timestamp,
        citations: opts?.citations,
        status: opts?.status ?? 'ok',
      };
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, newMessage],
      }));
      return id;
    },
    [],
  );

  /** Update an existing message (e.g. replace a loading placeholder with the real answer). */
  const updateMessage = useCallback(
    (id: string, patch: Partial<Omit<ChatMessage, 'id' | 'role'>>) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }));
    },
    [],
  );

  const updateCareerStep = useCallback((step: CareerFlowStep) => {
    setState((prev) => ({ ...prev, careerStep: step }));
  }, []);

  const setCandidateProfile = useCallback((profile: CandidateProfile | null) => {
    setState((prev) => ({ ...prev, candidateProfile: profile }));
  }, []);

  const setSelectedJob = useCallback((job: any | null) => {
    setState((prev) => ({ ...prev, selectedJob: job }));
  }, []);

  const setJobListings = useCallback((jobs: any[]) => {
    setState((prev) => ({ ...prev, jobListings: jobs }));
  }, []);

  const setMatchedJobs = useCallback((jobs: any[]) => {
    setState((prev) => ({ ...prev, matchedJobs: jobs }));
  }, []);

  const clearChat = useCallback(() => {
    const sid = newSessionId();
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
    updateMessage,
    updateCareerStep,
    setCandidateProfile,
    setSelectedJob,
    setJobListings,
    setMatchedJobs,
    clearChat,
  };
}
