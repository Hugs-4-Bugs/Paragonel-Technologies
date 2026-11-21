
"use client";

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

export interface CookiePreferences {
  essential: true; // Essential cookies are always true and non-negotiable
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  performance: boolean;
}

export type CookieCategory = keyof Omit<CookiePreferences, 'essential'>;

const COOKIE_CONSENT_KEY = 'paragonel_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'paragonel_cookie_preferences';

// Default preferences: essential is true, others are false until user opts in
const defaultPreferences: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  performance: false,
};

interface CookieConsentContextType {
  isMounted: boolean;
  consentGiven: boolean | null; // null if not yet determined, true if consent has been processed
  preferences: CookiePreferences;
  showBanner: boolean;
  showSettingsModal: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (newPrefs: CookiePreferences) => void;
  openSettings: () => void;
  closeSettings: () => void;
  setPreferences: React.Dispatch<React.SetStateAction<CookiePreferences>>; // For live updates in modal
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const CookieConsentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [preferencesState, setPreferencesState] = useState<CookiePreferences>(defaultPreferences);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY); // "true" if any decision made
    const storedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (storedConsent === 'true') { // User has made a decision
      setConsentGiven(true);
      setShowBanner(false);
      if (storedPreferences) {
        try {
          const parsedPrefs = JSON.parse(storedPreferences) as CookiePreferences;
          setPreferencesState({ ...defaultPreferences, ...parsedPrefs, essential: true });
        } catch (error) {
          console.error("Error parsing stored cookie preferences:", error);
          // Fallback if parsing fails but consent was given (e.g., assume all accepted)
          setPreferencesState({ essential: true, functional: true, analytics: true, marketing: true, performance: true });
        }
      } else {
        // This case (consent=true but no prefs) is unlikely but handle by defaulting to all accepted
        const allAccepted: CookiePreferences = { essential: true, functional: true, analytics: true, marketing: true, performance: true };
        setPreferencesState(allAccepted);
        localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted));
      }
    } else { // No consent decision made yet
      setConsentGiven(false);
      setShowBanner(true);
      if (storedPreferences) { // Load any previously "live-edited" prefs from modal, even if not saved
        try {
          const parsedPrefs = JSON.parse(storedPreferences) as CookiePreferences;
          setPreferencesState({ ...defaultPreferences, ...parsedPrefs, essential: true });
        } catch (error) {
          console.error("Error parsing stored cookie preferences (no consent):", error);
          setPreferencesState({ ...defaultPreferences });
        }
      } else {
        setPreferencesState({ ...defaultPreferences });
      }
    }
  }, []);

  const updateConsentAndStorage = useCallback((newPreferences: CookiePreferences, consentDecisionMade: boolean) => {
    const prefsToSave: CookiePreferences = { ...newPreferences, essential: true };
    setPreferencesState(prefsToSave);
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
      ...defaultPreferences, // This ensures functional, analytics, marketing, performance are false
      essential: true,
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
    if (localStorage.getItem(COOKIE_CONSENT_KEY) !== 'true') {
      setShowBanner(true);
    }
  }, []);

  // This `setPreferences` is for the live toggling within the modal before saving.
  const setLivePreferences = (newPrefsCallback: React.SetStateAction<CookiePreferences>) => {
    setPreferencesState(newPrefsCallback);
  };

  const contextValue: CookieConsentContextType = {
    isMounted,
    consentGiven,
    preferences: preferencesState,
    showBanner,
    showSettingsModal,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    openSettings,
    closeSettings,
    setPreferences: setLivePreferences,
  };

  return <CookieConsentContext.Provider value={contextValue}>{children}</CookieConsentContext.Provider>;
};

export const useCookieConsent = (): CookieConsentContextType => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};
