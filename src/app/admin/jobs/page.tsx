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
  Briefcase
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
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminJobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: jobs, loading } = useCollection(query(collection(db, 'jobs'), orderBy('createdAt', 'desc')));
  const { toast } = useToast();

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'jobs', id), { 
        isActive: !currentStatus,
        status: !currentStatus ? 'Active' : 'Draft'
      });
      toast({ title: 'Success', description: `Job ${!currentStatus ? 'activated' : 'archived'} successfully.` });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update job status.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this job opening?')) return;
    try {
      await deleteDoc(doc(db, 'jobs', id));
      toast({ title: 'Success', description: 'Job deleted permanently.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete job.', variant: 'destructive' });
    }
  };

  const filteredJobs = jobs?.filter((job: any) => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <ScrollFadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-primary" />
              Manage Job Openings
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Create, edit, and monitor career opportunities.
            </p>
          </div>
          <Button asChild size="lg" className="shadow-md">
            <Link href="/admin/jobs/new">
              <Plus className="mr-2 h-5 w-5" /> New Job Opening
            </Link>
          </Button>
        </div>
      </ScrollFadeIn>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Search by title or department..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> Filters
        </Button>
      </div>

      <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
            <TableRow>
              <TableHead className="font-bold">Position Title</TableHead>
              <TableHead className="font-bold">Department</TableHead>
              <TableHead className="font-bold">Location</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Posted Date</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredJobs && filteredJobs.length > 0 ? (
              filteredJobs.map((job: any) => (
                <TableRow key={job.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                  <TableCell className="font-bold">{job.title}</TableCell>
                  <TableCell>{job.department}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>
                    <Badge variant={job.isActive ? "default" : "secondary"} className="gap-1 px-2 py-0.5">
                      {job.isActive ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {job.isActive ? 'Active' : 'Archived'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-500 text-sm">
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
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
                          <Link href={`/admin/jobs/${job.id}/edit`} className="flex items-center cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" /> Edit Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center cursor-pointer"
                          onClick={() => handleToggleActive(job.id, job.isActive)}
                        >
                          <Archive className="mr-2 h-4 w-4" /> {job.isActive ? 'Archive Role' : 'Activate Role'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="flex items-center cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
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
                  No job openings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
