import { mapStats, battleRound } from './battle-script.js';

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
    div.innerHTML = `
      <h3>${p.displayName}</h3>
      <img src="${p.image_url}" alt="${p.title}" width="120">
      <div class="hp-bar" style="width:${(p.hp/p.maxHp)*100}%">
        <span class="hp-text">${p.hp}/${p.maxHp}</span>
      </div>
      <p class="stat-text">ATK: ${p.attack} | DEF: ${p.defense}</p>
      <button data-index="${index}" class="attack-btn" ${p.hasAttackedThisTurn ? "disabled" : ""}>Attack</button>
    `;
    partyCol.appendChild(div);
  });

  const enemyCol = document.createElement("div");
  enemyCol.id = "enemy-column";
  const div = document.createElement("div");
  div.className = "enemy-card";
  div.innerHTML = `
    <h3>${enemy.displayName}</h3>
    <img src="${enemy.image_url}" alt="${enemy.title}" width="120">
    <div class="hp-bar" style="width:${(enemy.hp/enemy.maxHp)*100}%">
      <span class="hp-text">${enemy.hp}/${enemy.maxHp}</span>
    </div>
    <p class="stat-text">ATK: ${enemy.attack} | DEF: ${enemy.defense}</p>
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
  const log = battleRound(party[index], enemy);
  appendLog(log, "green");

  // Animate enemy hit flash AFTER attack (no renderBattle here)
  const enemyCard = document.querySelector('.enemy-card');
  if (enemyCard) enemyCard.classList.add('flash-hit');
  await delay(200);
  if (enemyCard) enemyCard.classList.remove('flash-hit');

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
      const log = battleRound(p, enemy);
      appendLog(log, "green");

      // Animate enemy hit flash AFTER attack
      const enemyCard = document.querySelector('.enemy-card');
      if (enemyCard) enemyCard.classList.add('flash-hit');
      await delay(200);
      if (enemyCard) enemyCard.classList.remove('flash-hit');

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
  const log = battleRound(enemy, party[targetIndex]);
  appendLog(log, "red");
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

function handleVictory() {
  appendLog(`${enemy.displayName} is defeated!`, "red");
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


// need death
// need hp bar to decrease visually
// need sound effects
// need exp and leveling up