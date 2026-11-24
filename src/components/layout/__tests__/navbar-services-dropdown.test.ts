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
 * NOTE ON THE "first five" REQUIREMENT (Part 6) — RESOLVED: the user explicitly
 * requested the navbar hover show only the top 5 services + "View All Services"
 * (master/production behavior). develop's servicesMega array retains all 13
 * engineering domains (Prompt 05B/05E expansion), but the hover panel now
 * renders only servicesMega.slice(0, 5) — the original five (Product Engineering,
 * AI & Intelligent Systems, Cloud/Infrastructure/Platform, Data Engineering &
 * Analytics, Experience & Interface). The full 13-domain catalog is still shown
 * on the /services landing page (reachable via "View All Services"). This test
 * locks the RESOLVED (5-item hover) behavior.
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

  it('renders the servicesMega items in the dropdown panel via .map (no accidental removal)', () => {
    // The hover renders servicesMega.slice(0, 5).map(...) — the top 5 only.
    expect(navbarSrc).toMatch(/servicesMega(?:\.slice\([^)]*\))?\.map\s*\(/);
  });

  it('the hover panel renders only the FIRST FIVE services (master/production behavior)', () => {
    // The user explicitly requested the hover show top 5 + "View All Services".
    // Lock the slice(0, 5) so a regression that re-shows all 13 is caught.
    expect(navbarSrc).toMatch(/servicesMega\.slice\(\s*0\s*,\s*5\s*\)/);
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
