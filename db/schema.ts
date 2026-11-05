import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(),
  nickname: text("nickname").notNull(),
  consentVersion: text("consent_version").notNull(),
  consentAt: text("consent_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
  modelVersion: text("model_version").notNull(),
  payload: text("payload").notNull(),
  report: text("report").notNull(),
}, table => [index("assessments_owner_created").on(table.userId, table.createdAt)]);

export const mutationLimits = sqliteTable("mutation_limits", {
  userId: text("user_id").primaryKey(),
  bucket: integer("bucket").notNull(),
  count: integer("count").notNull(),
});

export const reportOrders = sqliteTable("report_orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  assessmentId: text("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  liveMode: integer("live_mode").notNull(),
  priceId: text("price_id").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  sessionId: text("session_id"),
  paymentIntentId: text("payment_intent_id"),
  createdAt: text("created_at").notNull(),
  checkedAt: text("checked_at"),
  paidAt: text("paid_at"),
  receiptUrl: text("receipt_url"),
  verifyVersion: integer("verify_version").notNull().default(0),
}, table => [
  uniqueIndex("report_orders_session").on(table.sessionId),
  index("report_orders_owner").on(table.userId, table.createdAt),
  index("report_orders_intent").on(table.paymentIntentId),
  uniqueIndex("report_orders_active").on(table.userId, table.assessmentId, table.liveMode).where(sql`${table.status} IN ('creating','open','processing','paid')`),
]);
