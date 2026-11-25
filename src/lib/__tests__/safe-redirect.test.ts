/**
 * safe-redirect.test.ts — the post-login redirect-safety primitive (Batch 2
 * Task 2). Ensures a user-controlled `?redirect=` can never carry an absolute
 * URL, protocol-relative URL, scheme (`javascript:`, `data:`), or open-redirect
 * payload — only same-origin relative paths are returned.
 */
import { describe, it, expect } from 'vitest';
import { safeRedirect } from '@/lib/safe-redirect';

describe('safeRedirect', () => {
  it('returns a valid relative path', () => {
    expect(safeRedirect('/careers', '/')).toBe('/careers');
    expect(safeRedirect('/candidate/profile')).toBe('/candidate/profile');
  });
  it('preserves path + query + fragment', () => {
    expect(safeRedirect('/careers/123?redirect=/x', '/')).toBe('/careers/123?redirect=/x');
    expect(safeRedirect('/careers/abc#apply')).toBe('/careers/abc#apply');
  });
  it('returns the fallback for empty / null / undefined', () => {
    expect(safeRedirect('', '/')).toBe('/');
    expect(safeRedirect(null, '/')).toBe('/');
    expect(safeRedirect(undefined, '/')).toBe('/');
    expect(safeRedirect('', '/candidate/profile')).toBe('/candidate/profile');
  });
  it('rejects an absolute URL (open-redirect payload)', () => {
    expect(safeRedirect('https://evil.example.com', '/')).toBe('/');
    expect(safeRedirect('http://evil.example.com', '/')).toBe('/');
  });
  it('rejects a protocol-relative URL', () => {
    expect(safeRedirect('//evil.example.com', '/')).toBe('/');
    expect(safeRedirect('\\\\evil.example.com', '/')).toBe('/');
  });
  it('rejects a scheme in the first segment (javascript:/data:)', () => {
    expect(safeRedirect('javascript:alert(1)', '/')).toBe('/');
    expect(safeRedirect('data:text/html,<script>', '/')).toBe('/');
  });
  it('rejects a non-rooted path', () => {
    expect(safeRedirect('careers', '/')).toBe('/');
    expect(safeRedirect('relative/path', '/')).toBe('/');
  });
});
