import { mapStats, battleRound, checkLevelUp } from './battle-script.js';

let party = [];
let enemy = null;
let turnCount = 0;

const loadBtn = document.getElementById("load");
const battleContainer = document.getElementById("battle-container");
const battleLog = document.getElementById("battle-log");

// Move load button below battle log after first use
function moveLoadButtonToBottom() {
  if (loadBtn.parentNode !== document.body) return;
  document.body.removeChild(loadBtn);
  document.body.appendChild(loadBtn);
  loadBtn.style.margin = "20px auto 0 auto";
  loadBtn.style.display = "block";
}

loadBtn.addEventListener("click", async () => {
  const url = `https://kl4hylidcs3k4fazx4aojk2wpe0fbksa.lambda-url.ap-northeast-1.on.aws/items/random?limit=3&genders=mens`;
  const res = await fetch(url);
  const data = await res.json();
  party = data.map(item => ({ ...mapStats(item), hasAttackedThisTurn: false }));

  const enemyRes = await fetch(`https://kl4hylidcs3k4fazx4aojk2wpe0fbksa.lambda-url.ap-northeast-1.on.aws/items/random?limit=1&genders=mens`);
  const enemyData = await enemyRes.json();
  enemy = mapStats(enemyData[0]);

  turnCount = 0;
  renderBattle();
  moveLoadButtonToBottom();
});

function renderBattle() {
  battleContainer.innerHTML = "";

  const partyCol = document.createElement("div");
  partyCol.id = "party-column";
  party.forEach((p, index) => {
    const div = document.createElement("div");
    div.className = "item-card";
    const bg = getLevelColor(p.level || 1);
    if (bg) div.style.background = bg;
    if (p.dead) {
      div.classList.add('dead-card');
      // Or: div.style.opacity = 0.4;
    }
    const expPercent = Math.min(100, Math.round((p.exp / (p.expToNext || 50)) * 100));
    const expBarHtml = `
      <div class="exp-bar" style="height:7px;background:#fff;width:100%;border-radius:4px;margin:3px 0 0 0;position:relative;">
        <div style="height:100%;background:#0ff;width:${expPercent}%;border-radius:4px;position:absolute;top:0;left:0;"></div>
        <span class="exp-text" style="position:absolute;left:6px;top:0;font-size:8px;line-height:7px;color:#222;z-index:1;">
          ${p.exp}/${p.expToNext}
        </span>
      </div>
    `;
    div.innerHTML = `
      <div style="display:flex;align-items:center;">
        <span style="font-size:10px;font-weight:bold;margin-right:6px;">Lv.${p.level || 1}</span>
        <h3 style="flex:1;text-align:left;">${p.displayName}</h3>
      </div>
      <div class="img-stats" style="display:flex;align-items:flex-start;">
        <img src="${p.image_url}" alt="${p.title}" width="120">
        <div class="stats-column" style="display:flex;flex-direction:column;justify-content:center;margin-left:8px;">
          <p class="stat-text">ATK: ${p.attack}</p>
          <p class="stat-text">DEF: ${p.defense}</p>
        </div>
      </div>
      <div class="hp-bar" style="width:100%;position:relative;">
        <span class="hp-text">${p.hp}/${p.maxHp}</span>
        <div style="height:100%;background:#2ecc71;width:${Math.max(0, Math.round((p.hp/p.maxHp)*100))}%;border-radius:5px;position:absolute;top:0;left:0;z-index:-1;"></div>
      </div>
      ${expBarHtml}
      <button data-index="${index}" class="attack-btn" ${p.hasAttackedThisTurn || p.dead ? "disabled" : ""}>Attack</button>
    `;
    partyCol.appendChild(div);
  });

  const enemyCol = document.createElement("div");
  enemyCol.id = "enemy-column";
  const div = document.createElement("div");
  div.className = "enemy-card";
  div.innerHTML = `
    <h3>${enemy.displayName}</h3>
    <div class="img-stats" style="display:flex;align-items:flex-start;">
      <img src="${enemy.image_url}" alt="${enemy.title}" width="120">
      <div class="stats-column" style="display:flex;flex-direction:column;justify-content:center;margin-left:8px;">
        <p class="stat-text">ATK: ${enemy.attack}</p>
        <p class="stat-text">DEF: ${enemy.defense}</p>
      </div>
    </div>
    <div class="hp-bar" style="width:${(enemy.hp/enemy.maxHp)*100}%">
      <span class="hp-text">${enemy.hp}/${enemy.maxHp}</span>
    </div>
  `;
  enemyCol.appendChild(div);

  battleContainer.appendChild(partyCol);
  battleContainer.appendChild(enemyCol);

  // "All Attack" button above battle log
  let allBtn = document.getElementById("all-attack");
  if (allBtn) allBtn.remove();
  allBtn = document.createElement("button");
  allBtn.id = "all-attack";
  allBtn.innerText = "All Attack";
  allBtn.style.margin = "20px auto 0 auto";
  allBtn.style.display = "block";
  allBtn.addEventListener("click", async () => await handleAllAttack());

  // Insert above battle log
  document.body.insertBefore(allBtn, battleLog);

  document.querySelectorAll(".attack-btn").forEach(btn => {
    btn.addEventListener("click", async () => await handleSingleAttack(parseInt(btn.dataset.index)));
  });
}

