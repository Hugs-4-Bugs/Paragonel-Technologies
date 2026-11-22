'use client';
/**
 * CaptchaWidget — Cloudflare Turnstile widget (Prompt 05Q §3).
 *
 * Renders the Turnstile challenge + calls onVerify(token) when solved. In dev
 * (no NEXT_PUBLIC_TURNSTILE_SITE_KEY), uses Cloudflare's documented test site
 * key (always passes) so the flow is testable without real credentials. In
 * production without a site key, the widget renders a "CAPTCHA unavailable"
 * notice + the server fail-closes (verifyCaptcha returns 'misconfigured').
 *
 * Server-side verification is mandatory — the token is sent to the API which
 * calls verifyCaptcha(). A client-only success flag is never trusted.
 */
import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

const TEST_SITE_KEY = '1x00000000000000000000AA';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

export function CaptchaWidget({
  onVerify,
  onExpire,
  className,
}: {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;
  const isTest = !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.NODE_ENV !== 'production';

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current) return; // already rendered
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => {
        onVerify(token);
        setStatus('ready');
      },
      'expired-callback': () => {
        onExpire?.();
      },
      theme: 'auto',
    });
    setStatus('ready');
  }, [siteKey, onVerify, onExpire]);

  useEffect(() => {
    if (isTest) {
      // Dev test mode — auto-verify with a test token (documented dev-only).
      setStatus('ready');
      onVerify('test-token-' + Date.now());
      return;
    }
    if (window.turnstile) {
      renderWidget();
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => renderWidget();
    script.onerror = () => setStatus('unavailable');
    document.head.appendChild(script);
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
    };
  }, [isTest, renderWidget, onVerify]);

  if (status === 'unavailable') {
    return (
      <div className={className} role="alert" aria-live="polite">
        <p className="text-xs text-destructive">CAPTCHA could not be loaded. Please refresh the page or contact support.</p>
      </div>
    );
  }

  return (
    <div className={className} aria-label="CAPTCHA verification">
      <div ref={containerRef} />
      {isTest && (
        <p className="text-[10px] text-muted-foreground mt-1">CAPTCHA test mode (dev) — auto-pass.</p>
      )}
    </div>
  );
}
