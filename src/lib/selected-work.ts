/**
 * selected-work.ts — the SINGLE source of truth for Paragonel's verified
 * public project inventory (Prompt 05D §4/§5, extended in 05K §2.3).
 *
 * Six entries — three proprietary products + three founder-confirmed direct
 * client engagements (Prompt 05K §1.1):
 *   - AcquisitionOS : Private Beta   (flagship product, NOT GA)
 *   - CodeGuard AI  : Published      (VS Code Marketplace; URL omitted — the
 *                     previously-cached URL did not resolve when re-checked)
 *   - SystemFoundry : Internal       (internal tool, NOT a commercial product)
 *   - Maa Arogyam   : Delivered      (client website engagement — no metric)
 *   - Primorian     : Delivered      (founder-confirmed end-to-end website
 *                     delivery; exact public brand spelling — "Primorian" /
 *                     "Primorian Life" — to be finalised with the founder)
 *   - DietMended    : Client engagement (founder-confirmed direct engagement;
 *                     exact spelling/capitalisation to be finalised with the
 *                     founder; specific deliverable NOT published without
 *                     founder-supplied scope)
 *
 * No fabricated projects (TechCorp / EduFuture / SkillUp / Remote Team
 * Collaboration Suite are REMOVED). Primoreon is excluded. Quantum AI is NOT
 * merged into Paragonel. DietMended + Primorian are INCLUDED per the founder's
 * explicit 05K confirmation of direct client relationships — direct offline
 * engagements do not necessarily produce email records (05K §1.1).
 *
 * This module is imported by:
 *   - src/components/sections/selected-work-section.tsx  (homepage / Selected
 *     Work surface, /portfolio, /testimonials)
 *   - src/components/home/products.tsx                   (homepage work index)
 *
 * Both surfaces render the SAME verified data + status labels — no duplicate,
 * conflicting arrays. Adding/changing a project here updates every public
 * surface at once.
 *
 * Status labels are honest: no outcome metric, testimonial, or endorsement is
 * claimed without a measured/approved source.
 */
import type { LucideIcon } from 'lucide-react';
import { Rocket, Code2, Server } from 'lucide-react';

export type WorkStatusTone = 'beta' | 'live' | 'internal' | 'client';

export interface WorkEntry {
  /** Stable slug, also used as React key + anchor id. */
  slug: string;
  icon: LucideIcon;
  /** Project name. */
  title: string;
  /** Verified project type / kind line. */
  kind: string;
  /** Honest status label rendered verbatim. */
  status: string;
  statusTone: WorkStatusTone;
  /** Factual description — no metric, quote, or endorsement without evidence. */
  body: string;
  /** Approved internal route or external URL. Omitted when none is approved. */
  href?: string;
  /** CTA label (kept meaningful — never the raw URL). */
  ctaLabel?: string;
  /** Marks the flagship entry (AcquisitionOS) for featured layouts. */
  flagship?: boolean;
}

export const SELECTED_WORK: WorkEntry[] = [
  {
    slug: 'acquisitionos',
    icon: Rocket,
    title: 'AcquisitionOS',
    kind: 'Flagship product · AI-native client acquisition platform',
    status: 'Private Beta',
    statusTone: 'beta',
    body:
      'Paragonel\'s own AI-powered Client Acquisition Operating System — a connected workflow from prospect discovery to deal closure, built on a human-in-the-loop, anti-hallucination architecture. Currently in private beta, with real-user feedback driving product refinement. Listed here as a product we engineered and operate; no outcome metric is claimed without a measured source.',
    href: '/our-product/acquisitionos',
    ctaLabel: 'Explore AcquisitionOS',
    flagship: true,
  },
  {
    slug: 'codeguard-ai',
    icon: Code2,
    title: 'CodeGuard AI',
    kind: 'Developer tool · VS Code extension',
    status: 'Published',
    statusTone: 'live',
    body:
      'A VS Code extension that identifies potentially expensive AWS infrastructure choices in Terraform and provides cost-intelligence guidance to developers, inside the editor. Published on the VS Code Marketplace. Listed factually as a shipped developer tool; adoption, downloads, revenue, or customer outcomes are not claimed without evidence.',
    href: '/our-product/codeguard-ai',
    ctaLabel: 'Explore CodeGuard AI',
  },
  {
    slug: 'systemfoundry',
    icon: Server,
    title: 'SystemFoundry',
    kind: 'Internal tool · Infrastructure simulator',
    status: 'Internal',
    statusTone: 'internal',
    body:
      'An internal cloud architecture and infrastructure simulation tool Paragonel uses for its own engineering scenarios — scenario modelling for platform and reliability decisions. Honestly labelled as an internal tool, not a commercial product or customer deployment.',
    href: '/our-product/systemfoundry',
    ctaLabel: 'Explore SystemFoundry',
  },
];

/**
 * Non-flagship entries (used by the homepage compact work index). Client
 * engagements are NO LONGER in this static array — they are managed via the
 * Client Projects CMS (Prompt 05L §2) and merged into the public surfaces by
 * SelectedWorkSection + HomeProducts via mapClientProjectToWorkEntry.
 */
export const OTHER_WORK: WorkEntry[] = SELECTED_WORK.filter((w) => !w.flagship);
