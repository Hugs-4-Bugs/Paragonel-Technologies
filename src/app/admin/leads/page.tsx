"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Search, Trash2, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const leadStatuses = ["New", "Contacted", "Qualified", "Closed"];

type Lead = {
  id: string;
  name: string;
  email: string;
  company?: string;
  message?: string;
  source?: string;
  status?: string;
  createdAt?: { seconds: number };
  deletedAt?: { seconds: number } | null;
};

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leads', { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setLeads(data.leads as Lead[]);
    } catch {
      setLeads([]);
      toast({ title: "Failed to load leads", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Status Updated" });
      setLeads(prev => prev?.map(l => l.id === id ? { ...l, status: newStatus } : l) ?? null);
    } catch {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  const handleSoftDelete = async (id: string, isRestoring = false) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedAt: isRestoring ? 'restore' : 'soft' }),
      });
      if (!res.ok) throw new Error();
      toast({ title: isRestoring ? "Lead Restored" : "Lead Archived" });
      setLeads(prev => prev?.map(l => l.id === id
        ? { ...l, deletedAt: isRestoring ? null : { seconds: Math.floor(Date.now()/1000) } }
        : l) ?? null);
    } catch {
      toast({ title: "Action Failed", variant: "destructive" });
    }
  };

  const filteredLeads = leads?.filter((l) =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary" />
          Lead Management
        </h1>
        <p className="text-zinc-500">Track and follow up with business inquiries.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search leads..."
            className="pl-10 h-11 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden border-zinc-200 shadow-sm rounded-2xl">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow>
              <TableHead className="font-bold">Lead Information</TableHead>
              <TableHead className="font-bold">Source</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Message Snippet</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
            ) : filteredLeads && filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <TableRow key={lead.id} className={cn("hover:bg-zinc-50/50 transition-colors", lead.deletedAt && "opacity-50 grayscale")}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{lead.name}</span>
                      <span className="text-[10px] text-zinc-400">{lead.email}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] uppercase font-black">{lead.source || 'Contact'}</Badge></TableCell>
                  <TableCell>
                    <Select defaultValue={lead.status || 'New'} onValueChange={(val) => handleStatusChange(lead.id, val)}>
                      <SelectTrigger className="h-8 text-[10px] font-bold w-[120px] rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {leadStatuses.map(opt => <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="max-w-xs"><p className="text-xs text-zinc-500 truncate">{lead.message}</p></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       {lead.deletedAt ? (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => handleSoftDelete(lead.id, true)}>
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-destructive" onClick={() => handleSoftDelete(lead.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="text-center h-40 text-zinc-400 italic">No business inquiries found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
