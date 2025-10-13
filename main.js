// Expose a function for party-creation.js to start the game
window.startBattleWithParty = function(newParty) {
  // Hide the create party button
  const createBtn = document.getElementById('load');
  if (createBtn) createBtn.style.display = "none";

  // Show the battle log only when battle starts
  const battleLog = document.getElementById("battle-log");
  if (battleLog) battleLog.style.display = "";

  party = newParty.map(p => ({
    ...p,
    hasAttackedThisTurn: false,
    abilities: [],
    chosenAbilities: []
  }));
  round = 1;
  gameOver = false;
  loadEnemiesForRound().then(() => {
    renderBattle();
    // moveLoadButtonToBottom();
  });
};
import { mapStats, battleRound, checkLevelUp } from './battle-script.js';

let party = [];
let enemies = [];
let round = 1; // 1: 1 enemy, 2: 1 enemy, 3: 2 enemies, 4: 3 enemies, 5: win
let gameOver = false;
let allAttackUsed = false;

const loadBtn = document.getElementById("load");
const battleContainer = document.getElementById("battle-container");
const battleLog = document.getElementById("battle-log");
// if (battleLog) battleLog.style.display = "";

// Move load button below battle log after first use
function moveLoadButtonToBottom() {
  if (loadBtn.parentNode !== document.body) return;
  document.body.removeChild(loadBtn);
  document.body.appendChild(loadBtn);
  loadBtn.style.margin = "20px auto 0 auto";
  loadBtn.style.display = "block";
}

// loadBtn.addEventListener("click", async () => {
//   const url = `https://kl4hylidcs3k4fazx4aojk2wpe0fbksa.lambda-url.ap-northeast-1.on.aws/items/random?limit=3&genders=mens`;
//   const res = await fetch(url);
//   const data = await res.json();
//   party = data.map(item => ({ ...mapStats(item), hasAttackedThisTurn: false }));

//   round = 1;
//   gameOver = false;
//   await loadEnemiesForRound();
//   renderBattle();
//   moveLoadButtonToBottom();
// });

async function loadEnemiesForRound() {
  let numEnemies = 1;
  let hpRanges = [];

  if (round === 1) {
    numEnemies = 1;
    hpRanges = [[2500, 5200]];
  } else if (round === 2) {
    numEnemies = 1;
    hpRanges = [[7500, 10000]];
  } else if (round === 3) {
    numEnemies = 2;
    hpRanges = [
      [12000, 22000],
      [7500, 15000]
    ];
  } else if (round >= 4) {
    numEnemies = 3;
    hpRanges = [
      [20000, 30000],
      [20000, 30000],
      [30000, 50000]
    ];
  }

  const enemyRes = await fetch(`https://kl4hylidcs3k4fazx4aojk2wpe0fbksa.lambda-url.ap-northeast-1.on.aws/items/random?limit=${numEnemies}&genders=mens`);
  const enemyData = await enemyRes.json();
  enemies = enemyData.map((item, idx) => {
    const enemy = mapStats(item, true);
    // Set HP to the specified range for this enemy
    if (hpRanges[idx]) {
      const [minHp, maxHp] = hpRanges[idx];
      const hp = Math.floor(Math.random() * (maxHp - minHp + 1)) + minHp;
      enemy.hp = hp;
      enemy.maxHp = hp;
    }
    return enemy;
  });
}

