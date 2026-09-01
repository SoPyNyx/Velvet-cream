import {
  Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle
} from "discord.js";
import { config } from "../config.js";
import { DeckEngine } from "../game/engine.js";
import { collectibleRegistry } from "../game/definitions.js";
import { getPlayer, getItems, leaderboard, claimRecovery, addAdmin, removeAdmin, listAdmins, setAdminPermissions, listMusicTracks, findMusicByName } from "../database/repository.js";
import { can, ownerOnly, PERMISSIONS } from "../utils/permissions.js";
import { velvetEmbed, deckEmbed } from "./embeds.js";
import { addTrack, removeTrack, playTrack, stop } from "../services/music.js";

export const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildVoiceStates]});
export const engine=new DeckEngine();

const errors={
  INVALID_ENTRY:"Entry must be a positive VP amount.",
  INSUFFICIENT_VP:"You do not have enough VP.",
  GAME_ALREADY_ACTIVE:"You already have an active Deck game.",
  NO_GAME:"No active Deck game.",
  ROUND_ALREADY_RESOLVED:"This card has already been resolved.",
  INVALID_CARD:"Invalid card.",
  TIMEOUT:"Time expired. Your entry was returned; the accumulated pot was not.",
  INSUFFICIENT_VP:"You do not have enough VP.",
  COOLDOWN:"This reward is still on cooldown.",
  NO_FILE:"Attach an audio file.",
  FILE_TOO_LARGE:"Audio file is too large.",
  INVALID_AUDIO_TYPE:"Unsupported audio MIME type.",
  DUPLICATE_TRACK:"A track with that name already exists.",
  TRACK_NOT_FOUND:"Track not found."
};

function replyError(i,e){return i.reply({embeds:[velvetEmbed("VELVET",errors[e.message]||e.message||"Something went wrong.")],ephemeral:true});}
function cardRow(state){return new ActionRowBuilder().addComponents(state.deck.map((c,n)=>new ButtonBuilder().setCustomId(`deck:${state.id}:${n}`).setLabel(`${n+1} · ${c.name}`.slice(0,80)).setStyle(ButtonStyle.Secondary)));}

client.once(Events.ClientReady,async()=>{console.log(`VELVET online as ${client.user.tag}`);});

