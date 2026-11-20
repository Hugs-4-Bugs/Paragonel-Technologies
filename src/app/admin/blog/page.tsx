"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  FileText,
  Eye,
  BookOpen,
  Image as ImageIcon
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
import { useToast } from '@/hooks/use-toast';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Card } from '@/components/ui/card';

export default function AdminBlogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Phase 4 IU-0 slice 2: blogPosts are locked to public writes, so the admin
  // list fetches server-side via /api/admin/blog (Admin SDK).
  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/blog', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data.posts);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleTogglePublished = async (id: string, currentStatus: string) => {
    const newStatus: 'Draft' | 'Published' = currentStatus === 'Published' ? 'Draft' : 'Published';
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Status Updated', description: `Article is now ${newStatus}.` });
      loadPosts();
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update article status.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this article?')) return;
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: 'Success', description: 'Article deleted permanently.' });
      loadPosts();
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete article.', variant: 'destructive' });
    }
  };

  const filteredPosts = posts?.filter((post: any) => 
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <ScrollFadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              Manage Insights
            </h1>
            <p className="text-zinc-500">Publish news, trends, and company updates.</p>
          </div>
          <Button asChild size="lg">
            <Link href="/admin/blog/new">
              <Plus className="mr-2 h-5 w-5" /> Write New Article
            </Link>
          </Button>
        </div>
      </ScrollFadeIn>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Search articles..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden border-zinc-200 shadow-sm">
        <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-zinc-50">
              <TableRow>
                <TableHead className="font-bold">Cover</TableHead>
                <TableHead className="font-bold">Title</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-16 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredPosts && filteredPosts.length > 0 ? (
                filteredPosts.map((post: any) => (
                  <TableRow key={post.id} className="group hover:bg-zinc-50">
                    <TableCell>
                      <div className="relative h-10 w-16 rounded-md overflow-hidden bg-zinc-100 border">
                        {post.thumbnailUrl ? (
                          <Image src={post.thumbnailUrl} alt="" fill className="object-cover" unoptimized />
                        ) : (
                          <ImageIcon className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold max-w-xs truncate">{post.title}</TableCell>
                    <TableCell><Badge variant="outline">{post.category}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'Published' ? "default" : "secondary"}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-xs">
                      {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem asChild>
                            <Link href={`/blog/${post.slug}`} target="_blank" className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Public
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/blog/${post.id}/edit`} className="cursor-pointer">
                              <Edit className="mr-2 h-4 w-4" /> Edit Content
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublished(post.id, post.status)} className="cursor-pointer">
                            {post.status === 'Published' ? <Clock className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            {post.status === 'Published' ? 'Move to Drafts' : 'Publish Now'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-zinc-500 italic">No articles found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y">
           {filteredPosts?.map((post: any) => (
             <div key={post.id} className="p-6 space-y-4">
               <div className="flex gap-4">
                  <div className="relative h-12 w-20 rounded-md overflow-hidden bg-zinc-100 border flex-shrink-0">
                    {post.thumbnailUrl && <Image src={post.thumbnailUrl} alt="" fill className="object-cover" unoptimized />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{post.title}</h3>
                    <p className="text-xs text-zinc-500">{post.category} • {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1"><Link href={`/admin/blog/${post.id}/edit`}>Edit</Link></Button>
                  <Button asChild variant="ghost" size="sm" className="flex-1"><Link href={`/blog/${post.slug}`} target="_blank">View</Link></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
               </div>
             </div>
           ))}
        </div>
      </Card>
    </div>
  );
}