export const SITE_SETTINGS_QUERY_KEY = ['site-settings'] as const;
export const WALLET_QUERY_KEY = ['wallet'] as const;

export function parseSettingBool(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;
  const v = String(value).trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
}

export function isWalletEnabled(settings: Record<string, string | undefined | null> | undefined): boolean {
  if (!settings) return false;
  const raw =
    settings.walletEnabled ??
    settings.wallet_enabled ??
    settings.enableWallet ??
    settings.enable_wallet ??
    '';
  return parseSettingBool(raw);
}
