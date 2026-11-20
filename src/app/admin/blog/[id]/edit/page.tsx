
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, BookOpen, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import Link from 'next/link';

const blogSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  slug: z.string().min(5, 'Slug is required'),
  category: z.string().min(2, 'Category is required'),
  author: z.string().default('Paragonel Team'),
  thumbnailUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  excerpt: z.string().max(300, 'Excerpt too long').min(10, 'Excerpt is required'),
  body: z.string().min(50, 'Body content is required'),
  tags: z.string().optional(),
  status: z.string().default('Published'),
});

type BlogFormValues = z.infer<typeof blogSchema>;

export default function EditBlogPage() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Phase 4 IU-0 slice 2: load via JWT-verified server route (Admin SDK),
        // since draft posts are no longer readable by the client SDK.
        const res = await fetch(`/api/admin/blog/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const p = data.post;
        if (p) {
          form.reset({
            title: p.title,
            slug: p.slug,
            category: p.category,
            author: p.author,
            thumbnailUrl: p.thumbnailUrl || '',
            excerpt: p.excerpt,
            body: p.body,
            tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
            status: p.status,
          });
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load article.', variant: 'destructive' });
      } finally {
        setIsFetching(false);
      }
    };
    fetchPost();
  }, [id, form, toast]);

  async function onSubmit(values: BlogFormValues) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.issues?.join('; ') || data?.error || 'Update failed.');
      }
      toast({ title: 'Success', description: 'Article updated successfully.' });
      router.push('/admin/blog');
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to update article.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return <div className="h-80 flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
      <ScrollFadeIn>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild><Link href="/admin/blog"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Article</h1>
        </div>
      </ScrollFadeIn>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="shadow-sm border-zinc-200">
                <CardHeader className="bg-zinc-50/50 border-b"><CardTitle className="text-lg">Content</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-6">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} className="text-lg font-bold h-12" /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="body" render={({ field }) => (
                    <FormItem><FormLabel>Body</FormLabel><FormControl><Textarea className="min-h-[500px] font-mono" {...field} /></FormControl></FormItem>
                  )} />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-8">
               <Card className="shadow-sm border-zinc-200">
                <CardHeader className="bg-zinc-50/50 border-b"><CardTitle className="text-lg">Details</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-6">
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem><FormLabel>Slug</FormLabel><Input {...field} /></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel><Input {...field} /></FormItem>
                  )} />
                   <FormField control={form.control} name="thumbnailUrl" render={({ field }) => (
                    <FormItem><FormLabel>Thumbnail URL</FormLabel><Input {...field} /></FormItem>
                  )} />
                   <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </CardContent>
               </Card>
            </div>
          </div>
          <div className="flex justify-end gap-4 sticky bottom-6 z-10 bg-white/80 backdrop-blur-md p-4 rounded-2xl border shadow-xl">
             <Button variant="outline" onClick={() => router.back()} disabled={isLoading} size="lg">Cancel</Button>
             <Button type="submit" disabled={isLoading} size="lg" className="min-w-[160px]">
                {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="mr-2 h-5 w-5" />} Save Changes
             </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
