import "dotenv/config";

export const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  ownerId: process.env.OWNER_DISCORD_ID,
  databaseUrl: process.env.DATABASE_URL,
  musicDirectory: process.env.MUSIC_DIRECTORY || "music",
  musicMaxFileSize: Number(process.env.MUSIC_MAX_FILE_SIZE || 104857600),
  recoveryCooldownMs: Number(process.env.RECOVERY_COOLDOWN_HOURS || 24) * 3600000,
  dailyCooldownMs: Number(process.env.DAILY_COOLDOWN_HOURS || 24) * 3600000,
  lootboxChance: Number(process.env.LOOTBOX_CHANCE_PERCENT || 10),
  duplicateCollectibleVP: Number(process.env.DUPLICATE_COLLECTIBLE_REWARD_VP || 15),
  maxPot: BigInt(process.env.MAX_POT || "2000000000"),
  cardTimeoutMs: Number(process.env.GAME_CARD_TIMEOUT_MS || 15000),
  defaultVP: Number(process.env.DEFAULT_PLAYER_VP || 2500)
};

if (!config.token || !config.clientId || !config.ownerId || !config.databaseUrl) {
  console.warn("Missing required environment variables. Copy .env.example to .env.");
}
