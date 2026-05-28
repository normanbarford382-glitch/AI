import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Locale } from '../lib/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  isRTL: boolean;
  dir: 'rtl' | 'ltr';
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    return (localStorage.getItem('locale') as Locale) || 'ar';
  });

  const isRTL = locale === 'ar';

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('locale', l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.body.style.fontFamily = l === 'ar' ? '"Cairo", sans-serif' : '"Inter", sans-serif';
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.body.style.fontFamily = isRTL ? '"Cairo", sans-serif' : '"Inter", sans-serif';
  }, [locale, isRTL]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isRTL, dir: isRTL ? 'rtl' : 'ltr' }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider');
  return ctx;
}
