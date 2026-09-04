"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { type Locale, messages, supportedLocales } from "./messages";

type i18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const i18nContext = createContext<i18nContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("coop_locale");
    if (saved && supportedLocales.includes(saved as Locale)) {
      setLocaleState(saved as Locale);
    }
  }, []);

  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale);
    localStorage.setItem("coop_locale", newLocale);
    document.documentElement.lang = newLocale;
  }

  function t(path: string): string {
    const parts = path.split(".");
    let current: any = messages[locale] || messages["en"];
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        // Fallback to English
        let fallback: any = messages["en"];
        for (const fpart of parts) {
          if (fallback && typeof fallback === "object" && fpart in fallback) {
            fallback = fallback[fpart];
          } else {
            return path;
          }
        }
        return typeof fallback === "string" ? fallback : path;
      }
    }
    return typeof current === "string" ? current : path;
  }

  return (
    <i18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </i18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(i18nContext);
  if (!context) {
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      t: (key: string) => key
    };
  }
  return context;
}
