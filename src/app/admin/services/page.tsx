
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Layers,
  ArrowRight,
  Eye
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
import { collection, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function AdminServicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: services, loading } = useCollection(query(collection(db, 'services'), orderBy('order', 'asc')));
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await deleteDoc(doc(db, 'services', id));
      toast({ title: 'Success', description: 'Service removed successfully.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete service.', variant: 'destructive' });
    }
  };

  const filteredServices = services?.filter((s: any) => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <ScrollFadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
              <Layers className="h-10 w-10 text-primary" />
              Core Services
            </h1>
            <p className="text-zinc-500 font-medium">Manage your service offerings and landing pages.</p>
          </div>
          <Button asChild size="lg" className="h-14 px-8 rounded-2xl font-bold shadow-2xl shadow-primary/20">
            <Link href="/admin/services/new">
              <Plus className="mr-2 h-6 w-6" /> Add New Service
            </Link>
          </Button>
        </div>
      </ScrollFadeIn>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input 
            placeholder="Filter services..." 
            className="pl-12 h-14 rounded-2xl border-zinc-200 bg-white shadow-sm font-medium" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden border-zinc-200 shadow-xl rounded-3xl bg-white">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow className="hover:bg-transparent border-b border-zinc-100">
              <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[10px] px-8 py-6">Order</TableHead>
              <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[10px]">Service Title</TableHead>
              <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[10px]">Slug</TableHead>
              <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[10px]">Status</TableHead>
              <TableHead className="text-right font-black text-zinc-400 uppercase tracking-widest text-[10px] px-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i} className="border-b border-zinc-50">
                  <TableCell className="px-8"><Skeleton className="h-5 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right px-8"><Skeleton className="h-10 w-10 ml-auto rounded-xl" /></TableCell>
                </TableRow>
              ))
            ) : filteredServices && filteredServices.length > 0 ? (
              filteredServices.map((service: any) => (
                <TableRow key={service.id} className="group hover:bg-zinc-50/50 border-b border-zinc-50 transition-colors">
                  <TableCell className="px-8 font-black text-primary">{service.order || '-'}</TableCell>
                  <TableCell className="font-black text-lg">{service.title}</TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500">/{service.slug}</TableCell>
                  <TableCell>
                    <Badge variant={service.isActive !== false ? "default" : "secondary"} className="rounded-lg px-3 py-1 font-bold">
                      {service.isActive !== false ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-8">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-zinc-100 transition-colors"><MoreVertical className="h-5 w-5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-2xl border-zinc-100">
                        <DropdownMenuItem asChild className="rounded-xl font-bold h-11">
                          <Link href={`/services/${service.slug}`} target="_blank"><Eye className="mr-3 h-4 w-4 text-zinc-400" /> View Public</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl font-bold h-11">
                          <Link href={`/admin/services/${service.id}/edit`}><Edit className="mr-3 h-4 w-4 text-zinc-400" /> Edit Content</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-2" />
                        <DropdownMenuItem onClick={() => handleDelete(service.id)} className="rounded-xl font-bold h-11 text-destructive focus:text-destructive focus:bg-destructive/5">
                          <Trash2 className="mr-3 h-4 w-4" /> Delete Service
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-60 text-center text-zinc-400 font-bold italic bg-zinc-50/20">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-5" />
                  No services found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
