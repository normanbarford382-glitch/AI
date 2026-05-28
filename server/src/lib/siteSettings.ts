/** Shared parsing for site_settings boolean flags (wallet, OTP, maintenance, etc.) */

export function parseSettingBool(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;
  const v = String(value).trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

export function walletEnabledFromMap(map: Record<string, string | null | undefined>): boolean {
  const raw =
    map.walletEnabled ??
    map.wallet_enabled ??
    map.enableWallet ??
    map.enable_wallet ??
    "";
  return parseSettingBool(raw);
}

export function normalizeWalletEnabledValue(enabled: boolean): "true" | "false" {
  return enabled ? "true" : "false";
}

export function buildSettingsMap(rows: { key: string; value: string | null }[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value ?? "";
  }
  if (map.logo && !map.siteLogo) map.siteLogo = map.logo;
  if (map.siteLogo && !map.logo) map.logo = map.siteLogo;
  map.walletEnabled = normalizeWalletEnabledValue(walletEnabledFromMap(map));
  return map;
}
