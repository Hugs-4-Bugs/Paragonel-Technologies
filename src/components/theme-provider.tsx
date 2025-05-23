
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import type { ThemeProviderProps as NextThemesProviderProps } from "next-themes/dist/types";
import { useCookieConsent } from "@/hooks/use-cookie-consent"; // Import the hook

const THEME_STORAGE_KEY = "theme"; // next-themes default storage key

export function ThemeProvider({ children, ...props }: NextThemesProviderProps) {
  const { isMounted: consentHookMounted, preferences } = useCookieConsent();
  const { setTheme, theme: currentTheme } = useNextTheme(); // Get current theme and setTheme from next-themes

  React.useEffect(() => {
    if (consentHookMounted) {
      if (!preferences.functional) {
        // If functional cookies are disabled, remove persisted theme and set to system/default
        localStorage.removeItem(THEME_STORAGE_KEY); 
        // Potentially set to system default if needed, next-themes might handle this.
        // Forcing a reset if a theme was already applied might be desired:
        if (props.defaultTheme && currentTheme !== props.defaultTheme) {
            // setTheme(props.defaultTheme); // This might cause re-renders, be cautious.
            // For now, just removing from localStorage might be enough as next-themes will fallback
        }
        console.log("[CookieConsent] Functional cookies disabled: Theme persistence OFF.");
      } else {
        console.log("[CookieConsent] Functional cookies enabled: Theme persistence ON.");
        // Ensure theme is applied if it was previously removed due to consent change
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme && storedTheme !== currentTheme) {
            // setTheme(storedTheme); // This might cause re-renders
        }
      }
    }
  }, [consentHookMounted, preferences.functional, props.defaultTheme, setTheme, currentTheme]);

  // Pass the storageKey based on consent. If functional cookies are off, pass undefined so next-themes doesn't use localStorage.
  const storageKeyToUse = (consentHookMounted && preferences.functional) ? THEME_STORAGE_KEY : undefined;

  return (
    <NextThemesProvider {...props} storageKey={storageKeyToUse}>
      {children}
    </NextThemesProvider>
  );
}
