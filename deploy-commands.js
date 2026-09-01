import "dotenv/config";
import { REST, Routes } from "discord.js";
import { commands } from "./commands.js";
const rest=new REST({version:"10"}).setToken(process.env.DISCORD_TOKEN);
await rest.put(Routes.applicationCommands(process.env.CLIENT_ID),{body:commands.map(c=>c.toJSON())});
console.log(`Registered ${commands.length} commands.`);
