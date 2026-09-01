import { atomicAddVP, addItem } from "./repository.js";

export const EFFECTS = new Set(["ADD_VP","REMOVE_VP","MULTIPLY","DIVIDE","GEM","DEATH","SHIELD","STEAL","JACKPOT","COLLECTIBLE"]);

export function validateEffects(effects) {
  if (!Array.isArray(effects)) throw new Error("Effects must be an array");
  for (const e of effects) {
    if (!EFFECTS.has(e.type)) throw new Error(`Unknown effect: ${e.type}`);
    if (e.type === "COLLECTIBLE" && !e.itemId) throw new Error("COLLECTIBLE requires itemId");
  }
}

export async function applyEffects(ctx,effects) {
  validateEffects(effects);
  for (const e of effects) {
    switch(e.type) {
      case "ADD_VP":
        await atomicAddVP(ctx.userId, Math.max(0,Math.floor(Number(e.amount||0))));
        ctx.eventLog.push(`+${e.amount} VP`);
        break;
      case "REMOVE_VP": {
        const amount=Math.max(0,Math.floor(Number(e.amount||0)));
        const before=Number(ctx.vp);
        const removed=Math.min(before,amount);
        if (removed) { ctx.vp=BigInt(before-removed); await ctx.setVP(ctx.vp); }
        ctx.eventLog.push(`-${removed} VP`);
        break;
      }
      case "MULTIPLY": ctx.pot=BigInt(Math.min(Number(ctx.maxPot),Number(ctx.pot)*Number(e.factor||1))); break;
      case "DIVIDE": ctx.pot=BigInt(Math.floor(Number(ctx.pot)/Math.max(1,Number(e.factor||1)))); break;
      case "GEM": ctx.eventLog.push("Gem effect"); break;
      case "DEATH":
        ctx.death = true; ctx.deathDamage = Math.max(1,Number(e.damage||1)); break;
      case "SHIELD":
        ctx.shields += Math.max(1,Number(e.amount||1)); break;
      case "STEAL":
        ctx.eventLog.push("Steal effect resolved"); break;
      case "JACKPOT":
        ctx.pot=BigInt(Math.min(Number(ctx.maxPot),Number(ctx.pot)*Math.max(1,Number(e.multiplier||1))));
        break;
      case "COLLECTIBLE":
        await addItem(ctx.userId,e.itemId); ctx.eventLog.push(`Collectible: ${e.itemId}`); break;
    }
  }
}