function renderBattle() {
  battleContainer.innerHTML = "";

  // Party column
  const partyCol = document.createElement("div");
  partyCol.id = "party-column";
  party.forEach((p, index) => {
    const div = document.createElement("div");
    div.className = "item-card";
    // EXP bar
    const expPercent = Math.min(100, Math.round((p.exp / (p.expToNext || 50)) * 100));
    const expBarHtml = `
      <div class="exp-bar" style="height:7px;background:#fff;width:100%;border-radius:4px;margin:3px 0 0 0;position:relative;">
        <div style="height:100%;background:#0ff;width:${expPercent}%;border-radius:4px;position:absolute;top:0;left:0;"></div>
        <span class="exp-text" style="position:absolute;left:6px;top:0;font-size:8px;line-height:7px;color:#222;z-index:1;">
          ${p.exp}/${p.expToNext}
        </span>
      </div>
    `;
    // For party members
    const hpPercent = Math.max(0, Math.round((p.hp / p.maxHp) * 100));
    let hpColor = "#2ecc71"; // green
    if (hpPercent < 25) hpColor = "#e74c3c"; // red
    else if (hpPercent < 50) hpColor = "#f1c40f"; // yellow

    div.innerHTML = `
      <div style="display:flex;align-items:center;">
        <span style="font-size:10px;font-weight:bold;margin-right:6px;">Lv.${p.level || 1}</span>
        <h3 style="flex:1;text-align:left;">${p.displayName}</h3>
      </div>
      <div class="img-stats" style="display:flex;align-items:flex-start;">
        <img src="${p.image_url}" alt="${p.title}" width="120" height="50">
        <div class="stats-column" style="display:flex;flex-direction:column;justify-content:center;margin-left:8px;">
          <p class="stat-text">ATK: ${p.attack}</p>
          <p class="stat-text">DEF: ${p.defense}</p>
        </div>
      </div>
      <div class="hp-bar">
        <div class="hp-fill" style="width:${hpPercent}%;background:${hpColor};"></div>
        <span class="hp-text">${p.hp}/${p.maxHp}</span>
      </div>
      ${expBarHtml}
      <button data-index="${index}" class="attack-btn" ${p.hasAttackedThisTurn || p.dead || gameOver ? "disabled" : ""}>Attack</button>
    `;
    if (p.dead) div.classList.add('dead-card');
    const bg = getLevelColor(p.level || 1);
    if (bg) div.style.background = bg;
    partyCol.appendChild(div);
  });

  // Enemy column (vertical stack)
  const enemyCol = document.createElement("div");
  enemyCol.id = "enemy-column";
  enemies.forEach((enemy, eIdx) => {
    const div = document.createElement("div");
    div.className = "enemy-card";
    const hpPercent = Math.max(0, Math.round((enemy.hp / enemy.maxHp) * 100));
    let hpColor = "#2ecc71";
    if (hpPercent < 25) hpColor = "#e74c3c";
    else if (hpPercent < 50) hpColor = "#f1c40f";

    div.innerHTML = `
      <h3>${enemy.displayName}</h3>
      <div class="img-stats" style="display:flex;align-items:flex-start;">
        <img src="${enemy.image_url}" alt="${enemy.title}" width="120" height="50">
        <div class="stats-column" style="display:flex;flex-direction:column;justify-content:center;margin-left:8px;">
          <p class="stat-text">ATK: ${enemy.attack}</p>
          <p class="stat-text">DEF: ${enemy.defense}</p>
        </div>
      </div>
      <div class="hp-bar">
        <div class="hp-fill" style="width:${hpPercent}%;background:${hpColor};"></div>
        <span class="hp-text">${enemy.hp}/${enemy.maxHp}</span>
      </div>
    `;
    if (enemy.hp <= 0) div.classList.add('dead-card');
    enemyCol.appendChild(div);
  });

  battleContainer.appendChild(partyCol);
  battleContainer.appendChild(enemyCol);

  // All Attack button above battle log
  let allBtn = document.getElementById("all-attack");
  if (allBtn) allBtn.remove();
  allBtn = document.createElement("button");
  allBtn.id = "all-attack";
  allBtn.innerText = "All Attack";
  allBtn.disabled = allAttackUsed || gameOver;
  allBtn.style.opacity = allBtn.disabled ? "0.5" : "1";
  allBtn.addEventListener("click", async () => {
    allBtn.disabled = true;
    allBtn.style.opacity = "0.5";
    allAttackUsed = true;
    await handleAllAttack();
  });
  document.body.insertBefore(allBtn, battleLog);

  document.querySelectorAll(".attack-btn").forEach(btn => {
    btn.addEventListener("click", async () => await handleSingleAttack(parseInt(btn.dataset.index)));
  });
}

function startPlayerTurn() {
  allAttackUsed = false;
  party.forEach(p => p.hasAttackedThisTurn = false); // <-- Add this line
  renderBattle();
}

