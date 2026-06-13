"use client";

import React, { useState } from 'react';
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
  BookOpen
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
import Image from 'next/image';

export default function AdminBlogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: posts, loading } = useCollection(query(collection(db, 'blogPosts'), orderBy('createdAt', 'desc')));
  const { toast } = useToast();

  const handleTogglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await updateDoc(doc(db, 'blogPosts', id), { 
        status: newStatus ? 'Published' : 'Draft',
        isPublished: newStatus,
        publishedAt: newStatus ? new Date().toISOString() : null
      });
      toast({ title: 'Success', description: `Post ${newStatus ? 'published' : 'moved to drafts'} successfully.` });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update post status.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this blog post?')) return;
    try {
      await deleteDoc(doc(db, 'blogPosts', id));
      toast({ title: 'Success', description: 'Post deleted permanently.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to delete post.', variant: 'destructive' });
    }
  };

  const filteredPosts = posts?.filter((post: any) => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <ScrollFadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              Manage Blog Content
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Publish insights, news, and company updates.
            </p>
          </div>
          <Button asChild size="lg" className="shadow-md">
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

      <div className="bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
            <TableRow>
              <TableHead className="font-bold">Cover</TableHead>
              <TableHead className="font-bold">Article Title</TableHead>
              <TableHead className="font-bold">Category</TableHead>
              <TableHead className="font-bold">Author</TableHead>
              <TableHead className="font-bold">Status</TableHead>
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
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredPosts && filteredPosts.length > 0 ? (
              filteredPosts.map((post: any) => (
                <TableRow key={post.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                  <TableCell>
                    <div className="relative h-10 w-16 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 border">
                      {post.coverImageUrl ? (
                        <Image 
                          src={post.coverImageUrl} 
                          alt="" 
                          fill 
                          className="object-cover" 
                          unoptimized 
                        />
                      ) : (
                        <FileText className="h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold max-w-xs truncate">{post.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{post.category}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-500 text-sm">{post.author}</TableCell>
                  <TableCell>
                    <Badge variant={post.status === 'Published' ? "default" : "secondary"} className="gap-1">
                      {post.status === 'Published' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild>
                          <Link href={`/blog/${post.slug}`} target="_blank" className="flex items-center cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" /> View Public Site
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/blog/${post.id}/edit`} className="flex items-center cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" /> Edit Content
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center cursor-pointer"
                          onClick={() => handleTogglePublished(post.id, post.status === 'Published')}
                        >
                          {post.status === 'Published' ? (
                            <><Clock className="mr-2 h-4 w-4" /> Move to Drafts</>
                          ) : (
                            <><CheckCircle2 className="mr-2 h-4 w-4" /> Publish Now</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="flex items-center cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-zinc-500 italic">
                  No blog articles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
