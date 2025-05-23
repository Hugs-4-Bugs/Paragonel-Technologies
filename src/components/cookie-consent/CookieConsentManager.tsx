
"use client";

import { useEffect } from 'react';
import { useCookieConsent } from '@/hooks/use-cookie-consent';

// This component is primarily for client-side effects based on cookie consent
export function CookieConsentManager({ children }: { children: React.ReactNode }) {
  const { isMounted, preferences } = useCookieConsent();

  useEffect(() => {
    if (isMounted) {
      // Simulate Analytics Script Loading
      if (preferences.analytics) {
        console.log('%c[CookieConsent] Analytics Enabled: Mock Google Analytics initialized.', 'color: #22c55e');
        // In a real app, you'd load or initialize Google Analytics script here
        // e.g., GTag script injection or a call to an analytics library
      } else {
        console.log('%c[CookieConsent] Analytics Disabled.', 'color: #ef4444');
        // In a real app, ensure analytics scripts are not loaded or are disabled
      }

      // Simulate Marketing Script Loading
      if (preferences.marketing) {
        console.log('%c[CookieConsent] Marketing Enabled: Mock Facebook Pixel initialized.', 'color: #3b82f6');
        // In a real app, you'd load or initialize Marketing Pixel scripts here
      } else {
        console.log('%c[CookieConsent] Marketing Disabled.', 'color: #ef4444');
        // In a real app, ensure marketing scripts are not loaded or are disabled
      }

      // Functional cookies are handled by individual components needing them, e.g., ThemeProvider
      if (preferences.functional) {
         console.log('%c[CookieConsent] Functional Cookies Enabled.', 'color: #eab308');
      } else {
         console.log('%c[CookieConsent] Functional Cookies Disabled.', 'color: #ef4444');
      }
    }
  }, [isMounted, preferences]);

  return <>{children}</>;
}
