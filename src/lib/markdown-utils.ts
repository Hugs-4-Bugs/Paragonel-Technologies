/**
 * stripMarkdown — collapse Markdown to a single-line plain-text preview for
 * clamped UI (e.g. product card `line-clamp-4`). Removes `**`, `*`, `_`,
 * heading hashes, list markers, and link syntax, keeping only the readable
 * text. Pure string logic, server-safe (no React, no "use client") so it can
 * be called from Server Components.
 *
 * Used so card previews never show raw `**The Problem:**` markers (Phase 1 §9).
 */
export function stripMarkdown(input: string): string {
  return (input ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
