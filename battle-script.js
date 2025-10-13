export function mapStats(item, isEnemy = false) {
  const hp = item.price;
  let attack = parseInt(item.size);
  if (isNaN(attack)) attack = 10;
  attack = Math.round(attack * (1 + Math.random() * 0.5));
  let defense = 5;
  switch(item.category) {
    case "shoes": defense = 15; break;
    case "tops": defense = 8; break;
    case "bottoms": defense = 10; break;
    default: defense = 5;
  }
  defense = Math.round(defense * (1 + Math.random() * 0.5));

  // --- Enemy stat boost ---
  let hpBoost = 1, atkBoost = 1, defBoost = 1;
  if (isEnemy) {
    // hpBoost = 1.25;   // 25% more HP
    atkBoost = 1.25;  // 25% more ATK
    defBoost = 1.2;   // 20% more DEF
  }

  const displayName = item.brand_name || "Unknown";
  let expToNext;
  if (hp < 2000) expToNext = 70;
  else if (hp < 10000) expToNext = 100;
  else if (hp < 30000) expToNext = 190;
  else if (hp < 100000) expToNext = 330;
  else expToNext = 450;

  return { 
    ...item, 
    hp: Math.round(hp * hpBoost), 
    maxHp: Math.round(hp * hpBoost), 
    attack: Math.round(attack * atkBoost), 
    defense: Math.round(defense * defBoost), 
    exp: 0, 
    level: 1,
    expToNext,
    dead: false,
    displayName,
  };
}

export function battleRound(attacker, defender) {
  let critBonus = 0;
  if (attacker.chosenAbilities && attacker.chosenAbilities.includes('critUp')) critBonus += 0.05;
  const isCrit = Math.random() < (0.08 + critBonus);
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
    let baseDamage = atk * 7 + defender.hp * hpPercent;
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
    if (member.maxHp < 2000) member.expToNext = 70;
    else if (member.maxHp < 10000) member.expToNext = 100;
    else if (member.maxHp < 30000) member.expToNext = 190;
    else if (member.maxHp < 100000) member.expToNext = 330;
    else member.expToNext = 450;
  }
  while (member.exp >= member.expToNext) {
    member.exp -= member.expToNext;
    member.level = (member.level || 1) + 1;
    member.expToNext = Math.round(member.expToNext * 1.6);
    // Increase stats by 15-20%
    member.maxHp = Math.round(member.maxHp * (1.15 + Math.random() * 0.05));
    member.hp = Math.min(member.hp + Math.round(member.maxHp * 0.25), member.maxHp); // Heal 25% of new maxHp on level up
    member.attack = Math.round(member.attack * (1.15 + Math.random() * 0.05));
    member.defense = Math.round(member.defense * (1.15 + Math.random() * 0.05));
    leveledUp = true;
  }
  return leveledUp;
}
