"use client";

/**
 * Markdown — a small, safe, dependency-free Markdown renderer.
 *
 * Why this exists (Phase 1 directive §9): the blog article body and the
 * product descriptions contain Markdown (e.g. `**The Problem:**`) that was
 * being rendered as raw text, so visitors literally saw the `**` markers.
 *
 * Safety: this component never uses `dangerouslySetInnerHTML`. Every token is
 * parsed into React elements, so no arbitrary HTML from article bodies can
 * reach the DOM. Supported subset: ATX headings (with stable IDs for TOC),
 * bold, italic, inline code, fenced code blocks (with copy action), unordered/
 * ordered lists, links, horizontal rules, blockquotes, GFM tables, and
 * paragraphs. Links open in a new tab with rel="noopener".
 *
 * Prompt 05F extensions:
 *  - Heading IDs (slugified) so the article TOC can link to real anchors.
 *  - GFM table support (header + separator + rows).
 *  - A working copy button on fenced code blocks (clipboard API + fallback).
 *  - Editorial-system classNames (replaces the old font-black / zinc styling).
 *  - `extractHeadings(markdown)` exported for TOC generation.
 */

import React, { useState } from 'react';

interface MarkdownProps {
  children: string;
  className?: string;
}

/** Slugify heading text into a stable DOM id (matches the id set on <hN>). */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Strip inline Markdown markers to plain text (for TOC labels + slug source). */
function stripInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1');
}

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract headings (h2/h3) from Markdown source for TOC generation.
 * h1 is the article title (already in the header) so it is excluded; h4+ are
 * too granular for a useful TOC. Returns [] when there are fewer than 3
 * eligible headings (caller should not render an empty/broken TOC).
 */
export function extractHeadings(markdown: string): TocHeading[] {
  if (!markdown) return [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const out: TocHeading[] = [];
  let inFence = false;
  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.*)$/.exec(line);
    if (m) {
      const level = m[1].length;
      const text = stripInline(m[2]).trim();
      if (text) out.push({ id: slugify(text), text, level });
    }
  }
  return out;
}

