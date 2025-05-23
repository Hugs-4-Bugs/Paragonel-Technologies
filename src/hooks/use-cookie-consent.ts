
"use client";

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

export interface CookiePreferences {
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  performance: boolean;
}

export type CookieCategory = keyof Omit<CookiePreferences, 'essential'>;

const COOKIE_CONSENT_KEY = 'quantumfusion_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'quantumfusion_cookie_preferences';

const defaultPreferences: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  performance: false,
};

interface CookieConsentContextType {
  isMounted: boolean;
  consentGiven: boolean | null;
  preferences: CookiePreferences;
  showBanner: boolean;
  showSettingsModal: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (newPrefs: CookiePreferences) => void;
  openSettings: () => void;
  closeSettings: () => void;
  setPreferences: React.Dispatch<React.SetStateAction<CookiePreferences>>;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const storedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (storedConsent === 'true' || storedConsent === 'false') {
      setConsentGiven(true); // A decision has been made
      setShowBanner(false);
      if (storedPreferences) {
        try {
          const parsedPrefs = JSON.parse(storedPreferences) as CookiePreferences;
          // Ensure essential is always true and merge stored prefs
          setPreferences({ ...defaultPreferences, ...parsedPrefs, essential: true });
        } catch (error) {
          console.error("Error parsing stored cookie preferences:", error);
          // Fallback based on the consent type if preferences are corrupt
          setPreferences(storedConsent === 'true'
            ? { essential: true, functional: true, analytics: true, marketing: true, performance: true }
            : { ...defaultPreferences, essential: true });
        }
      } else {
        // If no preferences stored but consent was given, derive prefs from consent type
        const newPrefs = storedConsent === 'true'
          ? { essential: true, functional: true, analytics: true, marketing: true, performance: true }
          : { ...defaultPreferences, essential: true }; // Consent 'false' implies only essential
        setPreferences(newPrefs);
        localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPrefs));
      }
    } else {
      // No stored consent decision
      setConsentGiven(false); // No decision made yet
      setShowBanner(true);
      // If there are stored preferences despite no overall consent decision (e.g., user customized then left), load them.
      // Otherwise, use defaults.
      if (storedPreferences) {
        try {
          const parsedPrefs = JSON.parse(storedPreferences) as CookiePreferences;
          setPreferences({ ...defaultPreferences, ...parsedPrefs, essential: true });
        } catch (error) {
           console.error("Error parsing stored cookie preferences without consent flag:", error);
           setPreferences({ ...defaultPreferences, essential: true });
        }
      } else {
        setPreferences({ ...defaultPreferences, essential: true });
      }
    }
  }, []);

  const updateConsentAndStorage = useCallback((newPreferences: CookiePreferences, consentDecisionMade: boolean) => {
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
      performance: true,
    };
    updateConsentAndStorage(allAcceptedPrefs, true);
    setShowSettingsModal(false);
  }, [updateConsentAndStorage]);

  const rejectNonEssential = useCallback(() => {
    const onlyEssentialPrefs: CookiePreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      performance: false,
    };
    updateConsentAndStorage(onlyEssentialPrefs, true);
    setShowSettingsModal(false);
  }, [updateConsentAndStorage]);

  const savePreferences = useCallback((newPrefs: CookiePreferences) => {
    updateConsentAndStorage(newPrefs, true);
    setShowSettingsModal(false);
  }, [updateConsentAndStorage]);

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


  const value = {
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

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
};

export const useCookieConsent = (): CookieConsentContextType => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};
