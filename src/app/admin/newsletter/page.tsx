
"use client";

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Download, Trash2, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function NewsletterPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const firestore = useFirestore();
  const { toast } = useToast();

  const subsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'newsletterSubscribers'), orderBy('subscribedAt', 'desc'));
  }, [firestore]);

  const { data: subscribers, loading } = useCollection(subsQuery);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'newsletterSubscribers', id));
      toast({ title: "Subscriber Removed" });
    } catch (e) {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  const handleExportCSV = () => {
    if (!subscribers) return;
    const headers = ["Email", "Source", "Subscribed At"];
    const rows = subscribers.map((s: any) => [
      s.email, 
      s.source || 'Footer', 
      s.subscribedAt?.seconds ? new Date(s.subscribedAt.seconds * 1000).toISOString() : ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "newsletter_subscribers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubs = subscribers?.filter((s: any) => s.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Newsletter Subscribers
          </h1>
          <p className="text-zinc-500">Manage your mailing list and campaign reach.</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="rounded-xl font-bold border-primary/20 text-primary">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Filter emails..." 
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
              <TableHead className="font-bold">Email Address</TableHead>
              <TableHead className="font-bold">Acquisition Source</TableHead>
              <TableHead className="font-bold">Joined Date</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
            ) : filteredSubs && filteredSubs.length > 0 ? (
              filteredSubs.map((sub: any) => (
                <TableRow key={sub.id} className="hover:bg-zinc-50/50">
                  <TableCell className="font-bold text-sm">{sub.email}</TableCell>
                  <TableCell className="text-xs font-medium text-zinc-500 uppercase">{sub.source || 'Website Footer'}</TableCell>
                  <TableCell className="text-xs text-zinc-400">
                    {sub.subscribedAt?.seconds ? new Date(sub.subscribedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-destructive" onClick={() => handleDelete(sub.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} className="text-center h-40 text-zinc-400">No subscribers yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
