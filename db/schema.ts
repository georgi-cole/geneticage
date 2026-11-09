import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(),
  nickname: text("nickname").notNull(),
  consentVersion: text("consent_version").notNull(),
  consentAt: text("consent_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const authAccounts = sqliteTable("auth_accounts", {
  userId: text("user_id").primaryKey().references(() => profiles.userId, { onDelete: "cascade" }),
  email: text("email").notNull(),
  createdAt: text("created_at").notNull(),
}, table => [uniqueIndex("auth_accounts_email").on(table.email)]);

export const oauthAccounts = sqliteTable("oauth_accounts", {
  userId: text("user_id").primaryKey().references(() => profiles.userId, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  subjectHash: text("subject_hash").notNull(),
}, table => [uniqueIndex("oauth_accounts_identity").on(table.provider, table.subjectHash)]);

export const oauthPending = sqliteTable("oauth_pending", {
  tokenHash: text("token_hash").primaryKey(),
  provider: text("provider").notNull(),
  expiresAt: integer("expires_at").notNull(),
  subjectHash: text("subject_hash"),
}, table => [index("oauth_pending_expiry").on(table.expiresAt)]);

export const emailAuthCodes = sqliteTable("email_auth_codes", {
  email: text("email").primaryKey(),
  codeHash: text("code_hash").notNull(),
  expiresAt: integer("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  verifiedAt: integer("verified_at"),
  proofHash: text("proof_hash"),
  proofExpiresAt: integer("proof_expires_at"),
  createdAt: integer("created_at").notNull(),
});

export const authSessions = sqliteTable("auth_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  createdAt: integer("created_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
}, table => [index("auth_sessions_owner").on(table.userId), index("auth_sessions_expiry").on(table.expiresAt)]);

export const authRateLimits = sqliteTable("auth_rate_limits", {
  keyHash: text("key_hash").primaryKey(),
  bucket: integer("bucket").notNull(),
  count: integer("count").notNull(),
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
