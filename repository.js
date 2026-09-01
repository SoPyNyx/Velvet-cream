import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "./db.js";
import { players, playerItems, playerRecovery, botAdmins, botAdminPermissions, musicTracks } from "./schema.js";
import { config } from "./config.js";

export async function ensurePlayer(userId) {
  await db.insert(players).values({userId, vp: BigInt(config.defaultVP)}).onConflictDoNothing();
  return (await db.select().from(players).where(eq(players.userId,userId)).limit(1))[0];
}

export async function getPlayer(userId) {
  return (await db.select().from(players).where(eq(players.userId,userId)).limit(1))[0] ?? await ensurePlayer(userId);
}

export async function atomicSpendVP(userId, amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("INVALID_AMOUNT");
  const r = await db.update(players).set({vp:sql`${players.vp} - ${BigInt(amount)}`,updatedAt:new Date()})
    .where(and(eq(players.userId,userId),sql`${players.vp} >= ${BigInt(amount)}`)).returning({vp:players.vp});
  if (!r.length) throw new Error("INSUFFICIENT_VP");
  return r[0].vp;
}

export async function atomicAddVP(userId, amount) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("INVALID_AMOUNT");
  const r = await db.update(players).set({vp:sql`${players.vp} + ${BigInt(amount)}`,updatedAt:new Date()})
    .where(eq(players.userId,userId)).returning({vp:players.vp});
  if (!r.length) await ensurePlayer(userId);
  if (!r.length && amount) return (await atomicAddVP(userId, amount));
  return r[0]?.vp ?? BigInt(config.defaultVP);
}

export async function saveGame(userId, state) {
  await db.update(players).set({gameState:state,updatedAt:new Date()}).where(eq(players.userId,userId));
}

export async function clearGame(userId) {
  await db.update(players).set({gameState:null,updatedAt:new Date()}).where(eq(players.userId,userId));
}

export async function addItem(userId,itemId) {
  await db.insert(playerItems).values({userId,itemId,quantity:1})
    .onConflictDoUpdate({target:[playerItems.userId,playerItems.itemId],set:{quantity:sql`${playerItems.quantity}+1`}});
  return (await db.select().from(playerItems).where(and(eq(playerItems.userId,userId),eq(playerItems.itemId,itemId))).limit(1))[0];
}

export async function getItems(userId) {
  return db.select().from(playerItems).where(eq(playerItems.userId,userId)).orderBy(asc(playerItems.itemId));
}

export async function leaderboard(limit=10) {
  return db.select().from(players).orderBy(desc(players.vp)).limit(limit);
}

export async function getRecovery(userId) {
  return (await db.select().from(playerRecovery).where(eq(playerRecovery.userId,userId)).limit(1))[0];
}

export async function claimRecovery(userId, reward) {
  const now = new Date();
  const next = new Date(now.getTime()+config.recoveryCooldownMs);
  const result = await db.transaction(async tx => {
    const current = (await tx.select().from(playerRecovery).where(eq(playerRecovery.userId,userId)).for("update").limit(1))[0];
    if (current?.nextClaimAt && current.nextClaimAt > now) throw new Error("COOLDOWN");
    const streak = (current?.streak ?? 0) + 1;
    await tx.insert(playerRecovery).values({userId,streak,lastClaimAt:now,nextClaimAt:next,updatedAt:now})
      .onConflictDoUpdate({target:playerRecovery.userId,set:{streak,lastClaimAt:now,nextClaimAt:next,updatedAt:now}});
    await tx.update(players).set({vp:sql`${players.vp}+${BigInt(reward)}`,updatedAt:now}).where(eq(players.userId,userId));
    return {streak,next};
  });
  return result;
}

export async function addAdmin(userId) {
  await db.insert(botAdmins).values({userId}).onConflictDoNothing();
}
export async function removeAdmin(userId) {
  await db.delete(botAdmins).where(eq(botAdmins.userId,userId));
  await db.delete(botAdminPermissions).where(eq(botAdminPermissions.userId,userId));
}
export async function isAdmin(userId) {
  return !!(await db.select().from(botAdmins).where(eq(botAdmins.userId,userId)).limit(1))[0];
}
export async function setAdminPermissions(userId, permissions) {
  await db.delete(botAdminPermissions).where(eq(botAdminPermissions.userId,userId));
  if (permissions.length) await db.insert(botAdminPermissions).values(permissions.map(permission=>({userId,permission})));
}
export async function getAdminPermissions(userId) {
  return (await db.select().from(botAdminPermissions).where(eq(botAdminPermissions.userId,userId))).map(x=>x.permission);
}
export async function listAdmins() {
  return db.select().from(botAdmins).orderBy(asc(botAdmins.userId));
}

export async function addMusicTrack(track) {
  return (await db.insert(musicTracks).values(track).returning())[0];
}
export async function removeMusicTrack(id) {
  return (await db.delete(musicTracks).where(eq(musicTracks.id,BigInt(id))).returning())[0];
}
export async function listMusicTracks() {
  return db.select().from(musicTracks).orderBy(asc(musicTracks.name));
}
export async function findMusicByName(name) {
  return (await db.select().from(musicTracks).where(eq(musicTracks.name,name)).limit(1))[0];
}
