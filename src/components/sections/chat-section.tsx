"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, X, Loader2, Bot, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatState } from '@/hooks/useChatState';
import {
  ENQUIRY_CATEGORY_LABELS,
  COMPANY_LINKEDIN_URL,
  routeForCategory,
  hasMinimumForSubmission,
  isLeadCategory,
  type EnquiryCategory,
  type CapturedLeadFields,
} from '@/lib/ai/lead-qualification';

/**
 * ChatSection is the company + product knowledge assistant + lead-qualification
 * flow. Career assistance (resume upload, AI parse review, deterministic job
 * matching, and application submission) now lives on /careers via the dedicated
 * CareerAssistant component, which reuses the secure server routes
 * /api/chat/career-assist (real scoreJobCandidate engine) + /api/job-applications
 * (authenticated, transactional, sends the branded confirmation email). This
 * chat no longer embeds a career workflow; it answers knowledge questions and
 * captures sales/marketing enquiries. No client Firestore imports remain here.
 */

/** Suggested example questions (Prompt 05O §9). */
const SUGGESTED_QUESTIONS = [
  'What does Paragonel do?',
  'Tell me about AcquisitionOS',
  'What services do you offer?',
  'Are you hiring?',
  'How do I contact Paragonel?',
];

/** Editable fields shown in the lead review step. */
const REVIEW_FIELDS: { key: keyof CapturedLeadFields; label: string; required?: boolean; type?: string }[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Work email', required: true, type: 'email' },
  { key: 'company', label: 'Company / organization' },
  { key: 'role', label: 'Role / designation' },
  { key: 'businessProblem', label: 'Your enquiry', required: true, type: 'textarea' },
  { key: 'requiredService', label: 'Required service / solution' },
  { key: 'projectDescription', label: 'Project description', type: 'textarea' },
  { key: 'scope', label: 'Expected scope / deliverables' },
  { key: 'budget', label: 'Budget range (optional)' },
  { key: 'timeline', label: 'Timeline (optional)' },
  { key: 'preferredContact', label: 'Preferred contact method' },
  { key: 'additionalInfo', label: 'Additional information', type: 'textarea' },
];

