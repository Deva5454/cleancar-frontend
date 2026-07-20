/**
 * carModelLookup — real model-name-to-category matching, so a customer
 * can type their car's model instead of picking a category themselves.
 *
 * Built on the real VEHICLE_CATEGORIES_CONFIG examples already used
 * elsewhere in the app (subscriptionPlans.ts), extended with additional
 * well-known Indian market models per category — not a comprehensive
 * automotive database, since building one accurately from scratch risks
 * mis-categorizing a real car into the wrong price tier. Anything not
 * recognized here is treated honestly as "not recognized" rather than
 * silently guessed, since a wrong category means wrong pricing.
 *
 * Scoped to 4-wheeler categories only — 2-wheeler categories are
 * intentionally excluded from this lookup and from the booking flow
 * that uses it.
 */

import type { VehicleCategory } from "../../data/subscriptionPlans";

// Real keyword → category mapping. Keys are lowercase model/brand
// fragments; matching is substring-based against whatever the customer
// types, so "swift dzire vxi" still matches "swift".
const MODEL_KEYWORDS: Record<string, VehicleCategory> = {
  // Hatchback / Compact Sedan
  "swift": "Hatchback / Compact Sedan",
  "dzire": "Hatchback / Compact Sedan",
  "baleno": "Hatchback / Compact Sedan",
  "wagon r": "Hatchback / Compact Sedan",
  "wagonr": "Hatchback / Compact Sedan",
  "alto": "Hatchback / Compact Sedan",
  "celerio": "Hatchback / Compact Sedan",
  "i20": "Hatchback / Compact Sedan",
  "i10": "Hatchback / Compact Sedan",
  "grand i10": "Hatchback / Compact Sedan",
  "aura": "Hatchback / Compact Sedan",
  "nexon": "Hatchback / Compact Sedan",
  "tiago": "Hatchback / Compact Sedan",
  "tigor": "Hatchback / Compact Sedan",
  "amaze": "Hatchback / Compact Sedan",
  "punch": "Hatchback / Compact Sedan",
  "kwid": "Hatchback / Compact Sedan",
  "triber": "Hatchback / Compact Sedan",
  "glanza": "Hatchback / Compact Sedan",

  // SUV / MUV / Sedan
  "creta": "SUV / MUV / Sedan",
  "seltos": "SUV / MUV / Sedan",
  "city": "SUV / MUV / Sedan",
  "verna": "SUV / MUV / Sedan",
  "innova": "SUV / MUV / Sedan",
  "ertiga": "SUV / MUV / Sedan",
  "venue": "SUV / MUV / Sedan",
  "brezza": "SUV / MUV / Sedan",
  "xuv300": "SUV / MUV / Sedan",
  "xuv 300": "SUV / MUV / Sedan",
  "harrier": "SUV / MUV / Sedan",
  "hector": "SUV / MUV / Sedan",
  "kushaq": "SUV / MUV / Sedan",
  "taigun": "SUV / MUV / Sedan",
  "carens": "SUV / MUV / Sedan",
  "grand vitara": "SUV / MUV / Sedan",
  "compass": "SUV / MUV / Sedan",
  "ciaz": "SUV / MUV / Sedan",
  "octavia": "SUV / MUV / Sedan",
  "slavia": "SUV / MUV / Sedan",
  "virtus": "SUV / MUV / Sedan",

  // Luxury / Large SUV
  "fortuner": "Luxury / Large SUV",
  "endeavour": "Luxury / Large SUV",
  "xuv700": "Luxury / Large SUV",
  "xuv 700": "Luxury / Large SUV",
  "scorpio": "Luxury / Large SUV",
  "gloster": "Luxury / Large SUV",
  "safari": "Luxury / Large SUV",
  "mercedes": "Luxury / Large SUV",
  "bmw": "Luxury / Large SUV",
  "audi": "Luxury / Large SUV",
  "gls": "Luxury / Large SUV",
  "gle": "Luxury / Large SUV",
  "glc": "Luxury / Large SUV",
  "x5": "Luxury / Large SUV",
  "x7": "Luxury / Large SUV",
  "q7": "Luxury / Large SUV",
  "q5": "Luxury / Large SUV",
  "land cruiser": "Luxury / Large SUV",
  "range rover": "Luxury / Large SUV",
  "defender": "Luxury / Large SUV",
};

export function detectVehicleCategory(modelInput: string): VehicleCategory | null {
  const normalized = modelInput.trim().toLowerCase();
  if (!normalized) return null;
  // Check longer keywords first, so "grand i10" matches before "i10"
  const sortedKeywords = Object.keys(MODEL_KEYWORDS).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeywords) {
    if (normalized.includes(keyword)) return MODEL_KEYWORDS[keyword];
  }
  return null;
}
