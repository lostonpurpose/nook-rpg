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

export function battleRound(attacker, defender) {
  const damage = Math.max(1, attacker.attack - defender.defense);
  defender.hp -= damage;
  if (defender.hp < 0) defender.hp = 0;
  return `${attacker.displayName} hits ${defender.displayName} for ${damage} damage!`;
}
