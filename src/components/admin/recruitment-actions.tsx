'use client';
/**
 * RecruitmentActions — admin recruitment management panel (Phase 7/8).
 *
 * Shown on the admin application detail page. Lets an authorized admin:
 *   - See the current internal stage + candidate-visible status (side by side).
 *   - Apply decision shortcuts (shortlist / assess / reject / offer / hire /
 *     archive) that atomically set both fields + email the candidate per policy.
 *   - Change the internal stage independently (never affects the candidate view).
 *   - Add a structured private note (screening/interview/general) — never shown
 *     to candidates.
 *   - Schedule an interview (POST /interviews) — emails the candidate the
 *     approved details only.
 *
 * All actions go through the authorized server routes (PATCH /api/admin/
 * applications/[id], POST /api/admin/applications/[id]/interviews). The admin
 * UI never trusts a client role claim — verifyAdminPermission enforces 'cms.update'.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, XCircle, UserCheck, FileCheck, Trophy, Ban, Archive, CalendarPlus, StickyNote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  INTERNAL_STAGES,
  INTERNAL_STAGE_LABELS,
  CANDIDATE_STATUSES,
  CANDIDATE_STATUS_LABELS,
  type InternalStage,
  type CandidateStatus,
} from '@/lib/recruitment/status';

interface Props {
  applicationId: string;
  internalStage?: string;
  candidateStatus?: string;
  onChanged: () => void;
}

const DECISIONS = [
  { key: 'shortlist', label: 'Shortlist', icon: UserCheck, cls: 'bg-violet-600 hover:bg-violet-700' },
  { key: 'assess', label: 'Request assessment', icon: FileCheck, cls: 'bg-cyan-600 hover:bg-cyan-700' },
  { key: 'offer', label: 'Extend offer', icon: Trophy, cls: 'bg-emerald-600 hover:bg-emerald-700' },
  { key: 'hire', label: 'Mark hired', icon: CheckCircle2, cls: 'bg-green-600 hover:bg-green-700' },
  { key: 'reject', label: 'Reject', icon: XCircle, cls: 'bg-red-600 hover:bg-red-700' },
  { key: 'archive', label: 'Archive', icon: Archive, cls: 'bg-zinc-600 hover:bg-zinc-700' },
] as const;

export function RecruitmentActions({ applicationId, internalStage, candidateStatus, onChanged }: Props) {
  const { toast } = useToast();
  const [busyDecision, setBusyDecision] = useState<string | null>(null);
  const [stageBusy, setStageBusy] = useState(false);
  const [csBusy, setCsBusy] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [noteKind, setNoteKind] = useState<'screening' | 'interview' | 'general'>('general');
  const [noteBusy, setNoteBusy] = useState(false);

  // Interview form
  const [ivStage, setIvStage] = useState('');
  const [ivDate, setIvDate] = useState('');
  const [ivTime, setIvTime] = useState('');
  const [ivTz, setIvTz] = useState('Asia/Kolkata');
  const [ivMode, setIvMode] = useState<'video' | 'phone' | 'onsite'>('video');
  const [ivLink, setIvLink] = useState('');
  const [ivInstr, setIvInstr] = useState('');
  const [ivBusy, setIvBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || 'Action failed');
    }
    return res;
  }

  async function decision(key: string) {
    setBusyDecision(key);
    try {
      await patch({ decision: key });
      toast({ title: 'Updated', description: 'The application status has been updated.' });
      onChanged();
    } catch (e) {
      toast({ title: 'Failed', description: e instanceof Error ? e.message : 'Try again.', variant: 'destructive' });
    } finally {
      setBusyDecision(null);
    }
  }

  async function changeStage(value: string) {
    setStageBusy(true);
    try {
      await patch({ internalStage: value });
      toast({ title: 'Internal stage updated' });
      onChanged();
    } catch (e) {
      toast({ title: 'Failed', description: e instanceof Error ? e.message : 'Try again.', variant: 'destructive' });
    } finally {
      setStageBusy(false);
    }
  }

  async function changeCandidateStatus(value: string) {
    setCsBusy(true);
    try {
      await patch({ candidateStatus: value });
      toast({ title: 'Candidate-visible status updated', description: 'The candidate will see this status + be emailed per policy.' });
      onChanged();
    } catch (e) {
      toast({ title: 'Failed', description: e instanceof Error ? e.message : 'Try again.', variant: 'destructive' });
    } finally {
      setCsBusy(false);
    }
  }

  async function addNote() {
    if (!noteBody.trim()) return;
    setNoteBusy(true);
    try {
      await patch({ addNote: { body: noteBody, kind: noteKind } });
      toast({ title: 'Note added', description: 'Private note recorded (internal only).' });
      setNoteBody('');
      onChanged();
    } catch (e) {
      toast({ title: 'Failed', description: e instanceof Error ? e.message : 'Try again.', variant: 'destructive' });
    } finally {
      setNoteBusy(false);
    }
  }

  async function scheduleInterview() {
    if (!ivStage || !ivDate || !ivTime || !ivTz) {
      toast({ title: 'Missing details', description: 'Stage, date, time, and time zone are required.', variant: 'destructive' });
      return;
    }
    setIvBusy(true);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: ivStage, date: ivDate, startTime: ivTime, timeZone: ivTz,
          mode: ivMode, meetingLink: ivLink, instructions: ivInstr,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Could not schedule interview');
      }
      toast({ title: 'Interview scheduled', description: 'The candidate has been emailed the details.' });
      setIvStage(''); setIvDate(''); setIvTime(''); setIvLink(''); setIvInstr('');
      onChanged();
    } catch (e) {
      toast({ title: 'Failed', description: e instanceof Error ? e.message : 'Try again.', variant: 'destructive' });
    } finally {
      setIvBusy(false);
    }
  }

  const cs = candidateStatus as CandidateStatus | undefined;
  const is_ = internalStage as InternalStage | undefined;

  return (
    <div className="space-y-6">
      {/* Status display */}
      <Card className="border-none shadow-sm rounded-2xl">
        <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-800/30">
          <CardTitle className="text-lg font-bold">Recruitment status</CardTitle>
          <CardDescription>Internal stage is never shown to the candidate.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Internal stage</p>
              <p className="font-bold text-sm">{is_ ? (INTERNAL_STAGE_LABELS[is_] || is_) : 'New application'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Candidate-visible</p>
              <p className="font-bold text-sm">{cs ? (CANDIDATE_STATUS_LABELS[cs] || cs) : 'Application submitted'}</p>
            </div>
          </div>

          {/* Decision shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
            {DECISIONS.map((d) => {
              const Icon = d.icon;
              return (
                <Button
                  key={d.key}
                  type="button"
                  size="sm"
                  className={`${d.cls} text-white h-9`}
                  disabled={busyDecision !== null}
                  onClick={() => decision(d.key)}
                >
                  {busyDecision === d.key ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Icon className="h-3.5 w-3.5 mr-1.5" />}
                  {d.label}
                </Button>
              );
            })}
          </div>

          {/* Internal stage selector */}
          <div className="pt-2">
            <Label className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Change internal stage</Label>
            <Select value={is_ || 'new'} onValueChange={changeStage} disabled={stageBusy}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTERNAL_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>{INTERNAL_STAGE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Candidate-visible status selector (independent of internal stage) */}
          <div className="pt-2">
            <Label className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Candidate-visible status</Label>
            <Select value={cs || 'submitted'} onValueChange={changeCandidateStatus} disabled={csBusy}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CANDIDATE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{CANDIDATE_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1">This is the ONLY status the candidate sees. Emailed per policy.</p>
          </div>
        </CardContent>
      </Card>

      {/* Add private note */}
      <Card className="border-none shadow-sm rounded-2xl">
        <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-800/30">
          <CardTitle className="text-lg font-bold flex items-center gap-2"><StickyNote className="h-5 w-5 text-primary" /> Add private note</CardTitle>
          <CardDescription>Internal only — never shown to the candidate.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <div className="flex gap-2">
            <Select value={noteKind} onValueChange={(v) => setNoteKind(v as typeof noteKind)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Screening feedback, technical assessment, internal deliberation…" className="min-h-[100px]" />
          <Button onClick={addNote} disabled={noteBusy || !noteBody.trim()} className="w-full">
            {noteBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <StickyNote className="h-4 w-4 mr-2" />}
            Add note
          </Button>
        </CardContent>
      </Card>

      {/* Schedule interview */}
      <Card className="border-none shadow-sm rounded-2xl">
        <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-800/30">
          <CardTitle className="text-lg font-bold flex items-center gap-2"><CalendarPlus className="h-5 w-5 text-primary" /> Schedule interview</CardTitle>
          <CardDescription>The candidate is emailed the approved details only.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Stage</Label>
              <Input value={ivStage} onChange={(e) => setIvStage(e.target.value)} placeholder="e.g. Technical Round 1" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mode</Label>
              <Select value={ivMode} onValueChange={(v) => setIvMode(v as typeof ivMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={ivDate} onChange={(e) => setIvDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start time</Label>
              <Input type="time" value={ivTime} onChange={(e) => setIvTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Time zone</Label>
              <Input value={ivTz} onChange={(e) => setIvTz(e.target.value)} placeholder="Asia/Kolkata" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Meeting link</Label>
              <Input value={ivLink} onChange={(e) => setIvLink(e.target.value)} placeholder="https://… (optional)" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Instructions (optional)</Label>
            <Textarea value={ivInstr} onChange={(e) => setIvInstr(e.target.value)} placeholder="Anything the candidate should prepare…" className="min-h-[60px]" />
          </div>
          <Button onClick={scheduleInterview} disabled={ivBusy} className="w-full">
            {ivBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarPlus className="h-4 w-4 mr-2" />}
            Schedule + notify candidate
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