async function handleSingleAttack(index) {
  if (!party[index] || party[index].hasAttackedThisTurn || party[index].dead || gameOver) return;
  const attacker = party[index];
  attacker.hasAttackedThisTurn = true;

  // If attackAll ability, attack all alive enemies
  if (attacker.chosenAbilities && attacker.chosenAbilities.includes('attackAll')) {
    let hitAny = false;
    for (let i = 0; i < enemies.length; i++) {
      if (enemies[i].hp > 0) {
        // Animate attack
        const partyCard = document.querySelectorAll('.item-card')[index];
        if (partyCard) partyCard.classList.add('attacking-party');
        await delay(200);
        if (partyCard) partyCard.classList.remove('attacking-party');

        const result = battleRound(attacker, enemies[i]);
        appendLog(result.log, result.isCrit ? "orange" : "green");
        if (result.isCrit) appendLog("CRITICAL HIT!", "orange");

        // Heal on attack
        if (attacker.chosenAbilities && attacker.chosenAbilities.includes('healOnAttack')) {
          const heal = Math.round(attacker.maxHp * 0.05);
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
          appendLog(`${attacker.displayName} heals for ${heal} HP!`, "cyan");
        }

        if (result.hit && !attacker.dead) {
          const expGain = Math.round(result.damage * 0.1);
          attacker.exp += expGain;
          const leveledUp = checkLevelUp(attacker);
          if (leveledUp) {
            await showLevelUpModal(`${attacker.displayName} is now level ${attacker.level}!`, attacker.level);
            await maybeShowAbilityChoice(attacker);
          }
        }

        // Animate enemy hit flash
        const enemyCard = document.querySelectorAll('.enemy-card')[i];
        if (enemyCard) enemyCard.classList.add('flash-hit');
        await delay(100);
        if (enemyCard) enemyCard.classList.remove('flash-hit');

        if (enemies[i].hp <= 0) enemies[i].dead = true;
        hitAny = true;
      }
    }
    if (attacker.hp <= 0) attacker.dead = true;
    renderBattle();

    if (enemies.every(e => e.hp <= 0)) {
      await handleVictory();
      return;
    }
    if (party.every(p => p.hasAttackedThisTurn || p.dead)) {
      await delay(1000);
      await enemyAttack();
    }
    return;
  }

  // --- Normal single attack (existing code) ---
  // Pick a random alive enemy
  const aliveEnemies = enemies.map((e, idx) => ({ e, idx })).filter(obj => obj.e.hp > 0);
  if (aliveEnemies.length === 0) return;
  const targetObj = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
  const targetIdx = targetObj.idx;
  if (targetIdx === -1) return;

  // Animate party member attack
  const partyCard = document.querySelectorAll('.item-card')[index];
  if (partyCard) partyCard.classList.add('attacking-party');
  await delay(400);
  if (partyCard) partyCard.classList.remove('attacking-party');

  // Apply damage and update state
  const result = battleRound(attacker, enemies[targetIdx]);
  appendLog(result.log, result.isCrit ? "orange" : "green");
  if (result.isCrit) appendLog("CRITICAL HIT!", "orange");

  // Heal on attack
  if (attacker.chosenAbilities && attacker.chosenAbilities.includes('healOnAttack')) {
    const heal = Math.round(attacker.maxHp * 0.05);
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
    appendLog(`${attacker.displayName} heals for ${heal} HP!`, "cyan");
  }

  if (result.hit && !attacker.dead) {
    const expGain = Math.round(result.damage * 0.1);
    attacker.exp += expGain;
    const leveledUp = checkLevelUp(attacker);
    if (leveledUp) {
      await showLevelUpModal(`${attacker.displayName} is now level ${attacker.level}!`, attacker.level);
      await maybeShowAbilityChoice(attacker);
    }
  }

  // Animate enemy hit flash AFTER attack
  const enemyCard = document.querySelectorAll('.enemy-card')[targetIdx];
  if (enemyCard) enemyCard.classList.add('flash-hit');
  await delay(200);
  if (enemyCard) enemyCard.classList.remove('flash-hit');

  if (enemies[targetIdx].hp <= 0) enemies[targetIdx].dead = true;
  if (attacker.hp <= 0) attacker.dead = true;

  renderBattle();

  if (enemies.every(e => e.hp <= 0)) {
    await handleVictory();
    return;
  }
  if (party.every(p => p.hasAttackedThisTurn || p.dead)) {
    await delay(1000);
    await enemyAttack();
  }
}

