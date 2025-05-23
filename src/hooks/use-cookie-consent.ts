
"use client";

import { useState, useEffect, useCallback } from 'react';

export interface CookiePreferences {
  essential: true; // Essential cookies are always true and cannot be changed by the user
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  performance: boolean; // Added Performance Cookies
}

export type CookieCategory = keyof Omit<CookiePreferences, 'essential'>;

const COOKIE_CONSENT_KEY = 'quantumfusion_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'quantumfusion_cookie_preferences';

const defaultPreferences: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  performance: false, // Default for performance
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
          setPreferences({ ...defaultPreferences, ...parsedPrefs, essential: true });
        } catch (error) {
          console.error("Error parsing stored cookie preferences:", error);
          setPreferences({ ...defaultPreferences, essential: true });
          localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify({ ...defaultPreferences, essential: true }));
        }
      } else {
        const allAccepted = { essential: true, functional: true, analytics: true, marketing: true, performance: true };
        setPreferences(allAccepted);
        localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted));
      }
    } else if (storedConsent === 'false') { 
      setConsentGiven(true); 
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
        setPreferences({ ...defaultPreferences, essential: true });
        localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify({ ...defaultPreferences, essential: true }));
      }
    }
    else {
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
      performance: true, // Accept performance cookies
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
      performance: false, // Reject performance cookies
    };
    updateConsent(onlyEssentialPrefs, true);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'false'); 
    setShowSettingsModal(false);
  }, [updateConsent]);

  const savePreferences = useCallback((newPrefs: CookiePreferences) => {
    updateConsent(newPrefs, true);
    setShowSettingsModal(false);
  }, [updateConsent]);

  const openSettings = useCallback(() => {
    setShowBanner(false); 
    setShowSettingsModal(true);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettingsModal(false);
    if (!consentGiven) { 
      setShowBanner(true); 
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
    setPreferences, 
  };
}
