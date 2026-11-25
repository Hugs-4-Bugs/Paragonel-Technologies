import { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_QUALIFICATION_STATE,
  mergeCaptured,
  type EnquiryCategory,
  type CapturedLeadFields,
  type QualificationStage,
  type QualificationState,
} from '@/lib/ai/lead-qualification';

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

export type LeadSubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface ChatState {
  sessionId: string;
  messages: ChatMessage[];
  /** Lead-qualification state (Prompt 05P). */
  qualification: QualificationState;
  /** Consent for the lead review/submit step (Phase 4). */
  consentAcknowledged: boolean;
  marketingConsent: boolean;
  /** Lead submission status (Phase 5/6). */
  leadStatus: LeadSubmissionStatus;
  leadId: string | null;
  leadNotification: 'sent' | 'skipped' | 'failed' | null;
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
    qualification: { ...INITIAL_QUALIFICATION_STATE },
    consentAcknowledged: false,
    marketingConsent: false,
    leadStatus: 'idle',
    leadId: null,
    leadNotification: null,
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

  /* -------- Lead qualification (Prompt 05P Phase 3–7) -------- */

  /** Activate an enquiry flow with a classified category (or update it). */
  const startEnquiry = useCallback((category: EnquiryCategory) => {
    setState((prev) => ({
      ...prev,
      qualification: {
        active: true,
        category,
        captured: prev.qualification.captured, // keep already-captured fields
        stage: 'collecting',
      },
    }));
  }, []);

  /** Merge newly-captured fields into the qualification state. */
  const updateCaptured = useCallback((fields: Partial<CapturedLeadFields>) => {
    setState((prev) => ({
      ...prev,
      qualification: {
        ...prev.qualification,
        captured: mergeCaptured(prev.qualification.captured, fields),
      },
    }));
  }, []);

  /** Set the qualification stage (collecting → reviewing → submitted/cancelled). */
  const setQualificationStage = useCallback((stage: QualificationStage) => {
    setState((prev) => ({
      ...prev,
      qualification: { ...prev.qualification, stage, active: stage === 'collecting' || stage === 'reviewing' },
    }));
  }, []);

  /** Edit a captured field directly (from the review-step form). */
  const editCapturedField = useCallback((key: keyof CapturedLeadFields, value: string) => {
    setState((prev) => ({
      ...prev,
      qualification: {
        ...prev.qualification,
        captured: { ...prev.qualification.captured, [key]: value },
      },
    }));
  }, []);

  const setConsent = useCallback((acknowledged: boolean) => {
    setState((prev) => ({ ...prev, consentAcknowledged: acknowledged }));
  }, []);

  const setMarketingConsent = useCallback((consent: boolean) => {
    setState((prev) => ({ ...prev, marketingConsent: consent }));
  }, []);

  const setLeadStatus = useCallback(
    (status: LeadSubmissionStatus, opts?: { id?: string; notification?: 'sent' | 'skipped' | 'failed' }) => {
      setState((prev) => ({
        ...prev,
        leadStatus: status,
        leadId: opts?.id ?? prev.leadId,
        leadNotification: opts?.notification ?? prev.leadNotification,
        qualification:
          status === 'success'
            ? { ...prev.qualification, stage: 'submitted', active: false }
            : prev.qualification,
      }));
    },
    [],
  );

  /** Cancel the enquiry flow + return to ordinary Q&A. Does NOT discard the chat history. */
  const cancelEnquiry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      qualification: { ...INITIAL_QUALIFICATION_STATE },
      consentAcknowledged: false,
      marketingConsent: false,
      leadStatus: 'idle',
      leadId: null,
      leadNotification: null,
    }));
  }, []);

  const clearChat = useCallback(() => {
    const sid = newSessionId();
    sessionStorage.setItem(SESSION_KEY, sid);
    setState({
      sessionId: sid,
      messages: [],
      qualification: { ...INITIAL_QUALIFICATION_STATE },
      consentAcknowledged: false,
      marketingConsent: false,
      leadStatus: 'idle',
      leadId: null,
      leadNotification: null,
    });
  }, []);

  return {
    ...state,
    addMessage,
    updateMessage,
    clearChat,
    // Lead qualification (Prompt 05P).
    startEnquiry,
    updateCaptured,
    setQualificationStage,
    editCapturedField,
    setConsent,
    setMarketingConsent,
    setLeadStatus,
    cancelEnquiry,
  };
}
