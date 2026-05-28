import arMessages from '../../messages/ar.json';
import enMessages from '../../messages/en.json';

export type Locale = 'ar' | 'en';
export const locales: Locale[] = ['ar', 'en'];
export const defaultLocale: Locale = 'ar';

const messages: Record<Locale, any> = { ar: arMessages, en: enMessages };

function getNestedValue(obj: any, path: string[]): string | undefined {
  let current = obj;
  for (const key of path) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return typeof current === 'string' ? current : undefined;
}

export function t(locale: Locale, namespace: string, key: string, params?: Record<string, string>): string {
  const ns = messages[locale]?.[namespace];
  let value = ns?.[key] ?? getNestedValue(messages[locale], [namespace, key]) ?? key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(`{${k}}`, v);
    });
  }
  return value;
}

export function useMessages(locale: Locale, namespace: string) {
  return (key: string, params?: Record<string, string>) => t(locale, namespace, key, params);
}
