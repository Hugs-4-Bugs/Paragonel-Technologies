'use client';

/** Shared create/edit form for technology-ecosystem entries (Prompt 05L §3). */
import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface TechEcosystemFormValues {
  organizationName: string; category: 'live' | 'dev' | 'evaluated' | 'planned';
  relationshipStatus: string; description: string; evidenceReference: string;
  logoUrl: string; linkUrl: string; publicDisplayPermission: boolean; logoPermission: boolean;
  displayOrder: number; status: 'draft' | 'published';
}

const EMPTY: TechEcosystemFormValues = {
  organizationName: '', category: 'planned', relationshipStatus: '', description: '',
  evidenceReference: '', logoUrl: '', linkUrl: '', publicDisplayPermission: false,
  logoPermission: false, displayOrder: 0, status: 'draft',
};

interface Props {
  initial?: Partial<TechEcosystemFormValues>;
  onSubmit: (v: TechEcosystemFormValues) => Promise<{ ok: boolean; error?: string }>;
  submitLabel: string;
}

export function TechEcosystemForm({ initial, onSubmit, submitLabel }: Props) {
  const [v, setV] = useState<TechEcosystemFormValues>({ ...EMPTY, ...initial } as TechEcosystemFormValues);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const set = <K extends keyof TechEcosystemFormValues>(k: K, val: TechEcosystemFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await onSubmit(v);
      if (!res.ok) toast({ title: 'Save failed', description: res.error || 'Try again.', variant: 'destructive' });
      else toast({ title: 'Saved', description: 'Ecosystem entry saved.' });
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="organizationName">Organization name *</Label>
          <Input id="organizationName" value={v.organizationName} onChange={(e) => set('organizationName', e.target.value)} required placeholder="e.g. OpenAI" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={v.category} onValueChange={(val) => set('category', val as TechEcosystemFormValues['category'])}>
            <SelectTrigger id="category"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="live">Live / production</SelectItem>
              <SelectItem value="dev">In development</SelectItem>
              <SelectItem value="evaluated">Evaluated</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="relationshipStatus">Relationship status *</Label>
        <Input id="relationshipStatus" value={v.relationshipStatus} onChange={(e) => set('relationshipStatus', e.target.value)} required placeholder="e.g. User-provided API key" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea id="description" value={v.description} onChange={(e) => set('description', e.target.value)} rows={3} required placeholder="What this integration is + its real status today." />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="evidenceReference">Evidence / reference (optional)</Label>
          <Input id="evidenceReference" value={v.evidenceReference} onChange={(e) => set('evidenceReference', e.target.value)} placeholder="e.g. AcquisitionOS integration map" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkUrl">Integration / link URL (optional)</Label>
          <Input id="linkUrl" value={v.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} placeholder="https://…" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL (optional)</Label>
        <Input id="logoUrl" value={v.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://… (only with logo permission)" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={v.status} onValueChange={(val) => set('status', val as TechEcosystemFormValues['status'])}>
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
        <p className="text-sm font-semibold text-foreground">Permissions</p>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Public display permission</span>
          <Switch checked={v.publicDisplayPermission} onCheckedChange={(c) => set('publicDisplayPermission', c)} aria-label="Public display permission" />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Logo display permission</span>
          <Switch checked={v.logoPermission} onCheckedChange={(c) => set('logoPermission', c)} aria-label="Logo display permission" />
        </label>
        <p className="text-xs text-muted-foreground">Do not add exploratory vendor discussions (Broadchat, VoiceLink, etc.) as confirmed partners without evidence + permission.</p>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
