export type CheckoutPaymentMode = "wallet" | "cod" | "both";

export function normalizeCheckoutPaymentMode(value: string | null | undefined): CheckoutPaymentMode {
  if (value === "wallet" || value === "cod" || value === "both") return value;
  return "both";
}
