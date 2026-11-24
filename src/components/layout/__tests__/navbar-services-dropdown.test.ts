/**
 * navbar-services-dropdown.test.ts — Source-invariant regression guard for the
 * Services dropdown (Batch 13 Part 6).
 *
 * WHY SOURCE-INVARIANT: vitest runs in `environment: 'node'` (vitest.config.ts),
 * so a React render test (jsdom + @testing-library/react) is not feasible
 * without changing the global test environment. This test instead locks the
 * dropdown's SOURCE structure so accidental breakage by other Batch 13 work
 * (or future changes) is caught: the servicesMega data source, the .map render,
 * the "View All Services" link → /services, and the state-driven open behavior.
 *
 * WHAT THIS LOCKS (the current develop behavior):
 *   - servicesMega array exists + is rendered via .map (the dropdown content).
 *   - A "View All Services" link with href="/services" is present.
 *   - The dropdown is state-driven (servicesOpen/setServicesOpen) — opens on
 *     click, not hover-only — so it works on touch + keyboard.
 *
 * NOTE ON THE "first five" REQUIREMENT (Part 6): develop's servicesMega contains
 * 13 engineering domains (intentional Prompt 05B/05E expansion); master's navbar
 * has NO servicesMega array (a different implementation). The task asserts
 * master/production shows "exactly the first five" — this conflicts with the
 * current develop dropdown. Per Part 6 ("do not redesign / do not change
 * navigation or interaction"), the navbar component was NOT modified; the
 * discrepancy is flagged in the Batch 13 report for the user to resolve. This
 * test locks the CURRENT (13-item) develop behavior against regression, not the
 * task's stated 5-item behavior.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const navbarSrc = readFileSync(
  resolve(process.cwd(), 'src/components/layout/navbar.tsx'),
  'utf8',
);

describe('Services dropdown — source-invariant regression (Part 6)', () => {
  it('defines a servicesMega array (the dropdown data source)', () => {
    expect(navbarSrc).toMatch(/const\s+servicesMega\s*=\s*\[/);
  });

  it('renders the servicesMega items in the dropdown panel (no accidental removal)', () => {
    expect(navbarSrc).toMatch(/servicesMega\.map\s*\(/);
  });

  it('every servicesMega href targets a /services# anchor', () => {
    // Extract each href in the servicesMega array + assert it is a /services# link.
    const arrayBlock = navbarSrc.match(/const\s+servicesMega\s*=\s*\[([\s\S]*?)\];/);
    expect(arrayBlock, 'servicesMega array block not found').not.toBeNull();
    const hrefs = Array.from(arrayBlock![1].matchAll(/href:\s*"([^"]+)"/g)).map((m) => m[1]);
    expect(hrefs.length, 'servicesMega should have at least one entry').toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href.startsWith('/services#'), `href "${href}" should target /services#`).toBe(true);
    }
  });

  it('includes a "View All Services" link pointing to /services', () => {
    expect(navbarSrc).toContain('View All Services');
    expect(navbarSrc).toMatch(/href="\/services"/);
  });

  it('the dropdown is state-driven (opens on click, not hover-only) — touch/keyboard accessible', () => {
    expect(navbarSrc).toMatch(/\bservicesOpen\b/);
    expect(navbarSrc).toMatch(/setServicesOpen/);
  });

  it('the Services nav link itself routes to /services', () => {
    // The top-level "Services" item is a Link to /services (mega: true).
    expect(navbarSrc).toMatch(/\{\s*href:\s*"\/services",\s*label:\s*"Services"/);
  });
});