async function handleSingleAttack(index) {
  if (!party[index] || party[index].hasAttackedThisTurn || enemy.hp <= 0) return;

  // Animate party member attack (no renderBattle here)
  const partyCard = document.querySelectorAll('.item-card')[index];
  if (partyCard) partyCard.classList.add('attacking-party');
  await delay(400);
  if (partyCard) partyCard.classList.remove('attacking-party');

  // Apply damage and update state
  party[index].hasAttackedThisTurn = true;
  const result = battleRound(party[index], enemy); // <--- USE result, not log
  appendLog(result.log, "green");                  // <--- USE result.log

  if (result.hit && !party[index].dead) {
    const expGain = Math.round(result.damage * 0.1);
    party[index].exp += expGain;
    const leveledUp = checkLevelUp(party[index]);
    if (leveledUp) showLevelUpModal(`${party[index].displayName} is now level ${party[index].level}!`, party[index].level);
  }

  // Animate enemy hit flash AFTER attack (no renderBattle here)
  const enemyCard = document.querySelector('.enemy-card');
  if (enemyCard) enemyCard.classList.add('flash-hit');
  await delay(200);
  if (enemyCard) enemyCard.classList.remove('flash-hit');

  // After damage is applied
  if (party[index].hp <= 0) {
    party[index].dead = true;
  }

  renderBattle();

  if (enemy.hp <= 0) {
    handleVictory();
    return;
  }
  if (party.every(p => p.hasAttackedThisTurn)) {
    await delay(1000);
    await enemyAttack();
  }
}

async function handleAllAttack() {
  if (enemy.hp <= 0) return;
  let anyAttack = false;
  for (let i = 0; i < party.length; i++) {
    const p = party[i];
    if (!p.hasAttackedThisTurn && p.hp > 0) {
      // Animate party member attack
      const partyCard = document.querySelectorAll('.item-card')[i];
      if (partyCard) partyCard.classList.add('attacking-party');
      await delay(400);
      if (partyCard) partyCard.classList.remove('attacking-party');

      // Apply damage and update state
      p.hasAttackedThisTurn = true;
      const result = battleRound(p, enemy);
      appendLog(result.log, "green");

      if (result.hit && !p.dead) {
        const expGain = Math.round(result.damage * 0.1);
        p.exp += expGain;
        const leveledUp = checkLevelUp(p);
        if (leveledUp) showLevelUpModal(`${p.displayName} is now level ${p.level}!`, p.level);
      }

      // Animate enemy hit flash AFTER attack
      const enemyCard = document.querySelector('.enemy-card');
      if (enemyCard) enemyCard.classList.add('flash-hit');
      await delay(200);
      if (enemyCard) enemyCard.classList.remove('flash-hit');

      // After damage is applied
      if (p.hp <= 0) {
        p.dead = true;
      }

      renderBattle();

      anyAttack = true;
      if (enemy.hp <= 0) {
        handleVictory();
        return;
      }
      await delay(700);
    }
  }
  if (anyAttack && party.every(p => p.hasAttackedThisTurn)) {
    await delay(1000);
    await enemyAttack();
  }
}

async function enemyAttack() {
  if (enemy.hp <= 0) return;
  const alive = party.filter(p => p.hp > 0);
  if (alive.length === 0) return;
  const target = alive[Math.floor(Math.random() * alive.length)];
  const targetIndex = party.indexOf(target);

  // Animate enemy attack
  const enemyCard = document.querySelector('.enemy-card');
  if (enemyCard) enemyCard.classList.add('attacking-enemy');
  await delay(400);
  if (enemyCard) enemyCard.classList.remove('attacking-enemy');

  // Apply damage and update state
  const result = battleRound(enemy, party[targetIndex]);
  appendLog(result.log, "red");
  resetTurn();

  // Animate party member hit flash AFTER attack
  const partyCard = document.querySelectorAll('.item-card')[targetIndex];
  if (partyCard) partyCard.classList.add('flash-hit');
  await delay(200);
  if (partyCard) partyCard.classList.remove('flash-hit');

  renderBattle();
}

function resetTurn() {
  party.forEach(p => p.hasAttackedThisTurn = false);
}

async function handleVictory() {
  appendLog(`${enemy.displayName} is defeated!`, "red");
  await delay(1000);
  // Fetch new enemy
  const enemyRes = await fetch(`https://kl4hylidcs3k4fazx4aojk2wpe0fbksa.lambda-url.ap-northeast-1.on.aws/items/random?limit=1&genders=mens`);
  const enemyData = await enemyRes.json();
  enemy = mapStats(enemyData[0]);
  appendLog(`${enemy.displayName} entered the fight!`, "cyan");
  party.forEach(p => p.hasAttackedThisTurn = false); // <-- Reset attacks
  renderBattle();
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

function showLevelUpModal(msg, level) {
  const modal = document.getElementById('levelup-modal');
  modal.innerText = msg;
  modal.style.display = 'block';
  modal.style.background = getLevelColor(level);
  setTimeout(() => { modal.style.display = 'none'; }, 2000);
}

function getLevelColor(level) {
  // Level 1: default (no override), Level 2+: colored
  const colors = [null, null, "#3498db", "#2ecc71", "#9b59b6", "#f1c40f", "#e67e22", "#e74c3c"];
  return colors[level] || null;
}


// need death
// need hp bar to decrease visually
// need sound effects
// need exp and leveling up