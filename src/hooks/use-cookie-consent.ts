
"use client";

import { useState, useEffect, useCallback } from 'react';

export interface CookiePreferences {
  essential: true; // Essential cookies are always true and cannot be changed by the user
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export type CookieCategory = keyof Omit<CookiePreferences, 'essential'>;

const COOKIE_CONSENT_KEY = 'quantumfusion_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'quantumfusion_cookie_preferences';

const defaultPreferences: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export function useCookieConsent() {
  const [isMounted, setIsMounted] = useState(false);
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const storedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (storedConsent === 'true') {
      setConsentGiven(true);
      setShowBanner(false);
      if (storedPreferences) {
        try {
          const parsedPrefs = JSON.parse(storedPreferences) as CookiePreferences;
          // Ensure essential is always true
          setPreferences({ ...defaultPreferences, ...parsedPrefs, essential: true });
        } catch (error) {
          console.error("Error parsing stored cookie preferences:", error);
          setPreferences({ ...defaultPreferences, essential: true }); // Fallback to default with essential true
          localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify({ ...defaultPreferences, essential: true }));
        }
      } else {
        // If consent was given but no specific preferences, assume all were accepted initially
        const allAccepted = { essential: true, functional: true, analytics: true, marketing: true };
        setPreferences(allAccepted);
        localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted));
      }
    } else if (storedConsent === 'false') { // Explicitly rejected non-essential
      setConsentGiven(true); // Consent process completed, non-essentials rejected
      setShowBanner(false);
      if (storedPreferences) {
         try {
          const parsedPrefs = JSON.parse(storedPreferences) as CookiePreferences;
          setPreferences({ ...defaultPreferences, ...parsedPrefs, essential: true });
        } catch (error) {
          setPreferences({ ...defaultPreferences, essential: true });
          localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify({ ...defaultPreferences, essential: true }));
        }
      } else {
        // Fallback if rejected but no specific prefs stored (shouldn't happen ideally)
        setPreferences({ ...defaultPreferences, essential: true });
        localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify({ ...defaultPreferences, essential: true }));
      }
    }
    else {
      // No consent decision made yet
      setConsentGiven(false);
      setShowBanner(true);
      setPreferences({ ...defaultPreferences, essential: true });
    }
  }, []);

  const updateConsent = useCallback((newPreferences: CookiePreferences, consentDecisionMade: boolean) => {
    const prefsToSave = { ...newPreferences, essential: true };
    setPreferences(prefsToSave);
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefsToSave));
    if (consentDecisionMade) {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
      setConsentGiven(true);
      setShowBanner(false);
    }
  }, []);

  const acceptAll = useCallback(() => {
    const allAcceptedPrefs: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    updateConsent(allAcceptedPrefs, true);
    setShowSettingsModal(false);
  }, [updateConsent]);

  const rejectNonEssential = useCallback(() => {
    const onlyEssentialPrefs: CookiePreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    updateConsent(onlyEssentialPrefs, true);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'false'); // Explicitly mark as rejected for clarity
    setShowSettingsModal(false);
  }, [updateConsent]);

  const savePreferences = useCallback((newPrefs: CookiePreferences) => {
    updateConsent(newPrefs, true);
    setShowSettingsModal(false);
  }, [updateConsent]);

  const openSettings = useCallback(() => {
    setShowBanner(false); // Hide banner if settings are opened from it
    setShowSettingsModal(true);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettingsModal(false);
    if (!consentGiven) { // If user closes modal without saving from initial prompt
      setShowBanner(true); // Re-show banner
    }
  }, [consentGiven]);

  return {
    isMounted,
    consentGiven,
    preferences,
    showBanner,
    showSettingsModal,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    openSettings,
    closeSettings,
    setPreferences, // Expose setPreferences for direct updates if needed (e.g., from modal toggles)
  };
}
