export function mapStats(item) {
  const hp = item.price;
  // Add randomness: atk can be up to 1.5x, def up to 1.5x
  let attack = parseInt(item.size);
  if (isNaN(attack)) attack = 10;
  attack = Math.round(attack * (1 + Math.random() * 0.5)); // 1.0x to 1.5x

  let defense = 5;
  switch(item.category) {
    case "shoes": defense = 15; break;
    case "tops": defense = 8; break;
    case "bottoms": defense = 10; break;
    default: defense = 5;
  }
  defense = Math.round(defense * (1 + Math.random() * 0.5)); // 1.0x to 1.5x

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

export function battleRound(attacker, defender) {
  // 8% chance for critical hit
  const isCrit = Math.random() < 0.08;

  // Randomize atk and def for this round (±10%)
  const atk = Math.round(attacker.attack * (0.9 + Math.random() * 0.2)); // 0.9x to 1.1x
  const def = Math.round(defender.defense * (0.9 + Math.random() * 0.2)); // 0.9x to 1.1x

  let hitChance;
  if (atk >= 2 * def) {
    hitChance = 1.0;
  } else if (atk === def) {
    hitChance = 0.75;
  } else if (def >= 2 * atk) {
    hitChance = 0.25;
  } else {
    hitChance = 0.75 * (atk / def) + 0.25;
    if (hitChance > 1) hitChance = 1;
    if (hitChance < 0.25) hitChance = 0.25;
  }

  if (Math.random() < hitChance) {
    // Damage: 70% to 100% of atk*20, or crit: at least 250, up to 2x atk*20
    let baseDamage = atk * 20;
    let damage;
    if (isCrit) {
      // Crit is always at least 250, up to 2x baseDamage, with some randomness
      damage = Math.max(
        250,
        Math.round(baseDamage * (1.2 + Math.random() * 0.8)) // 1.2x to 2.0x
      );
    } else {
      damage = Math.round(baseDamage * (0.7 + Math.random() * 0.3)); // 0.7x to 1.0x
    }
    defender.hp -= damage;
    if (defender.hp < 0) defender.hp = 0;
    let result = `${attacker.displayName} hits ${defender.displayName} for ${damage} damage!`;
    if (isCrit) result += " Critical hit!";
    return result;
  } else {
    return `${attacker.displayName} missed!`;
  }
}
