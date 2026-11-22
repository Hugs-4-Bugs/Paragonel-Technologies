"use client";

import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Search, Microscope, GitCompareArrows, FileText, Gauge, Sparkles,
  Send, MessageSquare, CalendarClock, KanbanSquare, FileSignature, Handshake,
  type LucideIcon,
} from "lucide-react";

type Stage = {
  n: string;
  name: string;
  icon: LucideIcon;
  short: string;
  detail: string;
  input: string;
  output: string;
  next: string;
};

// Self-contained lifecycle data. Defining it here (rather than receiving it as
// a prop from the server page) avoids passing non-serializable Lucide icon
// components across the server→client component boundary.
const lifecycle: Stage[] = [
  { n: '01', name: 'Discover', icon: Search, short: 'Find the businesses that fit your target profile.', detail: 'Discovery is where every acquisition engagement begins. Instead of importing a static list, AcquisitionOS lets you describe the kind of business you want to reach — industry, size, signals, geography — and surfaces prospect businesses that match. The output of Discover is a working set of named prospects that flow into research.', input: 'Target profile and criteria', output: 'A set of named prospect businesses', next: 'Research' },
  { n: '02', name: 'Research', icon: Microscope, short: 'Aggregate multi-source company information into one context.', detail: 'Research pulls together what is publicly knowable about a prospect into a single, structured context — company activity, offerings, scale, and the landscape they operate in. Rather than a salesperson rebuilding context across six tabs, AcquisitionOS assembles it once, in one place, ready to be reasoned over.', input: 'A named prospect', output: 'A structured research context', next: 'Find Gaps' },
  { n: '03', name: 'Find Gaps', icon: GitCompareArrows, short: 'Detect gaps, triggers, and unmet needs.', detail: 'Find Gaps reads the research context for openings — an unmet need, a missing capability, a trigger event — that your offering could credibly address. Gaps are surfaced as explicit signals, not invented: where information is missing, the system says so rather than filling it with a guess.', input: 'A research context', output: 'A set of detected gaps and triggers', next: 'Opportunity Report' },
  { n: '04', name: 'Opportunity Report', icon: FileText, short: 'Assemble a business-specific opportunity report.', detail: 'The Opportunity Report turns the research and the gaps into a readable, structured brief: why this prospect, what is missing, and where your offering fits. It is the artifact a salesperson would otherwise write by hand — produced consistently, and ready to inform scoring and personalization.', input: 'Research + gaps', output: 'A structured opportunity report', next: 'Score' },
  { n: '05', name: 'Score', icon: Gauge, short: 'Produce an AI-assisted lead score — a signal, not a prediction.', detail: 'Scoring assigns a relative weight to each opportunity so a team can decide where to spend its time first. AcquisitionOS is explicit that its scores are AI-assisted signals, not predictions: they rank and prioritize, they do not guarantee an outcome. A human still decides whether to pursue.', input: 'An opportunity report', output: 'A prioritized score', next: 'Personalize' },
  { n: '06', name: 'Personalize', icon: Sparkles, short: 'Generate personalized outreach context from the report.', detail: 'Personalization turns the opportunity report into the specific angle, opener, and value proposition for this prospect. The output is outreach-ready context — drafted, specific, and grounded in the research — that a human reviews and sends rather than a generic template blast.', input: 'A scored opportunity', output: 'Personalized outreach context', next: 'Outreach' },
  { n: '07', name: 'Outreach', icon: Send, short: 'Send multi-channel outreach from one place.', detail: 'Outreach sends across the channels your prospects actually use — email, WhatsApp, LinkedIn, and Instagram — from inside the same workflow that produced the message. No copying between tools, no losing the context that made the message specific. Channel availability is classified honestly in the integration directory below.', input: 'Personalized outreach context', output: 'Sent outreach across channels', next: 'Reply' },
  { n: '08', name: 'Reply', icon: MessageSquare, short: 'Capture and analyze replies and conversation state.', detail: 'Reply brings responses back into the same opportunity record, so a conversation is never orphaned in a separate inbox. The system helps read the state of a reply — interest, objection, next step — so the salesperson can pick the right next action without reconstructing the thread.', input: 'Inbound replies', output: 'Analyzed conversation state', next: 'Meeting' },
  { n: '09', name: 'Meeting', icon: CalendarClock, short: 'Schedule and manage meeting workflows.', detail: 'Meeting moves a warm conversation toward a booked call. AcquisitionOS supports the meeting workflow — proposing times, capturing the outcome — so a meeting is a tracked stage in the pipeline, not a loose calendar entry. Calendar integrations are classified in the directory below.', input: 'A qualified conversation', output: 'A scheduled and tracked meeting', next: 'Pipeline' },
  { n: '10', name: 'Pipeline', icon: KanbanSquare, short: 'Manage opportunities on a pipeline board.', detail: 'Pipeline is where every opportunity lives as it moves toward close — visible, stage-tagged, and connected to all the context that came before it. The board keeps the whole acquisition motion in one view instead of split across a CRM, a spreadsheet, and a sequence tool.', input: 'Active opportunities', output: 'A managed pipeline', next: 'Proposal' },
  { n: '11', name: 'Proposal', icon: FileSignature, short: 'Generate a structured proposal from the opportunity.', detail: 'Proposal turns the accumulated context — the research, the gaps, the conversation — into a structured proposal document, grounded in what was actually learned about the prospect rather than a recycled template. The proposal is a draft a human finalizes, not a finished contract.', input: 'A pipeline opportunity', output: 'A structured proposal draft', next: 'Close' },
  { n: '12', name: 'Close', icon: Handshake, short: 'Support the path to close.', detail: 'Close is the final stage — the handoff from proposal to won engagement. Today this stage is supported narratively as the destination of the workflow; deeper close automation is on the roadmap. The value of Close is that every artifact that led here — research, report, score, outreach, conversation, proposal — lives in one connected record.', input: 'A finalized proposal', output: 'A closed engagement', next: '—' },
];

