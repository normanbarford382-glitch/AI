import { pgTable, text, boolean, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

export const walletTopupStatusEnum = pgEnum("wallet_topup_status", ["PENDING", "APPROVED", "REJECTED"]);

export const wallets = pgTable("wallets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  balance: real("balance").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  walletId: text("wallet_id").notNull().references(() => wallets.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const paymentMethods = pgTable("payment_methods", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  description: text("description"),
  accountInfo: text("account_info"),
  logo: text("logo"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: text("sort_order").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const walletTopupRequests = pgTable("wallet_topup_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  paymentMethodId: text("payment_method_id").notNull().references(() => paymentMethods.id),
  amount: real("amount").notNull(),
  transactionRef: text("transaction_ref"),
  proofUrl: text("proof_url"),
  status: walletTopupStatusEnum("status").notNull().default("PENDING"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Wallet = typeof wallets.$inferSelect;
