"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, FileUser, Trash2, Eye, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusOptions = ["New", "Reviewing", "Shortlisted", "Interview Scheduled", "Rejected", "Hired"];

type Application = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobId?: string;
  status?: string;
  appliedAt?: { seconds: number };
  matchScore?: number;
  deletedAt?: { seconds: number } | null;
};

export default function ApplicationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/applications', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setApplications(data.applications as Application[]);
    } catch {
      setApplications([]);
      toast({ title: "Failed to load applications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadApps(); }, [loadApps]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Status Updated", description: `Application is now ${newStatus}.` });
      setApplications(prev => prev?.map(a => a.id === id ? { ...a, status: newStatus } : a) ?? null);
    } catch {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  const handleSoftDelete = async (id: string, isRestoring = false) => {
    const action = isRestoring ? "Restoring" : "Archiving";
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedAt: isRestoring ? 'restore' : 'soft' }),
      });
      if (!res.ok) throw new Error();
      toast({ title: `Application ${action}d` });
      setApplications(prev => prev?.map(a => a.id === id
        ? { ...a, deletedAt: isRestoring ? null : { seconds: Math.floor(Date.now()/1000) } }
        : a) ?? null);
    } catch {
      toast({ title: "Action Failed", variant: "destructive" });
    }
  };

  const filteredApps = applications?.filter((app) => {
    const matchesSearch = app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <FileUser className="h-8 w-8 text-primary" />
            Applicant Tracking (ATS)
          </h1>
          <p className="text-zinc-500">Manage your hiring funnel and candidate pipeline.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search by name, email or job..."
            className="pl-10 h-11 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-xl">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {statusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border-zinc-200 shadow-sm rounded-2xl">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow>
              <TableHead className="font-bold">Candidate</TableHead>
              <TableHead className="font-bold">Applied Position</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Applied Date</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ))
            ) : filteredApps && filteredApps.length > 0 ? (
              filteredApps.map((app) => (
                <TableRow key={app.id} className={cn("hover:bg-zinc-50/50 transition-colors", app.deletedAt && "opacity-50 grayscale")}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{app.candidateName}</span>
                      <span className="text-[10px] text-zinc-400">{app.candidateEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{app.jobTitle}</span>
                      <span className="text-[10px] text-zinc-400">ID: {app.jobId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select defaultValue={app.status || 'New'} onValueChange={(val) => handleStatusChange(app.id, val)}>
                      <SelectTrigger className="h-8 text-[11px] font-bold rounded-lg border-primary/20 bg-primary/5 text-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(opt => <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 font-medium">
                    {app.appliedAt?.seconds ? formatDistanceToNow(app.appliedAt.seconds * 1000, { addSuffix: true }) : 'Recently'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-primary">
                        <Link href={`/admin/applications/${app.id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      {app.deletedAt ? (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => handleSoftDelete(app.id, true)}>
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-destructive" onClick={() => handleSoftDelete(app.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="text-center h-40 text-zinc-400">No applications found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
