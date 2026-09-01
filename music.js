import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createAudioPlayer, createAudioResource, AudioPlayerStatus, joinVoiceChannel, NoSubscriberBehavior, StreamType } from "@discordjs/voice";
import ffmpegPath from "ffmpeg-static";
import { config } from "../config.js";
import { addMusicTrack, findMusicByName, listMusicTracks, removeMusicTrack } from "../database/repository.js";

const players=new Map();
await fs.mkdir(config.musicDirectory,{recursive:true});
const allowed=new Set(["audio/mpeg","audio/wav","audio/x-wav","audio/ogg","audio/webm","audio/mp4"]);

export async function addTrack(attachment,userId,name) {
  if(!attachment) throw new Error("NO_FILE");
  if(Number(attachment.size)>config.musicMaxFileSize) throw new Error("FILE_TOO_LARGE");
  if(!allowed.has(attachment.contentType||"")) throw new Error("INVALID_AUDIO_TYPE");
  if(await findMusicByName(name)) throw new Error("DUPLICATE_TRACK");
  const ext=path.extname(new URL(attachment.url).pathname)||".audio";
  const filename=`${crypto.randomUUID()}${ext}`;
  const target=path.join(config.musicDirectory,filename);
  const response=await fetch(attachment.url);
  if(!response.ok) throw new Error("DOWNLOAD_FAILED");
  const buf=Buffer.from(await response.arrayBuffer());
  if(buf.length>config.musicMaxFileSize) throw new Error("FILE_TOO_LARGE");
  await fs.writeFile(target,buf,{flag:"wx"});
  try { return await addMusicTrack({name,filename,originalName:attachment.name,mimeType:attachment.contentType,size:BigInt(buf.length),createdBy:userId}); }
  catch(e){await fs.rm(target,{force:true});throw e;}
}

export async function removeTrack(id) {
  const track=await removeMusicTrack(id); if(!track) throw new Error("TRACK_NOT_FOUND");
  await fs.rm(path.join(config.musicDirectory,track.filename),{force:true});
  return track;
}
export { listMusicTracks };

export async function playTrack(guild,voiceChannel,track) {
  const connection=joinVoiceChannel({channelId:voiceChannel.id,guildId:guild.id,adapterCreator:guild.voiceAdapterCreator});
  const player=createAudioPlayer({behaviors:{noSubscriber:NoSubscriberBehavior.Stop}});
  const resource=createAudioResource(path.join(config.musicDirectory,track.filename),{inputType:StreamType.Arbitrary});
  connection.subscribe(player); player.play(resource);
  players.set(guild.id,{connection,player,track});
  player.on(AudioPlayerStatus.Idle,()=>{try{connection.destroy();}catch{} players.delete(guild.id);});
  return players.get(guild.id);
}
export function stop(guildId){const p=players.get(guildId);if(!p)return false;p.player.stop();try{p.connection.destroy();}catch{}players.delete(guildId);return true;}
