import crypto from "node:crypto";
import { cardRegistry } from "./definitions.js";
import { applyEffects } from "./effects.js";
import { lootboxChance, openLootbox } from "./lootbox.js";
import { clearGame, getPlayer, saveGame, atomicAddVP, atomicSpendVP } from "./repository.js";
import { config } from "./config.js";

const games=new Map();

function difficulty(round){ return Math.min(100,Math.max(1,Math.floor(1+(round-1)*2))); }
function deathSlots(d){ return d<35?0:d<70?1:2; }

function eligible(d) {
  return cardRegistry.all().filter(c=>d>=c.minDifficulty && d<=c.maxDifficulty);
}
function weightedPick(cards) {
  const total=cards.reduce((s,c)=>s+Number(c.chance||1),0);
  let n=Math.random()*total;
  for(const c of cards){n-=Number(c.chance||1);if(n<=0)return c;}
  return cards.at(-1);
}
function deckFor(d) {
  const pool=eligible(d), result=[];
  const positive=pool.filter(c=>c.classification!=="DEATH" && !c.effects?.some(e=>e.type==="DEATH"));
  if(!pool.length || positive.length===0) throw new Error("No valid cards configured for this difficulty");
  while(result.length<5) {
    let c=weightedPick(pool);
    if(d<35 && (c.classification==="DEATH" || c.effects?.some(e=>e.type==="DEATH"))) continue;
    if(!result.some(x=>x.id===c.id)) result.push(c);
  }
  const deathCount=result.filter(c=>c.classification==="DEATH"||c.effects?.some(e=>e.type==="DEATH")).length;
  const allowed=deathSlots(d);
  if(deathCount>allowed) {
    const safe=positive.find(c=>!result.some(x=>x.id===c.id));
    if(safe) {
      for(let i=0;i<result.length;i++) if(result[i].classification==="DEATH"||result[i].effects?.some(e=>e.type==="DEATH")) {result[i]=safe;break;}
    }
  }
  return result;
}

export class DeckEngine {
  async start(userId,entry) {
    if(!Number.isSafeInteger(entry)||entry<=0) throw new Error("INVALID_ENTRY");
    if(games.has(userId)) throw new Error("GAME_ALREADY_ACTIVE");
    const player=await getPlayer(userId);
    if(player.gameState) throw new Error("GAME_ALREADY_ACTIVE");
    await atomicSpendVP(userId,entry);
    const state={id:crypto.randomUUID(),userId,entry,pot:entry,round:1,difficulty:1,shields:0,deck:deckFor(1),selected:false,startedAt:Date.now(),expiresAt:Date.now()+config.cardTimeoutMs,eventLog:[]};
    await saveGame(userId,state); games.set(userId,state); return state;
  }

  async restore(userId) {
    const player=await getPlayer(userId);
    if(!player.gameState) return null;
    const s=player.gameState;
    if(Date.now()>=Number(s.expiresAt||0)) {
      await clearGame(userId); games.delete(userId); await atomicAddVP(userId,Number(s.entry||0)); return null;
    }
    games.set(userId,s); return s;
  }

  get(userId){return games.get(userId) ?? null;}

  async select(userId,index) {
    const state=games.get(userId) ?? await this.restore(userId);
    if(!state) throw new Error("NO_GAME");
    if(state.selected) throw new Error("ROUND_ALREADY_RESOLVED");
    if(Date.now()>=state.expiresAt) {
      await clearGame(userId); games.delete(userId); await atomicAddVP(userId,Number(state.entry)); throw new Error("TIMEOUT");
    }
    if(!Number.isInteger(index)||index<0||index>=state.deck.length) throw new Error("INVALID_CARD");
    state.selected=true;
    const card=state.deck[index];
    const eventLog=[];
    const ctx={
      userId,vp:(await getPlayer(userId)).vp,pot:BigInt(state.pot),shields:state.shields,
      death:false,deathDamage:0,maxPot:config.maxPot,eventLog,
      setVP:async vp=>{ const current=(await getPlayer(userId)).vp; const delta=Number(vp-current); if(delta>0) await atomicAddVP(userId,delta); else if(delta<0) await atomicSpendVP(userId,-delta); }
    };
    let effects=card.effects;
    if(Array.isArray(card.outcomes)) {
      const total=card.outcomes.reduce((s,o)=>s+Number(o.weight||0),0); let n=Math.random()*total;
      for(const o of card.outcomes){n-=Number(o.weight||0);if(n<=0){effects=o.effects;break;}}
    }
    await applyEffects(ctx,effects||[]);
    state.pot=Number(Math.min(config.maxPot,ctx.pot)); state.shields=ctx.shields;
    const death=ctx.death;
    if(death && state.shields>0){state.shields--; state.eventLog=[...eventLog,"Shield consumed"]; state.selected=false;}
    else if(death){ await clearGame(userId); games.delete(userId); return {status:"DEATH",card,eventLog}; }
    if(lootboxChance()) {
      try { const reward=await openLootbox(userId); state.lootbox=reward; } catch(e){console.error("Lootbox:",e);}
    } else state.lootbox=null;
    state.round++; state.difficulty=difficulty(state.round); state.deck=deckFor(state.difficulty);
    state.selected=false; state.expiresAt=Date.now()+config.cardTimeoutMs; state.eventLog=eventLog;
    await saveGame(userId,state);
    games.set(userId,state);
    return {status:"CONTINUE",card,eventLog,lootbox:state.lootbox,state};
  }

  async cashout(userId) {
    const s=games.get(userId) ?? await this.restore(userId); if(!s) throw new Error("NO_GAME");
    if(Date.now()>=s.expiresAt){await clearGame(userId);games.delete(userId);await atomicAddVP(userId,s.entry);throw new Error("TIMEOUT");}
    await atomicAddVP(userId,Math.min(Number(config.maxPot),Number(s.pot)));
    await clearGame(userId); games.delete(userId);
    return Number(s.pot);
  }

  async timeoutSweep() {
    for(const [id,s] of games) if(Date.now()>=s.expiresAt) {
      await clearGame(id); games.delete(id); await atomicAddVP(id,Number(s.entry)).catch(()=>{});
    }
  }
}
