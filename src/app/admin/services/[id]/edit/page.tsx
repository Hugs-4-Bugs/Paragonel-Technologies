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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const serviceSchema = z.object({
  title: z.string().min(2, 'Service title is required'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  iconName: z.string().min(2, 'Icon name is required (e.g. Brain, Cloud)'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  order: z.coerce.number().int().min(0, 'Order must be 0 or higher'),
  isActive: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function EditServicePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      iconName: 'Brain',
      imageUrl: '',
      order: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/services/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const s = data.service;
        if (!s) throw new Error();
        form.reset({
          title: s.title ?? '',
          slug: s.slug ?? '',
          description: s.description ?? '',
          iconName: s.iconName ?? 'Brain',
          imageUrl: s.imageUrl ?? '',
          order: typeof s.order === 'number' ? s.order : 0,
          isActive: s.isActive !== false,
        });
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load service. It may have been deleted.',
          variant: 'destructive',
        });
        router.push('/admin/services');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSubmit(values: ServiceFormValues) {
    if (!id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update service');
      }
      toast({ title: 'Service Updated', description: `${values.title} saved.` });
      router.push('/admin/services');
      router.refresh();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to update service.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-10 max-w-3xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-3xl">
      <ScrollFadeIn>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 rounded-full font-bold">
              <Link href="/admin/services"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Services</Link>
            </Button>
            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
              <Layers className="h-9 w-9 text-primary" /> Edit Service
            </h1>
          </div>
        </div>
      </ScrollFadeIn>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="rounded-3xl border-zinc-200 shadow-xl bg-white">
            <CardHeader className="border-b border-zinc-100">
              <CardTitle className="text-xl font-black">Service details</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>URL: /services/{field.value || 'slug'}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="iconName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display order</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} value={field.value ?? 0} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-zinc-200 p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>Visible on the public Services page.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button asChild variant="ghost" type="button" className="rounded-2xl font-bold">
              <Link href="/admin/services">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSaving} className="h-12 px-8 rounded-2xl font-bold shadow-lg">
              {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