async function handleAllAttack() {
  if (gameOver) return;
  let anyAttack = false;
  for (let i = 0; i < party.length; i++) {
    const p = party[i];
    if (!p.hasAttackedThisTurn && p.hp > 0 && !p.dead) {
      // --- Attack all enemies if ability ---
      if (p.chosenAbilities && p.chosenAbilities.includes('attackAll')) {
        let attacked = false;
        for (let j = 0; j < enemies.length; j++) {
          if (enemies[j].hp > 0) {
            attacked = true;
            // Animate party member attack
            const partyCard = document.querySelectorAll('.item-card')[i];
            if (partyCard) partyCard.classList.add('attacking-party');
            await delay(200);
            if (partyCard) partyCard.classList.remove('attacking-party');

            const result = battleRound(p, enemies[j]);
            appendLog(result.log, result.isCrit ? "orange" : "green");
            if (result.isCrit) appendLog("CRITICAL HIT!", "orange");

            // Heal on attack
            if (p.chosenAbilities && p.chosenAbilities.includes('healOnAttack')) {
              const heal = Math.round(p.maxHp * 0.05);
              p.hp = Math.min(p.maxHp, p.hp + heal);
              appendLog(`${p.displayName} heals for ${heal} HP!`, "cyan");
            }

            if (result.hit && !p.dead) {
              const expGain = Math.round(result.damage * 0.1);
              p.exp += expGain;
              const leveledUp = checkLevelUp(p);
              if (leveledUp) {
                await showLevelUpModal(`${p.displayName} is now level ${p.level}!`, p.level);
                await maybeShowAbilityChoice(p);
              }
            }

            // Animate enemy hit flash
            const enemyCard = document.querySelectorAll('.enemy-card')[j];
            if (enemyCard) enemyCard.classList.add('flash-hit');
            await delay(100);
            if (enemyCard) enemyCard.classList.remove('flash-hit');

            if (enemies[j].hp <= 0) enemies[j].dead = true;
          }
        }
        if (attacked) {
          p.hasAttackedThisTurn = true;
          anyAttack = true;
        }
        if (p.hp <= 0) p.dead = true;
        renderBattle();

        if (enemies.every(e => e.hp <= 0)) {
          await handleVictory();
          return;
        }
        await delay(700);
        continue; // Go to next party member
      }

      // --- Normal single attack (existing code) ---
      const aliveEnemies = enemies.map((e, idx) => ({ e, idx })).filter(obj => obj.e.hp > 0);
      if (aliveEnemies.length === 0) continue;
      const targetObj = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
      const targetIdx = targetObj.idx;
      if (targetIdx === -1) continue;

      // Animate party member attack
      const partyCard = document.querySelectorAll('.item-card')[i];
      if (partyCard) partyCard.classList.add('attacking-party');
      await delay(400);
      if (partyCard) partyCard.classList.remove('attacking-party');

      const result = battleRound(p, enemies[targetIdx]);
      appendLog(result.log, result.isCrit ? "orange" : "green");
      if (result.isCrit) appendLog("CRITICAL HIT!", "orange");

      // Heal on attack
      if (p.chosenAbilities && p.chosenAbilities.includes('healOnAttack')) {
        const heal = Math.round(p.maxHp * 0.05);
        p.hp = Math.min(p.maxHp, p.hp + heal);
        appendLog(`${p.displayName} heals for ${heal} HP!`, "cyan");
      }

      if (result.hit && !p.dead) {
        const expGain = Math.round(result.damage * 0.1);
        p.exp += expGain;
        const leveledUp = checkLevelUp(p);
        if (leveledUp) {
          await showLevelUpModal(`${p.displayName} is now level ${p.level}!`, p.level);
          await maybeShowAbilityChoice(p);
        }
      }

      // Animate enemy hit flash AFTER attack
      const enemyCard = document.querySelectorAll('.enemy-card')[targetIdx];
      if (enemyCard) enemyCard.classList.add('flash-hit');
      await delay(200);
      if (enemyCard) enemyCard.classList.remove('flash-hit');

      if (enemies[targetIdx].hp <= 0) enemies[targetIdx].dead = true;
      if (p.hp <= 0) p.dead = true;

      p.hasAttackedThisTurn = true;
      renderBattle();

      anyAttack = true;
      if (enemies.every(e => e.hp <= 0)) {
        await handleVictory();
        return;
      }
      await delay(700);
    }
  }
  if (anyAttack && party.every(p => p.hasAttackedThisTurn || p.dead)) {
    await delay(1000);
    await enemyAttack();
  }
}

