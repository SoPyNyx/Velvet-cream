import { config } from "./config.js";
import { client } from "./client.js";
if(!config.token) throw new Error("DISCORD_TOKEN is required");
await client.login(config.token);
