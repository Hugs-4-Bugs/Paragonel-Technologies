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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, FileText, ImageIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';

const blogSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  slug: z.string().min(5, 'Slug is required'),
  category: z.string().min(2, 'Category is required'),
  author: z.string().default('QuantumFusion Team'),
  coverImageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  summary: z.string().max(300, 'Summary too long').min(10, 'Short summary is required'),
  body: z.string().min(50, 'Article body is too short'),
  tags: z.string().optional(),
  status: z.string().default('Draft'),
  isPublished: z.boolean().default(false),
});

type BlogFormValues = z.infer<typeof blogSchema>;

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
      coverImageUrl: '',
      summary: '',
      body: '',
      tags: '',
      status: 'Draft',
      isPublished: false,
    },
  });

  const title = form.watch('title');
  useEffect(() => {
    if (title && !form.formState.dirtyFields.slug) {
      form.setValue('slug', title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
    }
  }, [title, form]);

  async function onSubmit(values: BlogFormValues) {
    setIsLoading(true);
    try {
      const blogData = {
        ...values,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        status: values.isPublished ? 'Published' : 'Draft',
        publishedAt: values.isPublished ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'blogPosts'), blogData);
      toast({ title: 'Success', description: 'Article created successfully.' });
      router.push('/admin/blog');
      router.refresh();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create article.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
      <ScrollFadeIn>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/blog"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Write New Article
          </h1>
        </div>
      </ScrollFadeIn>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50">
                  <CardTitle className="text-lg">Main Content</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg">Article Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Exploring the future of AI..." 
                            className="text-xl font-bold h-12" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body Content (Markdown ready)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Start writing your story here..." 
                            className="min-h-[500px] font-mono leading-relaxed p-6" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50">
                  <CardTitle className="text-lg">Post Details</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug (URL Path)</FormLabel>
                        <FormControl>
                          <Input placeholder="future-of-ai" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Input placeholder="AI & ML" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="author"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author Name</FormLabel>
                        <Input {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coverImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image URL</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                               <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                               <Input placeholder="https://..." className="pl-10" {...field} />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50">
                  <CardTitle className="text-lg">SEO & Meta</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt / Meta Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Briefly describe the article..." 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>Max 300 chars. Appears in search results.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (Comma separated)</FormLabel>
                        <Input placeholder="AI, Future, Tech" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-bold">Publish Now</h4>
                  <p className="text-xs text-zinc-500">Enable to make post live on the blog.</p>
                </div>
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-4 border rounded-2xl shadow-xl sticky bottom-6 z-20">
            <Button variant="outline" onClick={() => router.back()} disabled={isLoading} size="lg">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} size="lg" className="min-w-[150px]">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" /> Save Article
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
