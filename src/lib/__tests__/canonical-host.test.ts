/**
 * canonical-host.test.ts — regression test for the Paragonel company-domain
 * redirect decision (Batch 3 Task 4 / Batch 4 Task 2 correction).
 *
 * Ensures the www.paragonel.com → apex redirect behaves correctly (path + query
 * preserved, 308 permanent) and that every other host — including the apex
 * itself, the Vercel preview host, localhost, AND the AcquisitionOS hosts
 * (acquisitionos.net + the beta Vercel host) — is NOT redirected by this app.
 *
 * Batch 4 Task 2 correction: acquisitionos.net is the INTENDED canonical
 * AcquisitionOS product domain (a separate deployment) and is NOT redirected to
 * the temporary beta URL. The beta host is also not redirected. This keeps
 * Paragonel company-domain redirects separate from AcquisitionOS domain
 * handling and guarantees no redirect loop.
 */
import { describe, it, expect } from 'vitest';
import { canonicalHostRedirect } from '@/lib/canonical-host';

describe('canonicalHostRedirect — www.paragonel.com → apex', () => {
  it('redirects www.paragonel.com → the apex, preserving path + query (308)', () => {
    const r = canonicalHostRedirect('www.paragonel.com', '/our-product/acquisitionos', '?ref=menu');
    expect(r?.url).toBe('https://paragonel.com/our-product/acquisitionos?ref=menu');
    expect(r?.permanent).toBe(true);
  });

  it('redirects www.paragonel.com root → the apex root', () => {
    const r = canonicalHostRedirect('www.paragonel.com', '/', '');
    expect(r?.url).toBe('https://paragonel.com/');
    expect(r?.permanent).toBe(true);
  });

  it('is case-insensitive on the www.paragonel.com host', () => {
    expect(canonicalHostRedirect('WWW.Paragonel.com', '/about', '')?.url).toBe('https://paragonel.com/about');
  });
});

describe('canonicalHostRedirect — AcquisitionOS hosts are NOT redirected (Batch 4 Task 2)', () => {
  it('does NOT redirect acquisitionos.net (the intended canonical product domain)', () => {
    expect(canonicalHostRedirect('acquisitionos.net', '/', '')).toBeNull();
    expect(canonicalHostRedirect('acquisitionos.net', '/discovery', '?x=1')).toBeNull();
  });

  it('does NOT redirect www.acquisitionos.net', () => {
    expect(canonicalHostRedirect('www.acquisitionos.net', '/', '')).toBeNull();
  });

  it('does NOT redirect the beta deployment host (beta accessibility preserved)', () => {
    expect(canonicalHostRedirect('acquisitionosbeta.vercel.app', '/', '')).toBeNull();
    expect(canonicalHostRedirect('acquisitionosbeta.vercel.app', '/discovery', '')).toBeNull();
  });

  it('is case-insensitive + still does not redirect AcquisitionOS hosts', () => {
    expect(canonicalHostRedirect('AcquisitionOS.Net', '/', '')).toBeNull();
    expect(canonicalHostRedirect('AcquisitionOSBeta.Vercel.App', '/', '')).toBeNull();
  });
});

describe('canonicalHostRedirect — already-canonical + preview + local hosts', () => {
  it('does NOT redirect the apex paragonel.com (already canonical)', () => {
    expect(canonicalHostRedirect('paragonel.com', '/', '')).toBeNull();
    expect(canonicalHostRedirect('paragonel.com', '/services', '')).toBeNull();
  });

  it('does NOT redirect the Vercel preview host (preview access preserved)', () => {
    expect(canonicalHostRedirect('paragonel.vercel.app', '/', '')).toBeNull();
    expect(canonicalHostRedirect('paragonel-git-feat.vercel.app', '/', '')).toBeNull();
  });

  it('does NOT redirect localhost or empty host (local dev / no host header)', () => {
    expect(canonicalHostRedirect('localhost:3000', '/', '')).toBeNull();
    expect(canonicalHostRedirect('localhost', '/', '')).toBeNull();
    expect(canonicalHostRedirect('', '/', '')).toBeNull();
  });

  it('never redirects an unrelated host', () => {
    expect(canonicalHostRedirect('example.com', '/', '')).toBeNull();
    expect(canonicalHostRedirect('blog.paragonel.com', '/', '')).toBeNull();
  });
});