/**
 * Interactive 12-stage AcquisitionOS workflow.
 * Click a node -> the detail panel updates. Animated flow connector + active
 * node states. Reduced-motion: static nodes, no flow animation.
 */
export function AcquisitionWorkflow() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const s = lifecycle[active];

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-muted/30 p-4 md:p-8">
      {/* Node flow */}
      <div className="relative">
        <div className="absolute left-0 right-0 top-5 hidden h-px bg-border md:block" />
        <motion.div
          className="absolute left-0 top-5 hidden h-0.5 bg-primary md:block"
          initial={reduce ? false : { width: 0 }}
          whileInView={{ width: `${((active + 1) / lifecycle.length) * 100}%` }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        <div className="relative grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
          {lifecycle.map((st, i) => {
            const isActive = i === active;
            const isPast = i < active;
            return (
              <motion.button
                key={st.n}
                type="button"
                onClick={() => setActive(i)}
                initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="group flex flex-col items-center gap-1.5 text-center"
                aria-pressed={isActive}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/40 scale-110"
                      : isPast
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground group-hover:border-primary/50 group-hover:text-primary"
                  }`}
                >
                  <st.icon className="h-4 w-4" />
                </span>
                <span className="text-[9px] font-black text-muted-foreground">{st.n}</span>
                <span className={`hidden text-[10px] font-bold leading-tight lg:block ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {st.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="mt-8 grid gap-6 rounded-2xl border border-border bg-background p-6 md:grid-cols-[auto_1fr_auto] md:items-start md:p-8"
        >
          <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stage {s.n}</div>
              <h3 className="text-xl font-black tracking-tight md:text-2xl">{s.name}</h3>
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground">{s.short}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.detail}</p>
          </div>
          <div className="space-y-3 text-sm md:border-l md:border-border md:pl-6">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Input</div>
              <div className="font-bold text-foreground">{s.input}</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Output</div>
              <div className="font-bold text-foreground">{s.output}</div>
            </div>
            {s.next !== "—" && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hands to</span>
                <span className="flex items-center gap-1 font-bold text-primary">
                  {s.next} <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActive((a) => Math.max(0, a - 1))}
          disabled={active === 0}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-bold text-muted-foreground transition disabled:opacity-40 enabled:hover:border-primary enabled:hover:text-primary"
        >
          ← Previous
        </button>
        <span className="text-xs font-bold text-muted-foreground">
          {active + 1} / {lifecycle.length}
        </span>
        <button
          type="button"
          onClick={() => setActive((a) => Math.min(lifecycle.length - 1, a + 1))}
          disabled={active === lifecycle.length - 1}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-bold text-muted-foreground transition disabled:opacity-40 enabled:hover:border-primary enabled:hover:text-primary"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