client.on(Events.InteractionCreate,async i=>{
  try {
    if(i.isButton() && i.customId.startsWith("deck:")){
      const [,gameId,index]=i.customId.split(":");
      const state=engine.get(i.user.id) || await engine.restore(i.user.id);
      if(!state || state.id!==gameId) return i.reply({content:"This game is no longer active.",ephemeral:true});
      await i.deferUpdate();
      const result=await engine.select(i.user.id,Number(index));
      if(result.status==="DEATH") return i.editReply({embeds:[velvetEmbed("VELVET DECK — RUN ENDED",`You selected **${result.card.name}**.\nThe run ended. The accumulated pot was lost.`)],components:[]});
      const e=result.state;
      return i.editReply({embeds:[deckEmbed(e)],components:[cardRow(e)]});
    }

    if(!i.isChatInputCommand()) return;
    const u=i.user.id, name=i.commandName;

    if(name==="ping") return i.reply({embeds:[velvetEmbed("VELVET","Pong.")]});
    if(name==="vp"){const p=await getPlayer(u);return i.reply({embeds:[velvetEmbed("VELVET VP",`**${p.vp.toLocaleString()} VP**`)]});}
    if(name==="play"){
      const entry=i.options.getInteger("entry",true);
      const s=await engine.start(u,entry);
      return i.reply({embeds:[deckEmbed(s)],components:[cardRow(s)]});
    }
    if(name==="inventory"||name==="collection"){
      const items=await getItems(u);
      const lines=items.map(x=>{const c=collectibleRegistry.get(x.itemId);return c?`**${c.name}** ×${x.quantity} — ${c.rarity}`:`Unknown item ×${x.quantity}`;});
      return i.reply({embeds:[velvetEmbed(name==="collection"?"VELVET COLLECTION":"VELVET INVENTORY",lines.join("\n")||"Empty.") ]});
    }
    if(name==="leaderboard"){
      const rows=await leaderboard(10); const text=rows.map((r,n)=>`**${n+1}.** <@${r.userId}> — **${r.vp.toLocaleString()} VP**`).join("\n")||"No players yet.";
      return i.reply({embeds:[velvetEmbed("VELVET LEADERBOARD",text)]});
    }
    if(name==="daily"||name==="recovery"){
      const reward=name==="daily"?250:500;
      const r=await claimRecovery(u,reward);
      return i.reply({embeds:[velvetEmbed(name==="daily"?"VELVET DAILY":"VELVET RECOVERY",`Reward: **+${reward} VP**\nStreak: **${r.streak}**\nNext claim: <t:${Math.floor(r.next.getTime()/1000)}:R>`)]});
    }
    if(name==="admin"){
      if(!ownerOnly(u)) return i.reply({content:"Owner only.",ephemeral:true});
      const sub=i.options.getSubcommand();
      if(sub==="add"){await addAdmin(i.options.getUser("user",true).id);return i.reply("Admin added.");}
      if(sub==="remove"){await removeAdmin(i.options.getUser("user",true).id);return i.reply("Admin removed.");}
      if(sub==="list"){const a=await listAdmins();return i.reply({embeds:[velvetEmbed("VELVET ADMINS",a.map(x=>`<@${x.userId}>`).join("\n")||"None.")]});}
      const user=i.options.getUser("user",true), perms=i.options.getString("permissions",true).split(",").map(x=>x.trim()).filter(Boolean);
      if(!perms.every(x=>PERMISSIONS.includes(x))) return i.reply({content:`Invalid permission. Allowed: ${PERMISSIONS.join(", ")}`,ephemeral:true});
      await setAdminPermissions(user.id,perms); return i.reply("Permissions updated.");
    }
    if(name==="song"){
      const sub=i.options.getSubcommand();
      if(sub==="add"){
        if(!(await can(u,"MUSIC_MANAGEMENT"))) return i.reply({content:"Missing MUSIC_MANAGEMENT.",ephemeral:true});
        const track=await addTrack(i.options.getAttachment("file",true),u,i.options.getString("name",true));
        return i.reply({embeds:[velvetEmbed("MUSIC",`Added **${track.name}**.`)]});
      }
      if(sub==="remove"){
        if(!(await can(u,"MUSIC_MANAGEMENT"))) return i.reply({content:"Missing MUSIC_MANAGEMENT.",ephemeral:true});
        const t=await removeTrack(i.options.getInteger("id",true)); return i.reply(`Removed **${t.name}**.`);
      }
      if(sub==="play"){
        if(!(await can(u,"MUSIC_PLAYBACK"))) return i.reply({content:"Missing MUSIC_PLAYBACK.",ephemeral:true});
        const t=await findMusicByName(i.options.getString("name",true)); if(!t) throw new Error("TRACK_NOT_FOUND");
        const vc=i.member?.voice?.channel; if(!vc) return i.reply({content:"Join a voice channel first.",ephemeral:true});
        await playTrack(i.guild,vc,t); return i.reply(`Playing **${t.name}**.`);
      }
      if(sub==="stop"){
        if(!(await can(u,"MUSIC_PLAYBACK"))) return i.reply({content:"Missing MUSIC_PLAYBACK.",ephemeral:true});
        stop(i.guildId); return i.reply("Stopped.");
      }
    }
    if(name==="songs"){
      const tracks=await listMusicTracks(); return i.reply({embeds:[velvetEmbed("VELVET MUSIC",tracks.map(t=>`**${t.id}.** ${t.name}`).join("\n")||"Library empty.")]});
    }
    if(["join","leave"].includes(name)) return i.reply("Voice command is available through the existing voice integration.");
    if(["connect","disconnect","avatar","banner","profile","add","edit","remove","list"].includes(name)) return i.reply("This command surface is preserved; wire it to your existing OAuth/content UI when those modules are present.");
  } catch(e){console.error(e); if(i.replied||i.deferred) return i.followUp({content:errors[e.message]||"Something went wrong.",ephemeral:true}); return replyError(i,e);}
});

setInterval(()=>engine.timeoutSweep().catch(console.error),1000);