async function enemyAttack() {
  if (gameOver) return;
  const aliveEnemies = enemies.filter(e => e.hp > 0);
  const aliveParty = party.filter(p => p.hp > 0 && !p.dead);
  if (aliveEnemies.length === 0 || aliveParty.length === 0) return;

  for (let i = 0; i < aliveEnemies.length; i++) {
    const enemy = aliveEnemies[i];
    // Pick a random alive party member
    const targets = party.map((p, idx) => ({ p, idx })).filter(obj => obj.p.hp > 0 && !obj.p.dead);
    if (targets.length === 0) break;
    const targetObj = targets[Math.floor(Math.random() * targets.length)];
    const target = targetObj.p;
    const targetIdx = targetObj.idx;

    // Animate enemy attack
    const enemyCard = document.querySelectorAll('.enemy-card')[enemies.indexOf(enemy)];
    if (enemyCard) enemyCard.classList.add('attacking-enemy');
    await delay(400);
    if (enemyCard) enemyCard.classList.remove('attacking-enemy');

    // Apply damage and update state
    const result = battleRound(enemy, target);
    appendLog(result.log, "red");
    if (target.hp <= 0) target.dead = true;

    // Animate party member hit flash AFTER attack
    const partyCard = document.querySelectorAll('.item-card')[targetIdx];
    if (partyCard) partyCard.classList.add('flash-hit');
    await delay(200);
    if (partyCard) partyCard.classList.remove('flash-hit');

    renderBattle();
    await delay(400);
  }

  // Check for defeat after all enemy attacks
  if (party.every(p => p.hp <= 0 || p.dead)) {
    appendLog("Game Over! All your party members have been defeated.", "red");
    gameOver = true;
    renderBattle();
    showTryAgainButton(); // <-- Add this line
    return;
  }

  startPlayerTurn();
}

function resetTurn() {
  party.forEach(p => p.hasAttackedThisTurn = false);
}

