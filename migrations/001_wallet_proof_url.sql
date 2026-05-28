-- Run on existing databases that were created before proof_url column
ALTER TABLE "wallet_topup_requests" ADD COLUMN IF NOT EXISTS "proof_url" TEXT;

INSERT INTO "site_settings" ("key", "value") VALUES ('checkoutPaymentMode', 'both')
ON CONFLICT ("key") DO NOTHING;
