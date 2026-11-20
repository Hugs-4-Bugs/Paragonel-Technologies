"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Download, Mail, Phone, Calendar, Briefcase, User, Info, Save, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Application = {
  id: string;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  jobTitle?: string;
  status?: string;
  appliedAt?: { seconds: number };
  appliedVia?: string;
  internalNotes?: string;
  skills?: string[];
  resumeUrl?: string;
};

export default function ApplicationDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [notes, setInternalNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumeLoading, setResumeLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/applications/${id}`, { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setApp(null);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setApp(data.application as Application);
          setInternalNotes(data.application?.internalNotes || '');
        }
      } catch {
        if (!cancelled) setApp(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleSaveNotes = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: notes }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Notes Saved", description: "Internal evaluation recorded." });
    } catch {
      toast({ title: "Failed to save notes", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Phase 4 IU-0 slice 3: fetch a short-lived signed resume URL from the server
  // (authorized route). The raw Storage object path is never placed in the DOM;
  // each click requests a fresh signed URL, so expiry is handled by re-requesting.
  const handleDownloadResume = async () => {
    if (!id || resumeLoading) return;
    setResumeLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${id}/resume`, { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.status === 404) {
        toast({ title: 'No resume', description: 'This application has no resume on file.', variant: 'destructive' });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Could not generate resume link.');
      }
      const data = (await res.json()) as { url: string };
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast({ title: 'Resume unavailable', description: e instanceof Error ? e.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setResumeLoading(false);
    }
  };

  if (loading) return <div className="h-80 flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!app) return <div className="text-center p-20">Application not found.</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{app.candidateName}</h1>
          <p className="text-zinc-500 font-medium">{app.jobTitle}</p>
        </div>
        <Badge className="ml-auto bg-primary/10 text-primary hover:bg-primary/20 border-none font-black px-4 py-1">
          {app.status || 'New'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900">
            <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-800/30">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Candidate Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Email Address</p>
                  <p className="font-bold flex items-center gap-2"><Mail className="h-4 w-4 text-zinc-400" /> {app.candidateEmail}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Phone Number</p>
                  <p className="font-bold flex items-center gap-2"><Phone className="h-4 w-4 text-zinc-400" /> {app.candidatePhone}</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3">Skills Captured</p>
                <div className="flex flex-wrap gap-2">
                  {app.skills?.map((s) => (
                    <Badge key={s} variant="outline" className="bg-zinc-50 dark:bg-zinc-800 text-xs py-1 px-3 border-zinc-200">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden">
            <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-800/30">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Internal Evaluation & Notes
              </CardTitle>
              <CardDescription>Visible only to Paragonel team.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <Textarea
                placeholder="Add interview feedback, technical ratings, or screening notes here..."
                className="min-h-[200px] border-zinc-200 focus-visible:ring-1 text-sm leading-relaxed"
                value={notes}
                onChange={(e) => setInternalNotes(e.target.value)}
              />
              <Button onClick={handleSaveNotes} disabled={isSaving} className="w-full h-12 font-bold shadow-xl shadow-primary/20">
                {isSaving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                Persist Evaluation Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-xl rounded-2xl bg-zinc-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Download className="h-20 w-20" /></div>
            <CardHeader>
              <CardTitle className="text-lg">Resume Document</CardTitle>
              <CardDescription className="text-zinc-400">Supporting candidate file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-zinc-800 rounded-xl flex items-center gap-4">
                <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">Candidate Resume</p>
                  <p className="text-[10px] text-zinc-500">Secure signed link · 5-min access</p>
                </div>
              </div>
              <Button
                onClick={handleDownloadResume}
                disabled={resumeLoading || !app.resumeUrl}
                className="w-full bg-white text-zinc-900 hover:bg-zinc-200 font-black h-12"
              >
                {resumeLoading ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <Download className="h-5 w-5 mr-2" />
                )}
                {app.resumeUrl ? 'Download Resume' : 'No Resume on File'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="p-6 border-b"><CardTitle className="text-sm font-bold">Metadata</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-bold">Applied Date</span>
                <span className="font-bold">{app.appliedAt?.seconds ? new Date(app.appliedAt.seconds * 1000).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-bold">Applied Via</span>
                <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest">{app.appliedVia || 'Form'}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
