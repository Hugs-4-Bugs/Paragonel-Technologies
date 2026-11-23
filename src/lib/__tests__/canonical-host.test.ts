/**
 * canonical-host.test.ts — regression test for the canonical-domain redirect
 * decision (Batch 3 Tasks 3 & 4). Ensures the acquisitionos.net + www→apex
 * redirects behave correctly and that already-canonical / preview / localhost
 * hosts are NOT redirected (so preview access + the apex are unaffected).
 */
import { describe, it, expect } from 'vitest';
import { canonicalHostRedirect, ACQUISITIONOS_APPROVED_DOMAIN } from '@/lib/canonical-host';

describe('canonicalHostRedirect', () => {
  it('redirects acquisitionos.net → the approved beta domain (308)', () => {
    const r = canonicalHostRedirect('acquisitionos.net', '/', '');
    expect(r).not.toBeNull();
    expect(r?.url).toBe(ACQUISITIONOS_APPROVED_DOMAIN);
    expect(r?.permanent).toBe(true);
  });

  it('redirects www.acquisitionos.net → the approved beta domain', () => {
    const r = canonicalHostRedirect('www.acquisitionos.net', '/anything', '?x=1');
    expect(r?.url).toBe(ACQUISITIONOS_APPROVED_DOMAIN);
    expect(r?.permanent).toBe(true);
  });

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

  it('is case-insensitive on the host', () => {
    expect(canonicalHostRedirect('AcquisitionOS.Net', '/', '')?.url).toBe(ACQUISITIONOS_APPROVED_DOMAIN);
    expect(canonicalHostRedirect('WWW.Paragonel.com', '/about', '')?.url).toBe('https://paragonel.com/about');
  });

  it('never redirects an unrelated host', () => {
    expect(canonicalHostRedirect('example.com', '/', '')).toBeNull();
    expect(canonicalHostRedirect('blog.paragonel.com', '/', '')).toBeNull();
  });
});
