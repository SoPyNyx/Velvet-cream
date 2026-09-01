export const EFFECTS=new Set(["ADD_VP","REMOVE_VP","MULTIPLY","DIVIDE","GEM","DEATH","SHIELD","STEAL","JACKPOT","COLLECTIBLE"]);

export function validateEffects(effects){
  if(!Array.isArray(effects))throw new Error("Effects must be an array");
  for(const e of effects){if(!EFFECTS.has(e.type))throw new Error(`Unknown effect: ${e.type}`);if(e.type==="COLLECTIBLE"&&!e.itemId)throw new Error("COLLECTIBLE requires itemId");}
}

export async function applyEffects(ctx,effects){
  validateEffects(effects);
  for(const e of effects){
    switch(e.type){
      case "ADD_VP": {const amount=Math.max(0,Math.floor(Number(e.amount||0)));ctx.score+=BigInt(amount);ctx.eventLog.push(`+${amount} points`);break;}
      case "REMOVE_VP": {const amount=Math.max(0,Math.floor(Number(e.amount||0)));const removed=ctx.score<BigInt(amount)?ctx.score:BigInt(amount);ctx.score-=removed;ctx.eventLog.push(`-${removed} points`);break;}
      case "MULTIPLY": {const factor=Math.max(1,Number(e.factor||1));ctx.score=BigInt(Math.min(Number(ctx.maxScore),Number(ctx.score)*factor));ctx.eventLog.push(`Score ×${factor}`);break;}
      case "DIVIDE": {const factor=Math.max(1,Number(e.factor||1));ctx.score=BigInt(Math.floor(Number(ctx.score)/factor));ctx.eventLog.push(`Score ÷${factor}`);break;}
      case "GEM": ctx.eventLog.push("Gem effect");break;
      case "DEATH": ctx.death=true;ctx.deathDamage=Math.max(1,Number(e.damage||1));break;
      case "SHIELD": ctx.shields+=Math.max(1,Number(e.amount||1));break;
      case "STEAL": ctx.eventLog.push("Steal effect resolved");break;
      case "JACKPOT": {const multiplier=Math.max(1,Number(e.multiplier||1));ctx.score=BigInt(Math.min(Number(ctx.maxScore),Number(ctx.score)*multiplier));ctx.eventLog.push(`Score ×${multiplier}`);break;}
      case "COLLECTIBLE": await ctx.addItem(e.itemId);ctx.eventLog.push(`Collectible: ${e.itemId}`);break;
    }
  }
}
