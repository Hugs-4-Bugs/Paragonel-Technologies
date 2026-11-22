/**
 * acquisitionos-data.ts — the AcquisitionOS 12-stage lifecycle (source of truth).
 *
 * Terminology, order and detail are preserved verbatim from the prior page
 * (Prompt 02/03). Prompt 05C does NOT rename, reorder, remove or simplify any
 * stage. The interactive LifecycleWorkflow component imports this so the icon
 * references stay inside the client bundle (server→client props must be
 * serializable; LucideIcon references are not).
 */
import type { LucideIcon } from 'lucide-react';
import {
  Search, Microscope, GitCompareArrows, FileText, Gauge, Sparkles, Send, MessageSquare,
  CalendarClock, KanbanSquare, FileSignature, Handshake,
} from 'lucide-react';

export interface LifecycleStage {
  n: string;
  name: string;
  icon: LucideIcon;
  short: string;
  detail: string;
  input: string;
  output: string;
  next: string;
}

export const LIFECYCLE: LifecycleStage[] = [
  { n: '01', name: 'Discover', icon: Search,
    short: 'Find the businesses that fit your target profile.',
    detail: 'Discovery is where every acquisition engagement begins. Instead of importing a static list, AcquisitionOS lets you describe the kind of business you want to reach — industry, size, signals, geography — and surfaces prospect businesses that match. The output of Discover is a working set of named prospects that flow into research.',
    input: 'Target profile and criteria', output: 'A set of named prospect businesses', next: 'Research' },
  { n: '02', name: 'Research', icon: Microscope,
    short: 'Aggregate multi-source company information into one context.',
    detail: 'Research pulls together what is publicly knowable about a prospect into a single, structured context — company activity, offerings, scale, and the landscape they operate in. Rather than a salesperson rebuilding context across six tabs, AcquisitionOS assembles it once, in one place, ready to be reasoned over.',
    input: 'A named prospect', output: 'A structured research context', next: 'Find Gaps' },
  { n: '03', name: 'Find Gaps', icon: GitCompareArrows,
    short: 'Detect gaps, triggers, and unmet needs.',
    detail: 'Find Gaps reads the research context for openings — an unmet need, a missing capability, a trigger event — that your offering could credibly address. Gaps are surfaced as explicit signals, not invented: where information is missing, the system says so rather than filling it with a guess.',
    input: 'A research context', output: 'A set of detected gaps and triggers', next: 'Opportunity Report' },
  { n: '04', name: 'Opportunity Report', icon: FileText,
    short: 'Assemble a business-specific opportunity report.',
    detail: 'The Opportunity Report turns the research and the gaps into a readable, structured brief: why this prospect, what is missing, and where your offering fits. It is the artifact a salesperson would otherwise write by hand — produced consistently, and ready to inform scoring and personalization.',
    input: 'Research + gaps', output: 'A structured opportunity report', next: 'Score' },
  { n: '05', name: 'Score', icon: Gauge,
    short: 'Prioritize opportunities with an AI-assisted score.',
    detail: 'Score assigns each opportunity a prioritization signal so a team can decide where to spend its time first. The score is an AI-assisted ranking, not a prediction of outcome — a human confirms before anything acts on it. Scoring draws on the opportunity report so the priority reflects the actual fit and signals, not a generic lead grade.',
    input: 'An opportunity report', output: 'A prioritized score', next: 'Personalize' },
  { n: '06', name: 'Personalize', icon: Sparkles,
    short: 'Turn the opportunity into personalized outreach context.',
    detail: 'Personalize takes the scored opportunity and produces the context that makes outreach specific — the angle, the reference point, the reason this message belongs to this prospect and no other. The output is a draft a human reviews and sends, not a finished mail-merge. The personalization is grounded in the research and the gaps, not a guessed variable.',
    input: 'A scored opportunity', output: 'Personalized outreach context', next: 'Outreach' },
  { n: '07', name: 'Outreach', icon: Send,
    short: 'Send outreach across the channels prospects actually use.',
    detail: 'Outreach sends across the channels your prospects actually use — email, WhatsApp, LinkedIn, and Instagram — from inside the same workflow that produced the message. No copying between tools, no losing the context that made the message specific. Channel availability is classified honestly in the integration directory below.',
    input: 'Personalized outreach context', output: 'Sent outreach across channels', next: 'Reply' },
  { n: '08', name: 'Reply', icon: MessageSquare,
    short: 'Bring replies back into the same opportunity record.',
    detail: 'Reply brings responses back into the same opportunity record, so a conversation is never orphaned in a separate inbox. The system helps read the state of a reply — interest, objection, next step — so the salesperson can pick the right next action without reconstructing the thread.',
    input: 'Inbound replies', output: 'Analyzed conversation state', next: 'Meeting' },
  { n: '09', name: 'Meeting', icon: CalendarClock,
    short: 'Move a qualified conversation toward a booked call.',
    detail: 'Meeting moves a warm conversation toward a booked call. AcquisitionOS supports the meeting workflow — proposing times, capturing the outcome — so a meeting is a tracked stage in the pipeline, not a loose calendar entry. Calendar integrations are classified in the directory below.',
    input: 'A qualified conversation', output: 'A scheduled and tracked meeting', next: 'Pipeline' },
  { n: '10', name: 'Pipeline', icon: KanbanSquare,
    short: 'Manage opportunities on a pipeline board.',
    detail: 'Pipeline is where every opportunity lives as it moves toward close — visible, stage-tagged, and connected to all the context that came before it. The board keeps the whole acquisition motion in one view instead of split across a CRM, a spreadsheet, and a sequence tool.',
    input: 'Active opportunities', output: 'A managed pipeline', next: 'Proposal' },
  { n: '11', name: 'Proposal', icon: FileSignature,
    short: 'Generate a structured proposal from the opportunity.',
    detail: 'Proposal turns the accumulated context — the research, the gaps, the conversation — into a structured proposal document, grounded in what was actually learned about the prospect rather than a recycled template. The proposal is a draft a human finalizes, not a finished contract.',
    input: 'A pipeline opportunity', output: 'A structured proposal draft', next: 'Close' },
  { n: '12', name: 'Close', icon: Handshake,
    short: 'Support the path to close.',
    detail: 'Close is the final stage — the handoff from proposal to won engagement. Today this stage is supported narratively as the destination of the workflow; deeper close automation is on the roadmap. The value of Close is that every artifact that led here — research, report, score, outreach, conversation, proposal — lives in one connected record.',
    input: 'A finalized proposal', output: 'A closed engagement', next: '—' },
];
