'use client';

/**
 * TestimonialForm — shared create/edit form for the testimonials CMS
 * (Prompt 05K §11.1). Used by /admin/testimonials/new and
 * /admin/testimonials/[id]/edit. All fields from the testimonial Zod schema
 * are editable; the parent supplies initial values (for edit) + an onSubmit
 * handler that POSTs/PUTs to /api/admin/testimonials.
 */
import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface TestimonialFormValues {
  companyName: string;
  originalQuote: string;
  approvedQuote: string;
  clientName: string;
  designation: string;
  logoUrl: string;
  projectRef: string;
  permissionDisplayFeedback: boolean;
  permissionDisplayName: boolean;
  permissionDisplayLogo: boolean;
  status: 'draft' | 'pending' | 'published';
  displayOrder: number;
}

const EMPTY: TestimonialFormValues = {
  companyName: '',
  originalQuote: '',
  approvedQuote: '',
  clientName: '',
  designation: '',
  logoUrl: '',
  projectRef: '',
  permissionDisplayFeedback: false,
  permissionDisplayName: false,
  permissionDisplayLogo: false,
  status: 'draft',
  displayOrder: 0,
};

interface Props {
  initial?: Partial<TestimonialFormValues>;
  onSubmit: (values: TestimonialFormValues) => Promise<{ ok: boolean; error?: string }>;
  submitLabel: string;
}

export function TestimonialForm({ initial, onSubmit, submitLabel }: Props) {
  const [v, setV] = useState<TestimonialFormValues>({ ...EMPTY, ...initial } as TestimonialFormValues);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const set = <K extends keyof TestimonialFormValues>(k: K, val: TestimonialFormValues[K]) =>
    setV((prev) => ({ ...prev, [k]: val }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await onSubmit(v);
      if (!res.ok) {
        toast({ title: 'Save failed', description: res.error || 'Try again.', variant: 'destructive' });
      } else {
        toast({ title: 'Saved', description: 'Testimonial saved.' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company name *</Label>
        <Input id="companyName" value={v.companyName} onChange={(e) => set('companyName', e.target.value)} required placeholder="e.g. Primorian" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="originalQuote">Original client feedback</Label>
        <Textarea id="originalQuote" value={v.originalQuote} onChange={(e) => set('originalQuote', e.target.value)} rows={4} placeholder="Paste the client's exact feedback. Leave empty until the client has supplied it — never invent feedback." />
        <p className="text-xs text-muted-foreground">The raw client feedback. Published only when status is published + display-permission granted.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="approvedQuote">Approved public version (optional edit)</Label>
        <Textarea id="approvedQuote" value={v.approvedQuote} onChange={(e) => set('approvedQuote', e.target.value)} rows={3} placeholder="Optional grammar/readability edit that preserves meaning. If empty, the original is shown." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientName">Client name (optional)</Label>
          <Input id="clientName" value={v.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="Optional — only shown if name permission is on" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="designation">Designation (optional)</Label>
          <Input id="designation" value={v.designation} onChange={(e) => set('designation', e.target.value)} placeholder="e.g. Founder, CTO" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="projectRef">Project reference (optional)</Label>
          <Input id="projectRef" value={v.projectRef} onChange={(e) => set('projectRef', e.target.value)} placeholder="selected-work slug, e.g. primorian" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL (optional)</Label>
          <Input id="logoUrl" value={v.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://… (only with logo permission)" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={v.status} onValueChange={(val) => set('status', val as TestimonialFormValues['status'])}>
            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending approval</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayOrder">Display order</Label>
          <Input id="displayOrder" type="number" min={0} value={v.displayOrder} onChange={(e) => set('displayOrder', Number(e.target.value) || 0)} />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border p-4 bg-secondary/20">
        <p className="text-sm font-semibold text-foreground">Display permissions</p>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Permission to display the feedback</span>
          <Switch checked={v.permissionDisplayFeedback} onCheckedChange={(c) => set('permissionDisplayFeedback', c)} aria-label="Permission to display feedback" />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Permission to display the company name</span>
          <Switch checked={v.permissionDisplayName} onCheckedChange={(c) => set('permissionDisplayName', c)} aria-label="Permission to display company name" />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Permission to display the logo</span>
          <Switch checked={v.permissionDisplayLogo} onCheckedChange={(c) => set('permissionDisplayLogo', c)} aria-label="Permission to display logo" />
        </label>
        <p className="text-xs text-muted-foreground">A testimonial renders publicly only when status is Published AND feedback display-permission is on AND a non-empty quote exists.</p>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
