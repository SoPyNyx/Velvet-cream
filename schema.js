import { pgTable, text, bigint, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  userId: text("user_id").primaryKey(),
  vp: bigint("vp", {mode:"bigint"}).notNull(),
  gameState: text("game_state"),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull()
});

export const playerItems = pgTable("player_items", {
  userId: text("user_id").notNull(),
  itemId: text("item_id").notNull(),
  quantity: bigint("quantity", {mode:"bigint"}).notNull(),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull()
}, t => ({pk: primaryKey({columns:[t.userId,t.itemId]})}));

export const playerRecovery = pgTable("player_recovery", {
  userId: text("user_id").primaryKey(),
  streak: bigint("streak", {mode:"bigint"}),
  lastClaimAt: timestamp("last_claim_at", {withTimezone:true}),
  nextClaimAt: timestamp("next_claim_at", {withTimezone:true}),
  updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull()
});

export const botAdmins = pgTable("bot_admins", {
  userId: text("user_id").primaryKey(),
  addedAt: timestamp("added_at", {withTimezone:true}).defaultNow().notNull()
});

export const botAdminPermissions = pgTable("bot_admin_permissions", {
  userId: text("user_id").notNull(),
  permission: text("permission").notNull()
}, t => ({pk: primaryKey({columns:[t.userId,t.permission]})}));

export const musicTracks = pgTable("music_tracks", {
  id: bigint("id",{mode:"bigint"}).primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: bigint("size", {mode:"bigint"}),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull()
});
