import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// All runtime data files live in the repository root alongside this module.
const dir = path.dirname(fileURLToPath(import.meta.url));
const cardsFile = path.join(dir, "cards.json");
const collectiblesFile = path.join(dir, "collectibles.json");
let cards = [];
let collectibles = [];

function validateCard(c) {
  if (!c?.id || !c?.name || !c?.description || !c?.rarity) throw new Error("Invalid card required fields");
  if (!(c.chance >= 0 && c.chance <= 100)) throw new Error(`Invalid chance for ${c.id}`);
  if (!(Number.isInteger(c.minDifficulty) && Number.isInteger(c.maxDifficulty) && c.minDifficulty >= 1 && c.maxDifficulty <= 100 && c.minDifficulty <= c.maxDifficulty)) throw new Error(`Invalid difficulty for ${c.id}`);
  if (!Array.isArray(c.effects) && !Array.isArray(c.outcomes)) throw new Error(`Missing effects for ${c.id}`);
}

function reload() {
  const rawCards = JSON.parse(fs.readFileSync(cardsFile, "utf8"));
  const rawCollectibles = JSON.parse(fs.readFileSync(collectiblesFile, "utf8"));
  rawCards.forEach(validateCard);
  cards = rawCards;
  collectibles = rawCollectibles;
}

reload();

for (const f of [cardsFile, collectiblesFile]) {
  fs.watch(f, { persistent: false }, () => {
    try {
      reload();
    } catch (e) {
      console.error("Registry reload rejected:", e.message);
    }
  });
}

export const cardRegistry = {
  all: () => cards,
  get: id => cards.find(x => x.id === id),
  collectibles: () => collectibles
};

export const collectibleRegistry = {
  all: () => collectibles,
  get: id => collectibles.find(x => x.id === id)
};
