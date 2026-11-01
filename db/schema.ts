import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const groups = sqliteTable("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  ownerId: text("owner_id").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  releaseKind: text("release_kind").notNull().default("nightly"),
  releaseHour: integer("release_hour").notNull().default(21),
  releaseWeekday: integer("release_weekday").notNull().default(0),
  settlementKind: text("settlement_kind").notNull().default("weekly"),
  scoreAgree: integer("score_agree").notNull().default(3),
  scoreNeutral: integer("score_neutral").notNull().default(1),
  scoreDisagree: integer("score_disagree").notNull().default(0),
  anonymous: integer("anonymous").notNull().default(1),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const memberships = sqliteTable("memberships", {
  groupId: text("group_id").notNull().references(() => groups.id),
  userId: text("user_id").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  joinedAt: integer("joined_at").notNull(),
}, (table) => [primaryKey({ columns: [table.groupId, table.userId] })]);

export const letters = sqliteTable("letters", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull().references(() => groups.id),
  senderId: text("sender_id").notNull(),
  recipientId: text("recipient_id").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull(),
  unlockAt: integer("unlock_at").notNull(),
  scoreAgree: integer("score_agree").notNull(),
  scoreNeutral: integer("score_neutral").notNull(),
  scoreDisagree: integer("score_disagree").notNull(),
  response: text("response"),
  scoreAwarded: integer("score_awarded"),
  respondedAt: integer("responded_at"),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  accountId: text("account_id").notNull().references(() => accounts.id),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const authAttempts = sqliteTable("auth_attempts", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: integer("reset_at").notNull(),
});