export function ChatSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLElement | null>(null);
  // Whether the visitor is currently parked near the bottom of the chat history.
  // Auto-scroll to new messages ONLY when this is true — never yank a visitor
  // back down while they are reading earlier messages (Defect 2 §19/20).
  const [isAtBottom, setIsAtBottom] = useState(true);
  // Whether to show the "New messages ↓" affordance (visitor is scrolled up +
  // a new message arrived).
  const [showJump, setShowJump] = useState(false);

  const {
    messages, addMessage, updateMessage,
    sessionId,
    clearChat,
    qualification, startEnquiry, updateCaptured, setQualificationStage,
    editCapturedField, consentAcknowledged, setConsent,
    marketingConsent, setMarketingConsent,
    leadStatus, leadId, leadNotification, setLeadStatus, cancelEnquiry,
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

  // Attach a scroll listener to the Radix ScrollArea viewport so we can track
  // whether the visitor is parked near the bottom. This drives the conditional
  // auto-scroll below (Defect 2: never yank a visitor back down while they read
  // earlier messages). Re-attaches when the chat opens (the viewport is created
  // on open).
  useEffect(() => {
    if (!isOpen) {
      viewportRef.current = null;
      return;
    }
    const root = scrollAreaRef.current;
    if (!root) return;
    const vp = root.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (!vp) return;
    viewportRef.current = vp;
    const onScroll = () => {
      const distanceFromBottom = vp.scrollHeight - vp.scrollTop - vp.clientHeight;
      const near = distanceFromBottom < 80;
      setIsAtBottom(near);
      if (near) setShowJump(false);
    };
    vp.addEventListener('scroll', onScroll, { passive: true });
    return () => vp.removeEventListener('scroll', onScroll);
  }, [isOpen]);

  // Conditional auto-scroll: when a new message or loading state arrives,
  // scroll to the bottom ONLY if the visitor was already near the bottom.
  // Otherwise leave them where they are + show the "New messages" affordance
  // so they can jump down on their own terms.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    if (isAtBottom) {
      vp.scrollTop = vp.scrollHeight;
      setShowJump(false);
    } else {
      // A new message arrived while the visitor is scrolled up → offer a jump.
      setShowJump(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isLoading]);

  /** Scroll the chat history to the bottom (used by the "New messages" button). */
  const jumpToBottom = () => {
    const vp = viewportRef.current;
    if (!vp) return;
    vp.scrollTop = vp.scrollHeight;
    setIsAtBottom(true);
    setShowJump(false);
  };

  // The stub `calculateMatchScore` matcher that previously lived here was
  // removed in Phase 6.3. It diverged from the real match engine (max 85,
  // threshold 60, skills/experience/domain only) and produced recommendations
  // inconsistent with the job-alerts pipeline. Matching is now performed
  // server-side by /api/chat/career-assist using the real `scoreJobCandidate`
  // engine + the configurable threshold (default 80).

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
        body: JSON.stringify({
          message: userText,
          sessionId,
          history,
          // Send the current qualification state so the model has context for follow-ups.
          qualificationState: qualification.active ? qualification : undefined,
        }),
      });
      // Read the body in both branches — a 503 (provider failure: missing key,
      // unsupported model, quota, timeout) carries an honest message + retryable
      // flag; we show that message with status='error' so the Retry button
      // appears. Never disguise a provider failure as a successful answer.
      const data = await res.json().catch(() => ({} as { answer?: string; citations?: unknown[] }));
      if (!res.ok) {
        // Distinguish a deployment-config failure (missing/invalid key,
        // unsupported model — NOT user-retryable) from a transient provider
        // failure (quota/timeout — retryable). The route returns fallbackReason;
        // mapping it to an actionable hint avoids showing the SAME generic
        // "knowledge service" string for every failure (Prompt §5.4). No secrets
        // or provider internals are exposed — only a safe, actionable hint.
        const reason = typeof data.fallbackReason === 'string' ? data.fallbackReason : '';
        const isConfigIssue =
          reason === 'missing_key' || reason === 'invalid_key' || reason === 'unsupported_model';
        const content = isConfigIssue
          ? "The AI assistant isn't configured correctly for this deployment, so I can't answer right now. Please reach the Paragonel team via the [Contact](/contact) page to report this."
          : (typeof data.answer === 'string' && data.answer) ||
            "I'm having trouble responding right now. Please try again, or reach the Paragonel team via the [Contact](/contact) page.";
        updateMessage(loadingId, {
          content,
          citations: Array.isArray(data.citations) ? (data.citations as { title: string; path: string }[]) : [],
          status: 'error',
        });
        return;
      }
      updateMessage(loadingId, {
        content: data.answer || "I couldn't generate a response. Please try again.",
        citations: Array.isArray(data.citations) ? data.citations : [],
        status: 'ok',
      });

      // Handle lead-qualification intent (Prompt 05P).
      if (data.intent === 'enquiry' && data.enquiryCategory) {
        const cat = data.enquiryCategory as EnquiryCategory;
        // Career enquiries → direct to /careers, NO qualification (05Q–05R scope).
        if (cat === 'career' || cat === 'general') {
          // Not a lead — answer normally (already shown above).
        } else if (isLeadCategory(cat)) {
          // Start or continue the enquiry flow.
          if (!qualification.active) startEnquiry(cat);
          if (data.capturedFields) updateCaptured(data.capturedFields);
          if (data.readyForReview) setQualificationStage('reviewing');
        }
      }
    } catch {
      updateMessage(loadingId, {
        content: "I'm having trouble responding right now. Please try again, or reach the Paragonel team via the [Contact](/contact) page.",
        status: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /** Submit the captured lead to /api/lead (Prompt 05P Phase 5–6). */
  const handleLeadSubmit = async () => {
    if (!consentAcknowledged || !hasMinimumForSubmission(qualification.captured)) return;
    if (leadStatus === 'submitting') return;
    setLeadStatus('submitting');
    try {
      const cat = qualification.category ?? 'new_business';
      const c = qualification.captured;
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: c.name || '',
          email: c.email || '',
          company: c.company || '',
          role: c.role || '',
          enquiryCategory: cat,
          businessProblem: c.businessProblem || '',
          requiredService: c.requiredService || '',
          projectDescription: c.projectDescription || '',
          scope: c.scope || '',
          budget: c.budget || '',
          timeline: c.timeline || '',
          preferredContact: c.preferredContact || '',
          additionalInfo: c.additionalInfo || '',
          consentAcknowledged,
          marketingConsent,
          website: '', // honeypot (must be empty)
        }),
      });
      if (!res.ok) {
        let errMsg = 'Submission failed. Please try again or use the Contact page.';
        try { const j = await res.json(); if (j?.error) errMsg = j.error; } catch { /* ignore */ }
        throw new Error(errMsg);
      }
      const data = await res.json();
      setLeadStatus('success', { id: data.id, notification: data.notification });
      const route = routeForCategory(cat);
      addMessage(
        'ai',
        `Thank you, ${c.name?.split(' ')[0] || ''}. Your enquiry has been received securely (reference: ${data.id}).${
          data.notification === 'sent'
            ? ' Our team has been notified by email.'
            : data.notification === 'skipped'
            ? ' (Email notifications are not configured in this environment — the team will see your enquiry in the CRM.)'
            : ' (There was an issue sending the email notification, but your enquiry is safely stored. The team will see it in the CRM.)'
        } You can also reach us via the [${route.label}](${route.path}) page or our [LinkedIn company page](${COMPANY_LINKEDIN_URL}). We do not guarantee a specific response time.`,
      );
    } catch (err) {
      setLeadStatus('error');
      addMessage('ai', `${err instanceof Error ? err.message : 'Submission failed.'} You can also reach the Paragonel team via the [Contact](/contact) page.`);
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

  /* handleFileUpload + handleConfirmProfile (dead in-chat career flow) removed
     in Batch 8. Career assistance now lives on /careers via the
     CareerAssistant component, which reuses /api/chat/career-assist +
     /api/job-applications directly. */

  /**
   * Render a chat message body with minimal, safe inline Markdown:
   *   **bold**, *italic*, `code`, and [text](url) links.
   *
   * This fixes the reported defect where the greeting rendered literal
   * `**Paragonel AI**` asterisks (the previous renderer only parsed links).
   * It also handles Markdown that the model may emit in answers. Only inline
   * formatting is supported — block constructs (headings, lists, code blocks)
   * are intentionally NOT rendered, and arbitrary HTML is never injected.
   * Links are rendered via next/link; URLs are passed through as-is (the
   * server already sanitizes citations + body links in paragonel-ai-flow).
   */
  const renderContent = (content: string | React.ReactNode) => {
    if (typeof content !== 'string') return content;
    // Split on any inline token; the capture group keeps the tokens in the
    // resulting array so each part is either a token or plain text. Bold must
    // be matched before italic so `**x**` is not parsed as two `*x*`.
    const tokenRe = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
    const parts = content.split(tokenRe);
    return (
      <div className="whitespace-pre-wrap">
        {parts.map((part, i) => {
          if (!part) return null;
          let m = part.match(/^\*\*(.+)\*\*$/);
          if (m) return <strong key={i} className="font-bold">{m[1]}</strong>;
          m = part.match(/^\*(.+)\*$/);
          if (m) return <em key={i}>{m[1]}</em>;
          m = part.match(/^`(.+)`$/);
          if (m) return (
            <code key={i} className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-[0.85em] font-mono">{m[1]}</code>
          );
          m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (m) return (
            <Link key={i} href={m[2]} className="text-primary font-bold hover:underline mx-0.5">{m[1]}</Link>
          );
          return <React.Fragment key={i}>{part}</React.Fragment>;
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
      
      {/* Scrollable Chat Area.
          min-h-0 is the CRITICAL flexbox fix (Defect 2): a flex-grow child with
          overflow-hidden must have min-height:0, otherwise it grows to fit all
          content and the inner ScrollArea's h-full resolves to the unbounded
          content height — so wheel/touch events chain to the page instead of
          scrolling the chat. data-lenis-prevent tells the global Lenis
          smooth-scroll driver (app-shell) to ignore wheel/touch over the chat
          so native scrolling takes over here. */}
      <CardContent className="flex-grow min-h-0 p-0 overflow-hidden bg-background relative">
        <ScrollArea className="h-full w-full" ref={scrollAreaRef} data-lenis-prevent={true}>
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
            {messages.length === 1 && messages[0]?.role === 'ai' && !isLoading && !qualification.active && (
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

            {/* ---- Enquiry flow (Prompt 05P Phase 7) ---- */}
            {/* Mode indicator: shown when an enquiry flow is active (collecting). */}
            {qualification.active && qualification.stage === 'collecting' && leadStatus !== 'success' && (
              <div className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs sm:text-sm" aria-label="Enquiry mode active">
                <span className="text-primary font-medium flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  Enquiry mode{qualification.category ? `: ${ENQUIRY_CATEGORY_LABELS[qualification.category]}` : ''}
                </span>
                <button
                  onClick={cancelEnquiry}
                  className="text-muted-foreground hover:text-foreground underline shrink-0"
                  aria-label="Cancel enquiry and return to normal chat"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Review step: editable fields + consent + submit/cancel. */}
            {qualification.stage === 'reviewing' && leadStatus !== 'success' && leadStatus !== 'submitting' && (
              <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 space-y-3 bg-zinc-50 dark:bg-zinc-900/50" aria-label="Review and submit your enquiry">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Review your enquiry</p>
                  <button onClick={cancelEnquiry} className="text-xs text-muted-foreground hover:text-foreground underline" aria-label="Cancel enquiry submission">Cancel</button>
                </div>
                {qualification.category && (
                  <p className="text-xs text-muted-foreground">Category: {ENQUIRY_CATEGORY_LABELS[qualification.category]}</p>
                )}
                <div className="space-y-2">
                  {REVIEW_FIELDS.map((f) => (
                    <div key={f.key} className="space-y-1">
                      <label htmlFor={`lead-${f.key}`} className="text-xs font-medium text-foreground">
                        {f.label}{f.required ? <span className="text-destructive"> *</span> : null}
                      </label>
                      {f.type === 'textarea' ? (
                        <textarea
                          id={`lead-${f.key}`}
                          value={(qualification.captured[f.key] as string) || ''}
                          onChange={(e) => editCapturedField(f.key, e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-background px-3 py-1.5 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-primary resize-y"
                          aria-required={f.required}
                        />
                      ) : (
                        <input
                          id={`lead-${f.key}`}
                          type={f.type || 'text'}
                          value={(qualification.captured[f.key] as string) || ''}
                          onChange={(e) => editCapturedField(f.key, e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-background px-3 py-1.5 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-primary"
                          aria-required={f.required}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {/* Consent: explicit acknowledgement (required) + separate marketing consent (optional). */}
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-start gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={consentAcknowledged}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5"
                      aria-required
                    />
                    <span>I acknowledge that Paragonel will use this information to respond to and manage my enquiry, per the <Link href="/privacy" className="underline text-primary" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.</span>
                  </label>
                  <label className="flex items-start gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>Optional: I would also like to receive occasional product/company updates. (Separate from this enquiry — you can unsubscribe anytime.)</span>
                  </label>
                </div>
                <p className="text-[10px] text-muted-foreground">Submitting an enquiry does not guarantee a proposal, meeting, project acceptance, or specific response time.</p>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleLeadSubmit}
                    disabled={!consentAcknowledged || !hasMinimumForSubmission(qualification.captured)}
                    className="flex-1 h-9 text-xs sm:text-sm rounded-lg"
                    aria-label="Submit enquiry"
                  >
                    Submit enquiry
                  </Button>
                  <Button
                    onClick={() => setQualificationStage('collecting')}
                    variant="outline"
                    className="h-9 text-xs sm:text-sm rounded-lg"
                    aria-label="Continue conversation to add more detail"
                  >
                    Continue chat
                  </Button>
                </div>
                {leadStatus === 'error' && (
                  <p className="text-xs text-destructive" role="alert">Submission failed. Please try again or use the Contact page.</p>
                )}
              </div>
            )}

            {/* Submitting state. */}
            {leadStatus === 'submitting' && (
              <div className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground" aria-label="Submitting your enquiry">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Submitting your enquiry…
              </div>
            )}

            {/* Success state: honest confirmation + human-handoff options. */}
            {leadStatus === 'success' && (
              <div className="w-full rounded-2xl border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 space-y-2" aria-label="Enquiry submitted successfully">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">Enquiry received ✓</p>
                {leadId && <p className="text-xs text-muted-foreground">Reference: {leadId}</p>}
                <p className="text-xs text-muted-foreground">
                  {leadNotification === 'sent'
                    ? 'Our team has been notified by email.'
                    : leadNotification === 'skipped'
                    ? 'Email notifications are not configured in this environment, but your enquiry is safely stored.'
                    : 'There was an email notification issue, but your enquiry is safely stored.'}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link href={routeForCategory(qualification.category ?? 'new_business').path} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20" aria-label="Contact page">
                    {routeForCategory(qualification.category ?? 'new_business').label}
                  </Link>
                  <a href={COMPANY_LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-primary hover:text-primary" aria-label="Paragonel LinkedIn company page (opens in a new tab)">
                    LinkedIn
                  </a>
                  <button onClick={cancelEnquiry} className="text-xs px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-primary" aria-label="Start a new conversation">
                    New question
                  </button>
                </div>
              </div>
            )}
            {isLoading && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          </div>
        </ScrollArea>
        {/* "New messages" affordance — shown only when the visitor is scrolled up
            reading earlier messages AND a new message arrived. Does NOT yank them
            down; they click to jump on their own terms (Defect 2 §20). */}
        {showJump && (
          <button
            type="button"
            onClick={jumpToBottom}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground shadow-lg px-3 py-1.5 text-xs font-semibold hover:scale-105 transition-transform"
            aria-label="Jump to the newest message"
          >
            New messages <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
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