async function handleVictory() {
  if (round === 4) {
    appendLog("Congratulations, your clothing is superior! You win!", "yellow");
    gameOver = true;
    renderBattle();
    return;
  }
  round++;
  appendLog("All enemies defeated!", "cyan");
  await delay(1000);
  await loadEnemiesForRound();
  const enterMsg = `${enemies.map(e => e.displayName).join(", ")} entered the fight!`;
  appendLog(enterMsg, "cyan");
  showLevelUpModal(enterMsg, 0, "#00ffff"); // Cyan background
  startPlayerTurn();
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function appendLog(text, color = null) {
  const logDiv = document.getElementById("battle-log");
  if (color) {
    logDiv.innerHTML += `<span style="color:${color}">${text}</span><br>`;
  } else {
    logDiv.innerHTML += `<span style="color:green">${text}</span><br>`;
  }
  logDiv.scrollTop = logDiv.scrollHeight;
}

function showLevelUpModal(msg, level, colorOverride = null) {
  const modal = document.getElementById('levelup-modal');
  modal.innerText = msg;
  modal.style.display = 'block';
  modal.style.background = colorOverride || getLevelColor(level);
  return new Promise(resolve => {
    setTimeout(() => {
      modal.style.display = 'none';
      resolve();
    }, 2000);
  });
}

function getLevelColor(level) {
  // Level 1: default (no override), Level 2+: colored
  const colors = [null, null, "#3498db", "#2ecc71", "#9b59b6", "#c9a101ff", "#e89c59ff", "#ff7161ff", "#e5a8ffff", "#7dffe5ff", "#f31212ff", "#2764ffff", "#0e8e00ff"];
  return colors[level] || null;
}

function showTryAgainButton() {
  // Remove existing button if present
  let tryBtn = document.getElementById("try-again-btn");
  if (tryBtn) tryBtn.remove();

  tryBtn = document.createElement("button");
  tryBtn.id = "try-again-btn";
  tryBtn.innerText = "Try Again";
  tryBtn.style.display = "block";
  tryBtn.style.margin = "30px auto";
  tryBtn.style.fontSize = "1.2em";
  tryBtn.onclick = () => {
    // Reset UI: show party creation, hide battle, clear log
    document.getElementById('party-creation').style.display = "";
    document.getElementById('battle-container').innerHTML = "";
    document.getElementById('battle-log').innerHTML = "";
    const modal = document.getElementById('levelup-modal');
    if (modal) modal.style.display = "none";
    // Hide the button itself
    tryBtn.remove();
    // Show the create party button again
    const createBtn = document.getElementById('load');
    if (createBtn) {
      createBtn.style.display = "block";
      createBtn.innerText = "Create Party";
    }
  };
  document.body.appendChild(tryBtn);
}

const ABILITY_OPTIONS = {
  2: [
    { key: 'attackAll', label: 'Attack all enemies on attack' },
    { key: 'critUp', label: 'Crit chance increased by 5%' }
  ],
  4: [
    { key: 'healOnAttack', label: 'Heal 5% of max HP on attack' }
  ],
  6: [
    { key: 'berserker', label: 'Berserker: double attack, half defense' }
  ]
};

async function maybeShowAbilityChoice(char) {
  const level = char.level;
  let options = [];
  if (level === 2) {
    options = ABILITY_OPTIONS[2].filter(opt => !char.chosenAbilities.includes(opt.key));
  } else if (level === 4) {
    // At 4, offer the one not chosen at 2, plus heal
    options = ABILITY_OPTIONS[2].filter(opt => !char.chosenAbilities.includes(opt.key))
      .concat(ABILITY_OPTIONS[4]);
  } else if (level === 6) {
    // At 7, offer the only one not chosen at 2/4, plus berserker
    const notChosen = ABILITY_OPTIONS[2].filter(opt => !char.chosenAbilities.includes(opt.key));
    options = notChosen.concat(ABILITY_OPTIONS[6]);
  }
  if (options.length === 0) return;

  // Show modal and wait for user choice
  await showAbilityChoiceModal(char, options);
}

function showAbilityChoiceModal(char, options) {
  return new Promise(resolve => {
    let modal = document.getElementById('ability-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'ability-modal';
      modal.style.position = 'fixed';
      modal.style.top = '30%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%,-50%)';
      modal.style.background = '#222';
      modal.style.color = '#fff';
      modal.style.padding = '24px 32px';
      modal.style.borderRadius = '12px';
      modal.style.fontSize = '16px';
      modal.style.zIndex = 1001;
      modal.style.textAlign = 'center';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `<h3>Level Up Ability Choice for ${char.displayName}</h3>
      <p>Choose one:</p>
      ${options.map(opt => `<button class="ability-choice-btn" data-key="${opt.key}" style="margin:8px 0;display:block;width:100%">${opt.label}</button>`).join('')}
    `;
    modal.style.display = 'block';

    document.querySelectorAll('.ability-choice-btn').forEach(btn => {
      btn.onclick = () => {
        const key = btn.dataset.key;
        char.chosenAbilities.push(key);
        if (key === 'berserker') {
          char.attack = Math.round(char.attack * 2);
          char.defense = Math.max(1, Math.round(char.defense / 2));
        }
        modal.style.display = 'none';
        resolve();
      };
    });
  });
}

// need death
// need hp bar to decrease visually
// need sound effects
// need exp and leveling up