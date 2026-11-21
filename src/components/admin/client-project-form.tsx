'use client';

/** Shared create/edit form for client projects (Prompt 05L §2). */
import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ClientProjectFormValues {
  companyName: string; projectTitle: string; slug: string; description: string;
  scope: string; servicesDelivered: string; technologies: string;
  websiteUrl: string; mediaUrls: string; logoUrl: string; iconKey: 'folder' | 'globe' | 'code' | 'server' | 'rocket';
  permissionDisplayName: boolean; permissionDisplayLogo: boolean;
  status: 'draft' | 'published'; displayOrder: number;
}

const EMPTY: ClientProjectFormValues = {
  companyName: '', projectTitle: '', slug: '', description: '', scope: '',
  servicesDelivered: '', technologies: '', websiteUrl: '', mediaUrls: '', logoUrl: '',
  iconKey: 'folder', permissionDisplayName: true, permissionDisplayLogo: false,
  status: 'draft', displayOrder: 0,
};

interface Props {
  initial?: Partial<ClientProjectFormValues>;
  onSubmit: (v: ClientProjectFormValues) => Promise<{ ok: boolean; error?: string }>;
  submitLabel: string;
}

export function ClientProjectForm({ initial, onSubmit, submitLabel }: Props) {
  const [v, setV] = useState<ClientProjectFormValues>({ ...EMPTY, ...initial } as ClientProjectFormValues);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const set = <K extends keyof ClientProjectFormValues>(k: K, val: ClientProjectFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await onSubmit(v);
      if (!res.ok) toast({ title: 'Save failed', description: res.error || 'Try again.', variant: 'destructive' });
      else toast({ title: 'Saved', description: 'Client project saved.' });
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company name *</Label>
          <Input id="companyName" value={v.companyName} onChange={(e) => set('companyName', e.target.value)} required placeholder="e.g. Primorian" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectTitle">Project title *</Label>
          <Input id="projectTitle" value={v.projectTitle} onChange={(e) => set('projectTitle', e.target.value)} required placeholder="e.g. Website build" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input id="slug" value={v.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} required placeholder="e.g. primorian" pattern="[a-z0-9-]+" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="iconKey">Card icon</Label>
          <Select value={v.iconKey} onValueChange={(val) => set('iconKey', val as ClientProjectFormValues['iconKey'])}>
            <SelectTrigger id="iconKey"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="folder">Folder</SelectItem>
              <SelectItem value="globe">Globe (website)</SelectItem>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="server">Server</SelectItem>
              <SelectItem value="rocket">Rocket</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea id="description" value={v.description} onChange={(e) => set('description', e.target.value)} rows={3} required placeholder="Verified project description — no invented scope or metrics." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="scope">Actual scope (optional — leave empty if not yet supplied)</Label>
        <Textarea id="scope" value={v.scope} onChange={(e) => set('scope', e.target.value)} rows={3} placeholder="Founder-supplied scope. Empty until supplied — never invented." />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="servicesDelivered">Services delivered (comma-separated)</Label>
          <Input id="servicesDelivered" value={v.servicesDelivered} onChange={(e) => set('servicesDelivered', e.target.value)} placeholder="e.g. Web design, Frontend development" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="technologies">Technologies (comma-separated)</Label>
          <Input id="technologies" value={v.technologies} onChange={(e) => set('technologies', e.target.value)} placeholder="e.g. Next.js, Tailwind" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website URL (optional)</Label>
          <Input id="websiteUrl" value={v.websiteUrl} onChange={(e) => set('websiteUrl', e.target.value)} placeholder="https://…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL (optional)</Label>
          <Input id="logoUrl" value={v.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://… (only with logo permission)" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mediaUrls">Media URLs (comma-separated, optional)</Label>
        <Input id="mediaUrls" value={v.mediaUrls} onChange={(e) => set('mediaUrls', e.target.value)} placeholder="https://…/screenshot.png, …" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={v.status} onValueChange={(val) => set('status', val as ClientProjectFormValues['status'])}>
            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
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
          <span className="text-sm text-muted-foreground">Permission to display the company name</span>
          <Switch checked={v.permissionDisplayName} onCheckedChange={(c) => set('permissionDisplayName', c)} aria-label="Permission to display company name" />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Permission to display the logo</span>
          <Switch checked={v.permissionDisplayLogo} onCheckedChange={(c) => set('permissionDisplayLogo', c)} aria-label="Permission to display logo" />
        </label>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
