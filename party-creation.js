import { mapStats } from './battle-script.js';

const partyCreationDiv = document.getElementById('party-creation');
const createBtn = document.getElementById('load');
createBtn.innerText = "Create Party";

let brands = [];
async function fetchBrands() {
  // Fetch a large batch of random items and extract unique brands with IDs
  const res = await fetch('https://kl4hylidcs3k4fazx4aojk2wpe0fbksa.lambda-url.ap-northeast-1.on.aws/items/random?limit=100');
  const data = await res.json();
  // Use a Map to ensure unique brand id/name pairs
  const brandMap = new Map();
  data.forEach(item => {
    if (item.brand_id && item.brand_name) {
      brandMap.set(item.brand_id, item.brand_name);
    }
  });
  brands = Array.from(brandMap, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}

function renderPartyForm() {
  partyCreationDiv.innerHTML = `
    <h2>Create Your Party</h2>
    <div id="char-form">
      <h3>Character No. ${currentChar + 1}</h3>
      <div>
        <label for="brand-select">Choose a Brand:</label>
        <select id="brand-select">
          <option value="">(Random Brand)</option>
          ${brands.map(b => `<option value="${b.id}" ${selectedBrand === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
      </div>
      <button id="get-filtered">Select this Brand</button>
      <button id="get-random">Get Random Character</button>
    </div>
    <div id="party-preview">
      <h4>Party Preview:</h4>
      <ul>
        ${party.map((m, i) => `<li>Character ${i+1}: ${m.displayName}</li>`).join('')}
      </ul>
    </div>
  `;
  addFormListeners();
}

function addFormListeners() {
  const brandSelect = document.getElementById('brand-select');
  brandSelect.onchange = () => {
    selectedBrand = brandSelect.value || null;
  };

  document.getElementById('get-random').onclick = async () => {
    await fetchAndAddCharacter();
  };

  document.getElementById('get-filtered').onclick = async () => {
    await fetchAndAddCharacter(selectedBrand);
  };
}
async function fetchAndAddCharacter(brandId) {
  let member = null;
  let url = `https://kl4hylidcs3k4fazx4aojk2wpe0fbksa.lambda-url.ap-northeast-1.on.aws/items/random?limit=1`;
  if (brandId) url += `&brand_ids=${brandId}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data[0]) {
    alert("Couldn't find a character with that brand. Try again or pick random.");
    return;
  }
  member = mapStats(data[0]);
  party.push(member);
  currentChar++;
  if (currentChar < maxParty) {
    renderPartyForm();
  } else {
    finishPartyCreation();
  }
}

function finishPartyCreation() {
  partyCreationDiv.innerHTML = `<h2>Party Created!</h2>`;
  setTimeout(() => {
    partyCreationDiv.style.display = "none";
    window.startBattleWithParty(party);
  }, 1000);
}

// Initial render
createBtn.onclick = async () => {
  createBtn.style.display = "none";
  party = [];
  currentChar = 0;
  selectedBrand = null;
  await fetchBrands();
  renderPartyForm();
};
let party = [];
let currentChar = 0;
let selectedBrand = null;
const maxParty = 3;