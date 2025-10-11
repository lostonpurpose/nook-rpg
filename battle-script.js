export function mapStats(item) {
  const hp = item.price;
  let attack = parseInt(item.size);
  if (isNaN(attack)) attack = 10;

  let defense = 5;
  switch(item.category) {
    case "shoes": defense = 15; break;
    case "tops": defense = 8; break;
    case "bottoms": defense = 10; break;
    default: defense = 5;
  }

  // const displayName = item.title || item.brand_name || "Unknown"; removed bc item.title sometimes too long
  const displayName = item.brand_name || "Unknown";

  return { 
    ...item, 
    hp, 
    maxHp: hp, 
    attack, 
    defense, 
    exp: 0, 
    level: 1,
    displayName,
  };
}

// New battleRound with hit chance logic
export function battleRound(attacker, defender) {
  const atk = attacker.attack;
  const def = defender.defense;

  let hitChance;
  if (atk >= 2 * def) {
    hitChance = 1.0; // Always hit
  } else if (atk === def) {
    hitChance = 0.75;
  } else if (def >= 2 * atk) {
    hitChance = 0.25;
  } else {
    // Linear interpolation between 0.25 and 1.0, leaning toward attacker
    hitChance = 0.75 * (atk / def) + 0.25;
    if (hitChance > 1) hitChance = 1;
    if (hitChance < 0.25) hitChance = 0.25;
  }

  if (Math.random() < hitChance) {
    const damage = atk * 10;
    defender.hp -= damage;
    if (defender.hp < 0) defender.hp = 0;
    return `${attacker.displayName} hits ${defender.displayName} for ${damage} damage!`;
  } else {
    return `${attacker.displayName} missed!`;
  }
}
