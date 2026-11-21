/**
 * client-project-mapper.ts — maps a published client-project CMS doc to the
 * WorkEntry shape consumed by SelectedWorkSection + HomeProducts (Prompt 05L §2).
 *
 * Pure function (no React/client-server constraint) so both the server
 * SelectedWorkSection and the client HomeProducts can share it. The iconKey
 * stored in the CMS maps to a Lucide icon so client-project cards render with a
 * real product/engagement icon rather than a placeholder.
 */
import { FolderGit2, Globe, Code2, Server, Rocket, type LucideIcon } from 'lucide-react';
import type { WorkEntry } from '@/lib/selected-work';

const ICON_MAP: Record<string, LucideIcon> = {
  folder: FolderGit2,
  globe: Globe,
  code: Code2,
  server: Server,
  rocket: Rocket,
};

export interface ClientProjectDoc {
  id?: string;
  slug?: string;
  companyName?: string;
  projectTitle?: string;
  description?: string;
  websiteUrl?: string;
  iconKey?: string;
  permissionDisplayName?: boolean;
  displayOrder?: number;
  [k: string]: unknown;
}

export function mapClientProjectToWorkEntry(p: ClientProjectDoc): WorkEntry {
  const showCompany = p.permissionDisplayName !== false;
  const title = showCompany ? (p.companyName || 'Client engagement') : (p.projectTitle || 'Client engagement');
  const href = p.websiteUrl && typeof p.websiteUrl === 'string' && p.websiteUrl.trim() ? p.websiteUrl.trim() : '/contact';
  const ctaLabel = href.startsWith('http') ? 'Visit site' : 'Start a conversation';
  return {
    slug: p.slug || p.id || `cp-${Math.random().toString(36).slice(2, 8)}`,
    icon: ICON_MAP[p.iconKey ?? 'folder'] ?? FolderGit2,
    title,
    kind: p.projectTitle || 'Client engagement',
    status: 'Delivered',
    statusTone: 'client',
    body: p.description || '',
    href,
    ctaLabel,
    flagship: false,
  };
}