// Render inline markers (bold, italic, inline code, links) into React nodes.
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Token regex: links [text](url), code `...`, bold **...**, italic *...* or _..._
  const tokenRegex =
    /(\[[^\]]+\]\([^)\s]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*\*|_[^_]+_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;

    if (token.startsWith('[')) {
      // [text](url)
      const m = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token);
      if (m) {
        nodes.push(
          <a
            key={key}
            href={m[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
          >
            {m[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="px-1.5 py-0.5 rounded-md bg-muted text-foreground font-mono text-[0.875em] border border-border/40"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={key} className="font-bold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') || token.startsWith('_')) {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else {
      nodes.push(token);
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

/** Fenced code block with a working copy button (clipboard + fallback). */
function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — button remains, no crash */
    }
  };
  return (
    <div className="group my-6 relative rounded-[var(--pt-radius-md)] overflow-hidden border border-border/50 bg-zinc-900 dark:bg-black/70">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-[0.65rem] uppercase tracking-[0.18em] text-zinc-400 font-mono">
          {lang || 'code'}
        </span>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? 'Code copied' : 'Copy code'}
          className="text-[0.7rem] font-medium text-zinc-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-0.5"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-5 overflow-x-auto text-sm leading-relaxed text-zinc-100">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

/** Parse a GFM table block starting at lines[i]; returns rows + next index. */
function parseTable(lines: string[], start: number): { header: string[]; rows: string[][]; next: number } | null {
  const rowRe = /^\s*\|.*\|\s*$/;
  const splitRow = (l: string) =>
    l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  if (!rowRe.test(lines[start]) || !rowRe.test(lines[start + 1])) return null;
  const sep = lines[start + 1].trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
  if (!sep.every((c) => /^:?-+:?$/.test(c.trim()))) return null;
  const header = splitRow(lines[start]);
  const rows: string[][] = [];
  let j = start + 2;
  while (j < lines.length && rowRe.test(lines[j]) && lines[j].trim() !== '') {
    rows.push(splitRow(lines[j]));
    j++;
  }
  return { header, rows, next: j };
}

export function Markdown({ children, className }: MarkdownProps) {
  const lines = (children ?? '').replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip blank lines between blocks.
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Fenced code block (with optional language + copy action).
    const fenceMatch = /^```(\w+)?\s*$/.exec(line.trim());
    if (fenceMatch) {
      const lang = fenceMatch[1];
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing fence
      blocks.push(<CodeBlock key={key++} code={codeLines.join('\n')} lang={lang} />);
      continue;
    }

    // Horizontal rule.
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push(<hr key={key++} className="my-8 border-border/60" />);
      i++;
      continue;
    }

    // Heading (with stable slug id for TOC anchoring).
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const raw = headingMatch[2];
      const content = renderInline(raw, `h-${key}`);
      const id = slugify(stripInline(raw));
      const classNameByLevel: Record<number, string> = {
        1: 'text-3xl md:text-4xl font-semibold mt-10 mb-5 tracking-tight text-foreground',
        2: 'text-2xl md:text-3xl font-semibold mt-10 mb-4 tracking-tight text-foreground scroll-mt-28',
        3: 'text-xl md:text-2xl font-semibold mt-8 mb-3 tracking-tight text-foreground scroll-mt-28',
        4: 'text-lg md:text-xl font-semibold mt-6 mb-3 text-foreground',
        5: 'text-base md:text-lg font-semibold mt-5 mb-2 text-foreground',
        6: 'text-sm md:text-base font-semibold mt-4 mb-2 uppercase tracking-widest text-muted-foreground',
      };
      const Tag = (`h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6');
      blocks.push(
        <Tag key={key++} id={id} className={classNameByLevel[level]}>
          {content}
        </Tag>
      );
      i++;
      continue;
    }

    // GFM table.
    const table = parseTable(lines, i);
    if (table) {
      blocks.push(
        <div key={key++} className="my-6 overflow-x-auto rounded-[var(--pt-radius-sm)] border border-border/50">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-secondary/40">
                {table.header.map((h, ci) => (
                  <th key={ci} className="border-b border-border/60 px-4 py-2.5 text-left font-semibold text-foreground">
                    {renderInline(h, `th-${key}-${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/40 last:border-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2.5 align-top text-muted-foreground">
                      {renderInline(cell, `td-${key}-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = table.next;
      continue;
    }

    // Blockquote.
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-6 pl-5 border-l-4 border-primary/60 italic text-muted-foreground"
        >
          {renderInline(quoteLines.join(' '), `bq-${key}`)}
        </blockquote>
      );
      continue;
    }

    // Unordered list.
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*[-*+]\s+/, '');
        items.push(
          <li key={`li-${key}-${items.length}`} className="mb-2">
            {renderInline(itemText, `ul-${key}-${items.length}`)}
          </li>
        );
        i++;
      }
      blocks.push(
        <ul
          key={key++}
          className="my-5 list-disc pl-6 space-y-1 marker:text-primary/70"
        >
          {items}
        </ul>
      );
      continue;
    }

    // Ordered list.
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*\d+\.\s+/, '');
        items.push(
          <li key={`ol-li-${key}-${items.length}`} className="mb-2">
            {renderInline(itemText, `ol-${key}-${items.length}`)}
          </li>
        );
        i++;
      }
      blocks.push(
        <ol
          key={key++}
          className="my-5 list-decimal pl-6 space-y-1 marker:text-primary/70 marker:font-bold"
        >
          {items}
        </ol>
      );
      continue;
    }

    // Paragraph: gather consecutive non-blank, non-special lines.
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('```') &&
      !/^\s*([-*_])\1{2,}\s*$/.test(lines[i]) &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith('>') &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*\|.*\|\s*$/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="my-4 leading-[1.8] text-base md:text-lg text-muted-foreground">
        {renderInline(paraLines.join(' '), `p-${key}`)}
      </p>
    );
  }

  return <div className={className}>{blocks}</div>;
}
