import { pgTable, text, boolean, timestamp, real, integer, pgEnum } from "drizzle-orm/pg-core";
import { products } from "./products";
import { users } from "./users";

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "OUT_OF_STOCK"
]);

export const orders = pgTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  shippingBranch: text("shipping_branch"),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  totalAmount: real("total_amount").notNull(),
  paidFromWallet: boolean("paid_from_wallet").notNull().default(false),
  walletAmountUsed: real("wallet_amount_used"),
  couponId: text("coupon_id"),
  discountAmount: real("discount_amount"),
  notes: text("notes"),
  adminNote: text("admin_note"),
  shippingReceiptUrl: text("shipping_receipt_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
});

export const coupons = pgTable("coupons", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(),
  discountValue: real("discount_value").notNull(),
  minOrderValue: real("min_order_value"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const couponUsages = pgTable("coupon_usages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  couponId: text("coupon_id").notNull().references(() => coupons.id),
  userId: text("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
