import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addItem, atomicAddVP } from "../database/repository.js";
import { collectibleRegistry } from "./definitions.js";
import { config } from "../config.js";

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../content/lootbox.json");
let definition = JSON.parse(fs.readFileSync(file,"utf8"));

function pick(items) {
  const total=items.reduce((s,x)=>s+Number(x.weight||0),0);
  let n=Math.random()*total;
  for (const x of items) { n-=Number(x.weight||0); if(n<=0)return x; }
  return items.at(-1);
}
export function lootboxChance() { return Math.random()*100 < Number(definition.chancePercent ?? config.lootboxChance); }

export async function openLootbox(userId) {
  const reward=pick(definition.rewards||[]);
  if (!reward) throw new Error("No lootbox rewards configured");
  if (reward.type==="VP") {
    const min=Number(reward.min||1), max=Number(reward.max||min);
    const amount=Math.floor(min+Math.random()*(max-min+1));
    await atomicAddVP(userId,amount);
    return {type:"VP",amount,rarity:"COMMON"};
  }
  if (reward.type==="COLLECTIBLE") {
    if (!collectibleRegistry.get(reward.itemId)) throw new Error("Lootbox references unknown collectible");
    const item=await addItem(userId,reward.itemId);
    if (item.quantity>1) {
      await atomicAddVP(userId,Number(definition.duplicateRewardVP ?? config.duplicateCollectibleVP));
      return {type:"DUPLICATE",itemId:reward.itemId,amount:Number(definition.duplicateRewardVP ?? config.duplicateCollectibleVP)};
    }
    return {type:"COLLECTIBLE",itemId:reward.itemId};
  }
  throw new Error("Unsupported lootbox reward");
}
