
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Save, BookOpen, ImageIcon, Search, Clock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import Link from 'next/link';
import { logActivity } from '@/lib/audit';
import { cn } from '@/lib/utils';

const blogSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  slug: z.string().min(5, 'Slug is required'),
  category: z.string().min(2, 'Category is required'),
  author: z.string().default('QuantumFusion Team'),
  thumbnailUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  excerpt: z.string().max(300, 'Excerpt too long').min(10, 'Excerpt is required'),
  body: z.string().min(50, 'Body content is required'),
  tags: z.string().optional(),
  status: z.string().default('Draft'),
  metaTitle: z.string().max(60, 'Keep SEO title under 60 chars').optional(),
  metaDescription: z.string().max(160, 'Keep SEO description under 160 chars').optional(),
  focusKeyword: z.string().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  publishAt: z.string().optional(),
});

type BlogFormValues = z.infer<typeof blogSchema>;

const AUTOSAVE_KEY = 'qf_blog_autosave';

export default function NewBlogPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: '',
      slug: '',
      category: 'Technology',
      author: 'QuantumFusion Team',
      thumbnailUrl: '',
      excerpt: '',
      body: '',
      tags: '',
      status: 'Draft',
      metaTitle: '',
      metaDescription: '',
      focusKeyword: '',
      publishAt: '',
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (confirm("Restore your unsaved progress from " + new Date(parsed.timestamp).toLocaleTimeString() + "?")) {
          form.reset(parsed.data);
        } else {
          localStorage.removeItem(AUTOSAVE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    }
  }, [form]);

  useEffect(() => {
    const interval = setInterval(() => {
      const data = form.getValues();
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    }, 30000);
    return () => clearInterval(interval);
  }, [form]);

  const title = form.watch('title');
  useEffect(() => {
    if (title && !form.formState.dirtyFields.slug) {
      form.setValue('slug', title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
    }
  }, [title, form]);

  async function onSubmit(values: BlogFormValues) {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      if (!db) throw new Error("Database not initialized");

      const blogData = {
        ...values,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        publishedAt: values.status === 'Published' ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      const docRef = await addDoc(collection(db, 'blogPosts'), blogData);
      await logActivity('admin', `Created blog post: ${values.title}`, 'BlogPost', docRef.id);
      
      localStorage.removeItem(AUTOSAVE_KEY);
      toast({ title: 'Success', description: 'Article created and published.' });
      router.push('/admin/blog');
    } catch (error: any) {
      console.error("Save Article Error:", error);
      toast({ 
        title: 'Save Failed', 
        description: error.message || 'Check your connection and try again.', 
        variant: 'destructive' 
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20">
      <ScrollFadeIn>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/blog"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            New Editorial Insight
          </h1>
        </div>
      </ScrollFadeIn>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card className="shadow-sm border-zinc-200">
                <CardHeader className="bg-zinc-50/50 border-b">
                  <CardTitle className="text-lg">Main Content</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Article Title</FormLabel>
                      <FormControl><Input placeholder="Exploring the Future..." {...field} className="text-xl font-bold h-12" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="body" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Content (Markdown Supported)</FormLabel>
                      <FormControl><Textarea placeholder="Start writing here..." className="min-h-[500px] font-mono leading-relaxed" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card className="shadow-sm border-zinc-200">
                <CardHeader className="bg-zinc-50/50 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    SEO Management
                  </CardTitle>
                  <CardDescription>Optimize visibility on Google and social media.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="metaTitle" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex justify-between">Meta Title <span className={cn("text-[10px]", (field.value?.length || 0) > 60 ? "text-red-500" : "text-green-500")}>{field.value?.length || 0}/60</span></FormLabel>
                        <FormControl><Input placeholder="SEO Title..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="focusKeyword" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Focus Keyword</FormLabel>
                        <FormControl><Input placeholder="e.g., AI Solutions" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="metaDescription" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">Meta Description <span className={cn("text-[10px]", (field.value?.length || 0) > 160 ? "text-red-500" : "text-green-500")}>{field.value?.length || 0}/160</span></FormLabel>
                      <FormControl><Textarea placeholder="Brief summary for search results..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <Card className="shadow-sm border-zinc-200 bg-zinc-50/30">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">Publishing</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                   <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Draft">Draft (Internal)</SelectItem>
                          <SelectItem value="Published">Publish Immediately</SelectItem>
                          <SelectItem value="Scheduled">Schedule Release</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {form.watch('status') === 'Scheduled' && (
                    <FormField control={form.control} name="publishAt" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4" /> Publication Date</FormLabel>
                        <FormControl><Input type="datetime-local" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-zinc-200">
                <CardHeader className="bg-zinc-50/50 border-b">
                  <CardTitle className="text-lg">Categorization</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Input placeholder="AI & ML" {...field} />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="thumbnailUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail Image URL</FormLabel>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input placeholder="https://..." className="pl-10" {...field} />
                      </div>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card className="shadow-sm border-zinc-200">
                <CardHeader className="bg-zinc-50/50 border-b">
                  <CardTitle className="text-lg">Short Snippet</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <FormField control={form.control} name="excerpt" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Public Excerpt</FormLabel>
                      <FormControl><Textarea placeholder="Max 300 chars..." className="min-h-[100px]" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 sticky bottom-6 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-4 rounded-2xl border shadow-xl">
             <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading} size="lg">Cancel</Button>
             <Button type="submit" disabled={isLoading} size="lg" className="min-w-[160px] font-bold">
                {isLoading ? <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Saving...</> : <><Save className="mr-2 h-5 w-5" /> Save Article</>}
             </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
