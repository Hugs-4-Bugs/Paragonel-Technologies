
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Archive, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Filter,
  Briefcase,
  ExternalLink,
  Power
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminJobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const { data: jobs, loading } = useCollection(query(collection(db, 'jobs'), orderBy('createdAt', 'desc')));
  const { toast } = useToast();

  const handleToggleActive = async (id: string, currentIsActive: boolean) => {
    try {
      await updateDoc(doc(db, 'jobs', id), { 
        isActive: !currentIsActive,
        status: !currentIsActive ? 'Active' : 'Draft',
        updatedAt: new Date().toISOString()
      });
      toast({ title: 'Status Updated', description: `Job is now ${!currentIsActive ? 'Active' : 'Archived'}.` });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update job status.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this job opening? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'jobs', id));
      toast({ title: 'Success', description: 'Job deleted permanently.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete job.', variant: 'destructive' });
    }
  };

  const filteredJobs = jobs?.filter((job: any) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.jobId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || job.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-8">
      <ScrollFadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-primary" />
              Manage Job Openings
            </h1>
            <p className="text-zinc-500">Create and monitor career opportunities.</p>
          </div>
          <Button asChild size="lg">
            <Link href="/admin/jobs/new">
              <Plus className="mr-2 h-5 w-5" /> Create New Job
            </Link>
          </Button>
        </div>
      </ScrollFadeIn>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Search by ID or Title..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            {['All', 'Engineering', 'Design', 'Marketing', 'Operations', 'HR', 'Sales'].map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden border-zinc-200 shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
              <TableRow>
                <TableHead className="font-bold">Job ID</TableHead>
                <TableHead className="font-bold">Position Title</TableHead>
                <TableHead className="font-bold">Department</TableHead>
                <TableHead className="font-bold">Arrangement</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredJobs && filteredJobs.length > 0 ? (
                filteredJobs.map((job: any) => (
                  <TableRow key={job.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <TableCell className="font-mono text-xs font-bold text-primary">{job.jobId}</TableCell>
                    <TableCell className="font-bold">{job.title}</TableCell>
                    <TableCell>{job.department}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.workArrangement}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={job.isActive ? "default" : "secondary"} className="gap-1">
                        {job.isActive ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/jobs/${job.id}/edit`} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => handleToggleActive(job.id, job.isActive)}
                          >
                            <Archive className="mr-2 h-4 w-4" /> {job.isActive ? 'Archive Job' : 'Activate Job'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onClick={() => handleDelete(job.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-zinc-500 italic">
                    No matching job openings found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6 space-y-4">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))
          ) : filteredJobs?.map((job: any) => (
            <div key={job.id} className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-mono text-xs font-bold text-primary">{job.jobId}</p>
                  <h3 className="font-bold text-lg">{job.title}</h3>
                  <p className="text-sm text-zinc-500">{job.department} • {job.workArrangement}</p>
                </div>
                <Badge variant={job.isActive ? "default" : "secondary"}>{job.status}</Badge>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/admin/jobs/${job.id}/edit`}>Edit</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleToggleActive(job.id, job.isActive)}
                >
                  {job.isActive ? 'Archive' : 'Activate'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive"
                  onClick={() => handleDelete(job.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
