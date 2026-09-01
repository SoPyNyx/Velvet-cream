import { EmbedBuilder } from "discord.js";
const C=0x24090f;
export const velvetEmbed=(title,description)=>new EmbedBuilder().setColor(C).setTitle(title).setDescription(description).setFooter({text:"VELVET"});
export function deckEmbed(s){return new EmbedBuilder().setColor(C).setTitle("VELVET DECK").setDescription(`Round **${s.round}** · Difficulty **${s.difficulty}/100**\nPot **${s.pot.toLocaleString()} VP** · Entry **${s.entry.toLocaleString()} VP**\nShields **${s.shields}**\n\nChoose one card. You have **15 seconds**.`);}
