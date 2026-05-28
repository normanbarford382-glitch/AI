import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import {
  SITE_SETTINGS_QUERY_KEY,
  isWalletEnabled,
  parseSettingBool,
} from '../lib/siteSettings';
import { normalizeCheckoutPaymentMode, type CheckoutPaymentMode } from '../lib/checkoutPayment';

export { SITE_SETTINGS_QUERY_KEY };

function normalizeSettings(raw: Record<string, string | null | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    out[key] = value == null ? '' : String(value);
  }
  if (out.logo && !out.siteLogo) out.siteLogo = out.logo;
  if (out.siteLogo && !out.logo) out.logo = out.siteLogo;
  out.walletEnabled = isWalletEnabled(out) ? 'true' : 'false';
  return out;
}

interface SiteSettingsContextValue {
  siteName: string;
  siteLogo: string;
  settings: Record<string, string>;
  walletEnabled: boolean;
  checkoutPaymentMode: CheckoutPaymentMode;
  isLoading: boolean;
  refetchSettings: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: () => api.get<{ settings: Record<string, string> }>('/settings'),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const settings = normalizeSettings(data?.settings ?? {});
  const siteName = settings.siteName || '';
  const siteLogo = settings.siteLogo || settings.logo || '';
  const walletEnabled = isWalletEnabled(settings);
  const checkoutPaymentMode = normalizeCheckoutPaymentMode(settings.checkoutPaymentMode);

  useEffect(() => {
    if (siteName) document.title = siteName;
  }, [siteName]);

  return (
    <SiteSettingsContext.Provider
      value={{
        siteName,
        siteLogo,
        settings,
        walletEnabled,
        checkoutPaymentMode,
        isLoading,
        refetchSettings: () => { void refetch(); },
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  return ctx;
}

export function useSettingBool(key: string): boolean {
  const { settings } = useSiteSettings();
  return parseSettingBool(settings[key]);
}
