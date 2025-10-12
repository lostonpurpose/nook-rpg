export function mapStats(item) {
  const hp = item.price;
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

  // EXP thresholds by HP tier
  let expToNext;
  if (hp < 2000) expToNext = 30;
  else if (hp < 10000) expToNext = 50;
  else if (hp < 30000) expToNext = 80;
  else if (hp < 100000) expToNext = 150;
  else expToNext = 300;

  return { 
    ...item, 
    hp, 
    maxHp: hp, 
    attack, 
    defense, 
    exp: 0, 
    level: 1,
    expToNext,
    dead: false,
    displayName,
  };
}

export function battleRound(attacker, defender) {
  const isCrit = Math.random() < 0.08;
  const atk = Math.round(attacker.attack * (0.9 + Math.random() * 0.2));
  const def = Math.round(defender.defense * (0.9 + Math.random() * 0.2));

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
    // Randomize HP percent between 0.05 and 0.11
    const hpPercent = 0.05 + Math.random() * 0.06; // 0.05 to 0.11
    let baseDamage = atk * 3 + defender.hp * hpPercent;
    // Optionally, keep a small random variation (e.g., ±15%)
    let damage;
    if (isCrit) {
      damage = Math.max(
        250,
        Math.round(baseDamage * (1.2 + Math.random() * 0.8))
      );
    } else {
      damage = Math.round(baseDamage * (0.85 + Math.random() * 0.15)); // 0.85x to 1.0x
    }
    defender.hp -= damage;
    if (defender.hp < 0) defender.hp = 0;
    let result = `${attacker.displayName} hits ${defender.displayName} for ${damage} damage!`;
    if (isCrit) result += " Critical hit!";
    return { log: result, damage, hit: true, isCrit };
  } else {
    return { log: `${attacker.displayName} missed!`, damage: 0, hit: false, isCrit: false };
  }
}

export function checkLevelUp(member) {
  let leveledUp = false;
  // Recalculate expToNext for level 2 based on maxHp
  if (!member.expToNext) {
    if (member.maxHp < 2000) member.expToNext = 30;
    else if (member.maxHp < 10000) member.expToNext = 50;
    else if (member.maxHp < 30000) member.expToNext = 80;
    else if (member.maxHp < 100000) member.expToNext = 150;
    else member.expToNext = 300;
  }
  while (member.exp >= member.expToNext) {
    member.exp -= member.expToNext;
    member.level = (member.level || 1) + 1;
    member.expToNext = Math.round(member.expToNext * 1.6);
    // Increase stats by 15-20%
    member.maxHp = Math.round(member.maxHp * (1.15 + Math.random() * 0.05));
    member.hp = member.maxHp;
    member.attack = Math.round(member.attack * (1.15 + Math.random() * 0.05));
    member.defense = Math.round(member.defense * (1.15 + Math.random() * 0.05));
    leveledUp = true;
  }
  return leveledUp;
}
