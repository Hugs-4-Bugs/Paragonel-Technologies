
"use client";

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ChatSection } from '@/components/sections/chat-section';
import { CookieConsentBanner } from '@/components/cookie-consent/CookieConsentBanner';
import { CookieSettingsModal } from '@/components/cookie-consent/CookieSettingsModal';
import { CookieConsentManager } from '@/components/cookie-consent/CookieConsentManager';
import { CookieConsentProvider } from '@/hooks/use-cookie-consent.tsx';
import { AuthProvider } from '@/contexts/auth-context';
import { FirebaseClientProvider } from '@/firebase';
import { usePathname } from 'next/navigation';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith('/admin');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <FirebaseClientProvider>
            <CookieConsentProvider>
              <CookieConsentManager>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="dark"
                  enableSystem
                  disableTransitionOnChange
                >
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
      </body>
    </html>
  );
}
