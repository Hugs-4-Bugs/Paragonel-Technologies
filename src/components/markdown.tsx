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
 * reach the DOM. Supported subset: ATX headings, bold, italic, inline code,
 * fenced code blocks, unordered/ordered lists, links, horizontal rules,
 * blockquotes, and paragraphs. Links open in a new tab with rel="noopener".
 */

import React from 'react';

interface MarkdownProps {
  children: string;
  className?: string;
}

// Render inline markers (bold, italic, inline code, links) into React nodes.
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Token regex: links [text](url), code `...`, bold **...**, italic *...* or _..._
  const tokenRegex =
    /(\[[^\]]+\]\([^)\s]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g;
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

    // Fenced code block.
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing fence
      blocks.push(
        <pre
          key={key++}
          className="my-6 p-5 rounded-2xl bg-zinc-900 dark:bg-black/60 text-zinc-100 overflow-x-auto border border-border/40 text-sm leading-relaxed"
        >
          <code className="font-mono">{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Horizontal rule.
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push(<hr key={key++} className="my-8 border-border/60" />);
      i++;
      continue;
    }

    // Heading.
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = renderInline(headingMatch[2], `h-${key}`);
      const classNameByLevel: Record<number, string> = {
        1: 'text-3xl md:text-4xl font-black mt-10 mb-5 tracking-tight',
        2: 'text-2xl md:text-3xl font-black mt-10 mb-4 tracking-tight',
        3: 'text-xl md:text-2xl font-bold mt-8 mb-3 tracking-tight',
        4: 'text-lg md:text-xl font-bold mt-6 mb-3',
        5: 'text-base md:text-lg font-bold mt-5 mb-2',
        6: 'text-sm md:text-base font-bold mt-4 mb-2 uppercase tracking-widest text-muted-foreground',
      };
      const Tag = (`h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6');
      blocks.push(
        <Tag key={key++} className={classNameByLevel[level]}>
          {content}
        </Tag>
      );
      i++;
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
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="my-4 leading-[1.8] text-base md:text-lg">
        {renderInline(paraLines.join(' '), `p-${key}`)}
      </p>
    );
  }

  return <div className={className}>{blocks}</div>;
}
