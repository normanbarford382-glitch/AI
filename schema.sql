-- LaptopStore — Full Database Schema
-- Run this once on a fresh PostgreSQL database before starting the app
-- Compatible with Railway PostgreSQL

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
CREATE TYPE "role" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "order_status" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'OUT_OF_STOCK');
CREATE TYPE "message_status" AS ENUM ('SENT', 'SEEN');
CREATE TYPE "wallet_topup_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "users" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name"           TEXT,
  "email"          TEXT NOT NULL UNIQUE,
  "email_verified" TIMESTAMP,
  "password_hash"  TEXT,
  "phone"          TEXT,
  "address"        TEXT,
  "avatar"         TEXT,
  "role"           "role" NOT NULL DEFAULT 'USER',
  "is_banned"      BOOLEAN NOT NULL DEFAULT FALSE,
  "language"       TEXT NOT NULL DEFAULT 'ar',
  "created_at"     TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "otp_codes" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"    TEXT REFERENCES "users"("id") ON DELETE CASCADE,
  "email"      TEXT NOT NULL,
  "code"       TEXT NOT NULL,
  "expires_at" TIMESTAMP NOT NULL,
  "used"       BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "password_resets" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token"      TEXT NOT NULL UNIQUE,
  "expires_at" TIMESTAMP NOT NULL,
  "used"       BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CATEGORIES & PRODUCTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "categories" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name_ar"     TEXT NOT NULL,
  "name_en"     TEXT NOT NULL,
  "slug"        TEXT NOT NULL UNIQUE,
  "image"       TEXT,
  "description" TEXT,
  "is_active"   BOOLEAN NOT NULL DEFAULT TRUE,
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "products" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name_ar"         TEXT NOT NULL,
  "name_en"         TEXT NOT NULL,
  "description_ar"  TEXT,
  "description_en"  TEXT,
  "price"           REAL NOT NULL,
  "discount_price"  REAL,
  "stock"           INTEGER NOT NULL DEFAULT 0,
  "images"          TEXT[] NOT NULL DEFAULT '{}',
  "thumbnail"       TEXT,
  "category_id"     TEXT NOT NULL REFERENCES "categories"("id"),
  "brand"           TEXT,
  "model"           TEXT,
  "specs_ar"        JSONB,
  "specs_en"        JSONB,
  "is_featured"     BOOLEAN NOT NULL DEFAULT FALSE,
  "is_active"       BOOLEAN NOT NULL DEFAULT TRUE,
  "slug"            TEXT NOT NULL UNIQUE,
  "sku"             TEXT UNIQUE,
  "weight"          REAL,
  "tags"            TEXT[] NOT NULL DEFAULT '{}',
  "created_at"      TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "reviews" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"     TEXT NOT NULL,
  "product_id"  TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "rating"      INTEGER NOT NULL,
  "comment"     TEXT,
  "is_approved" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"  TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "wishlist_items" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"    TEXT NOT NULL,
  "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "compare_items" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"    TEXT NOT NULL,
  "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "banners" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title_ar"    TEXT,
  "title_en"    TEXT,
  "subtitle_ar" TEXT,
  "subtitle_en" TEXT,
  "image"       TEXT NOT NULL,
  "link"        TEXT,
  "is_active"   BOOLEAN NOT NULL DEFAULT TRUE,
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ORDERS & COUPONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "coupons" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "code"           TEXT NOT NULL UNIQUE,
  "discount_type"  TEXT NOT NULL,
  "discount_value" REAL NOT NULL,
  "min_order_value" REAL,
  "max_uses"       INTEGER,
  "used_count"     INTEGER NOT NULL DEFAULT 0,
  "expires_at"     TIMESTAMP,
  "is_active"      BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at"     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id"                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"           TEXT NOT NULL REFERENCES "users"("id"),
  "full_name"         TEXT NOT NULL,
  "phone"             TEXT NOT NULL,
  "address"           TEXT NOT NULL,
  "shipping_branch"   TEXT,
  "status"            "order_status" NOT NULL DEFAULT 'PENDING',
  "total_amount"      REAL NOT NULL,
  "paid_from_wallet"  BOOLEAN NOT NULL DEFAULT FALSE,
  "wallet_amount_used" REAL,
  "coupon_id"         TEXT,
  "discount_amount"   REAL,
  "notes"                TEXT,
  "admin_note"           TEXT,
  "shipping_receipt_url" TEXT,
  "created_at"           TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "order_items" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "order_id"   TEXT NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id" TEXT NOT NULL REFERENCES "products"("id"),
  "quantity"   INTEGER NOT NULL,
  "price"      REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS "coupon_usages" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "coupon_id"  TEXT NOT NULL REFERENCES "coupons"("id"),
  "user_id"    TEXT NOT NULL REFERENCES "users"("id"),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CHAT & NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "conversations" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"         TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "last_message"    TEXT,
  "last_message_at" TIMESTAMP,
  "created_at"      TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "conversation_id" TEXT NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "sender_id"       TEXT NOT NULL REFERENCES "users"("id"),
  "content"         TEXT,
  "image_url"       TEXT,
  "status"          "message_status" NOT NULL DEFAULT 'SENT',
  "is_from_admin"   BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at"      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title_ar"   TEXT NOT NULL,
  "title_en"   TEXT NOT NULL,
  "body_ar"    TEXT,
  "body_en"    TEXT,
  "link"       TEXT,
  "is_read"    BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SITE SETTINGS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "site_settings" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key"        TEXT NOT NULL UNIQUE,
  "value"      TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- WALLET
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "wallets" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"    TEXT NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "balance"    REAL NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "wallet_id"   TEXT NOT NULL REFERENCES "wallets"("id") ON DELETE CASCADE,
  "amount"      REAL NOT NULL,
  "type"        TEXT NOT NULL,
  "description" TEXT,
  "created_at"  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "payment_methods" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name_ar"      TEXT NOT NULL,
  "name_en"      TEXT NOT NULL,
  "description"  TEXT,
  "account_info" TEXT,
  "logo"         TEXT,
  "is_active"    BOOLEAN NOT NULL DEFAULT TRUE,
  "sort_order"   TEXT NOT NULL DEFAULT '0',
  "created_at"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "wallet_topup_requests" (
  "id"                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id"           TEXT NOT NULL REFERENCES "users"("id"),
  "payment_method_id" TEXT NOT NULL REFERENCES "payment_methods"("id"),
  "amount"            REAL NOT NULL,
  "transaction_ref"   TEXT,
  "proof_url"         TEXT,
  "status"            "wallet_topup_status" NOT NULL DEFAULT 'PENDING',
  "admin_note"        TEXT,
  "created_at"        TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- DEFAULT SITE SETTINGS
-- ─────────────────────────────────────────
INSERT INTO "site_settings" ("key", "value") VALUES
  ('siteName', 'LaptopStore'),
  ('otpEnabled', 'true'),
  ('walletEnabled', 'true'),
  ('checkoutPaymentMode', 'both'),
  ('maintenanceMode', 'false')
ON CONFLICT ("key") DO NOTHING;
