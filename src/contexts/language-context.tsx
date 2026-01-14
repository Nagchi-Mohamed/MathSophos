"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { defaultLocale, Locale, dictionary } from '@/lib/i18n';

interface LanguageContextType {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  t: typeof dictionary.fr;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Locale>(defaultLocale);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load preference from localStorage
    const savedLang = localStorage.getItem('language') as Locale;
    if (savedLang && (savedLang === 'fr' || savedLang === 'en')) {
      setLanguage(savedLang);
    }
    setIsLoaded(true);
  }, []);

  const handleSetLanguage = (lang: Locale) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Avoid hydration mismatch by rendering children only after loading preference?
  // Or just render with default and update. 
  // For critical content, we might want to wait, but for now we'll render immediately.

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t: dictionary[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
