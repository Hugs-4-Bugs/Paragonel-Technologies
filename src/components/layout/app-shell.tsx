"use client";

/**
 * AppShell — the client-side root chrome (providers, navbar/footer/chat,
 * cookie consent, theme). Extracted from `app/layout.tsx` so the layout can
 * remain a Server Component and export Next.js `metadata` (SEO gap G9).
 *
 * The admin area (`/admin/**`) hides the public navbar/footer/chat so the
 * CMS gets a full-screen shell.
 */

import React from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ChatSection } from '@/components/sections/chat-section';
import { CookieConsentBanner } from '@/components/cookie-consent/CookieConsentBanner';
import { CookieSettingsModal } from '@/components/cookie-consent/CookieSettingsModal';
import { CookieConsentManager } from '@/components/cookie-consent/CookieConsentManager';
import { CookieConsentProvider } from '@/hooks/use-cookie-consent';
import { AuthProvider } from '@/contexts/auth-context';
import { FirebaseClientProvider } from '@/firebase';
import { SmoothScroll } from '@/components/motion/smooth-scroll';

export function AppShell({
  children,
  fontClass,
}: {
  children: React.ReactNode;
  fontClass: string;
}) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith('/admin');

  return (
    <div className={`${fontClass} antialiased min-h-screen flex flex-col`}>
      <AuthProvider>
        <FirebaseClientProvider>
          <CookieConsentProvider>
            <CookieConsentManager>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
              >
                <SmoothScroll />
                {!isAdminPath && <Navbar />}
                <main className="flex-grow">{children}</main>
                {!isAdminPath && <Footer />}
                {!isAdminPath && <ChatSection />}
                <Toaster />
                <CookieConsentBanner />
                <CookieSettingsModal />
              </ThemeProvider>
            </CookieConsentManager>
          </CookieConsentProvider>
        </FirebaseClientProvider>
      </AuthProvider>
    </div>
  );
}
