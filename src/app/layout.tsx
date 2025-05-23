
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
import { CookieConsentManager } from '@/components/cookie-consent/CookieConsentManager'; // We'll create this small client component

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'QuantumFusion Solutions - Shaping The Future For Tomorrow',
  description: 'Innovative IT solutions in AI, Cloud Computing, DevOps, and SaaS Platforms by QuantumFusion Solutions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <CookieConsentManager> {/* Wrap ThemeProvider to allow it to access consent */}
          <ThemeProvider
            attribute="class"
            defaultTheme="dark" // Default theme if functional cookies are off or not set
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
            <ChatSection />
            <Toaster />
            <CookieConsentBanner />
            <CookieSettingsModal />
          </ThemeProvider>
        </CookieConsentManager>
      </body>
    </html>
  );
}
