# VELVET

Host-ready Node.js ESM Discord bot using Discord.js v14, PostgreSQL and Drizzle ORM.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill `DISCORD_TOKEN`, `CLIENT_ID`, `OWNER_DISCORD_ID`, and `DATABASE_URL`.
3. Run:
   `npm install`
4. Run:
   `npm run db:push`
5. Register commands:
   `npm run deploy:commands`
6. Start:
   `npm start`

Music is local-only. Put uploaded audio in `MUSIC_DIRECTORY` (default `music`).

The project intentionally keeps cards and collectibles data-driven in JSON.
