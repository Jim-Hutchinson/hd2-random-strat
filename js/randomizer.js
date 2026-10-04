// DOM Elements
const elements = {
  loadoutContainer: document.getElementById("loadoutContainer"),
  rollStratsButton: document.getElementById("rollStratsButton"),
  warbondCheckboxes: document.getElementsByClassName("warbondCheckboxes"),
  superCitizenCheckBox: document.getElementById("warbond0"),
  oneSupportCheck: document.getElementById("oneSupportCheck"),
  oneBackpackCheck: document.getElementById("oneBackpackCheck"),
  oneSupportPerPlayerCheck: document.getElementById("oneSupportPerPlayerCheck"),
  oneBackpackPerPlayerCheck: document.getElementById("oneBackpackPerPlayerCheck"),
  alwaysSupportCheck: document.getElementById("alwaysSupportCheck"),
  alwaysBackpackCheck: document.getElementById("alwaysBackpackCheck"),
  proTipsText: document.getElementById("proTipsText"),
  braschTacticsText: document.getElementById("braschTacticsText"),
  teamModeCheck: document.getElementById("teamModeCheck"),
};

// Radio button groups
const stratOptionRadios = [
  document.getElementById("onlyEaglesRadio"),
  document.getElementById("noEaglesRadio"),
  document.getElementById("defaultEaglesRadio"),
  document.getElementById("onlyOrbitalsRadio"),
  document.getElementById("noOrbitalsRadio"),
  document.getElementById("defaultOrbitalsRadio"),
  document.getElementById("onlyDefenseRadio"),
  document.getElementById("noDefenseRadio"),
  document.getElementById("defaultDefenseRadio"),
  document.getElementById("onlySupplyRadio"),
  document.getElementById("noSupplyRadio"),
  document.getElementById("defaultSupplyRadio"),
];

// Team (squad) mode constants
const TEAM_SIZE = 4;
const PLAYER_NAMES = ["Player 1", "Player 2", "Player 3", "Player 4"];

// Tag constants
const TAG_SUPPORT = "Weapons";
const TAG_BACKPACK = "Backpacks";

// Working lists
let workingLists = {
  prims: [...PRIMARIES],
  seconds: [...SECONDARIES],
  throws: [...THROWABLES],
  boosts: [...BOOSTERS],
  strats: [...STRATAGEMS],
  armorPassives: [...ARMOR_PASSIVES],
  armorSets: [...ARMOR_SETS],
};

let rolledStrats = [];
let proTipCounter = 0;
let checkedWarbonds = new Set(); // Use Set for better performance
let teamMode = false;
// Per-player warbond selections (squad mode only; one Set per player)
let playerWarbonds = [null, null, null, null];
// Per-player squad roles (squad mode only): null or a key of ROLES
let playerRoles = [null, null, null, null];
// Locked slots: Map<"strat:p:pos" | "equip:p:category" | "armor:p", internalName>
const lockedSlots = new Map();

// Helper: Get current checkbox states
const getSupplyOptions = () => ({
  oneSupport:
    elements.oneSupportCheck.checked && !elements.oneSupportCheck.disabled,
  oneBackpack:
    elements.oneBackpackCheck.checked && !elements.oneBackpackCheck.disabled,
  oneSupportPerPlayer:
    elements.oneSupportPerPlayerCheck?.checked &&
    !elements.oneSupportPerPlayerCheck?.disabled,
  oneBackpackPerPlayer:
    elements.oneBackpackPerPlayerCheck?.checked &&
    !elements.oneBackpackPerPlayerCheck?.disabled,
  alwaysSupport:
    elements.alwaysSupportCheck.checked &&
    !elements.alwaysSupportCheck.disabled,
  alwaysBackpack:
    elements.alwaysBackpackCheck.checked &&
    !elements.alwaysBackpackCheck.disabled,
  uniqueEquipment:
    teamMode &&
    document.getElementById("uniqueEquipmentCheck")?.checked &&
    !document.getElementById("uniqueEquipmentCheck")?.disabled,
});

// The per-player "only one" options only apply in squad mode, so they are
// disabled while rolling for a single player.
const updatePerPlayerOptionsAvailability = () => {
  ["oneSupportPerPlayerCheck", "oneBackpackPerPlayerCheck", "uniqueEquipmentCheck"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = !teamMode;
  });

  const squadWarbondsContainer = document.getElementById(
    "squadWarbondsContainer",
  );
  if (squadWarbondsContainer) {
    squadWarbondsContainer.style.display = teamMode ? "" : "none";
    if (teamMode) {
      initPlayerWarbonds();
      buildSquadWarbondUI();
    }
  }
};

// Per-player item pools: in squad mode every player can exclude warbonds
// separately; in solo mode everyone shares the global list.
const getPlayerWorkingLists = (playerIndex) => {
  if (!teamMode || !playerWarbonds[playerIndex]) {
    return workingLists;
  }
  const set = playerWarbonds[playerIndex];
  const byWarbond = (list) =>
    list.filter(
      (item) => set.has(item.warbondCode) || item.warbondCode === "none",
    );
  return {
    prims: byWarbond([...PRIMARIES]),
    seconds: byWarbond([...SECONDARIES]),
    throws: byWarbond([...THROWABLES]),
    boosts: byWarbond([...BOOSTERS]),
    strats: byWarbond([...STRATAGEMS]),
    armorPassives: byWarbond([...ARMOR_PASSIVES]),
    armorSets: byWarbond([...ARMOR_SETS]),
  };
};

// --- Per-player warbond selections -----------------------------------------

// Give every player the global selection as their starting point
const initPlayerWarbonds = () => {
  PLAYER_NAMES.forEach((_, playerIndex) => {
    if (!playerWarbonds[playerIndex]) {
      playerWarbonds[playerIndex] = new Set(checkedWarbonds);
    }
  });
};

const loadSquadWarbondOptions = (options) => {
  // Default: everyone starts with the global warbond selection
  PLAYER_NAMES.forEach((_, playerIndex) => {
    playerWarbonds[playerIndex] = new Set(checkedWarbonds);
  });

  const stored = options?.squadWarbondOptions;
  if (stored) {
    PLAYER_NAMES.forEach((_, playerIndex) => {
      const playerStorage = stored[`p${playerIndex}`];
      if (playerStorage) {
        playerWarbonds[playerIndex] = new Set(
          Object.keys(playerStorage).filter((code) => playerStorage[code]),
        );
      }
    });
  }
};

const saveSquadWarbondOptions = () => {
  const randomizerOptions = JSON.parse(
    localStorage.getItem("randomizerOptions") || "{}",
  );
  const stored = {};
  playerWarbonds.forEach((set, playerIndex) => {
    stored[`p${playerIndex}`] = Object.fromEntries(
      [...set].map((code) => [code, true]),
    );
  });
  randomizerOptions.squadWarbondOptions = stored;
  localStorage.setItem("randomizerOptions", JSON.stringify(randomizerOptions));
};

// Build the per-player warbond checklists shown in the Options modal
const buildSquadWarbondUI = () => {
  const container = document.getElementById("squadWarbondsContainer");
  if (!container || typeof warbondsList === "undefined") return;

  const checklists = PLAYER_NAMES.map(
    (name, playerIndex) => `
    <div class="accordion-item bg-grey">
      <h2 class="accordion-header" id="squadWarbondsHeading${playerIndex}">
        <button
          class="accordion-button collapsed text-light"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#squadWarbondsPanel${playerIndex}"
          aria-expanded="false"
          aria-controls="squadWarbondsPanel${playerIndex}"
        >
          ${name}
        </button>
      </h2>
      <div
        id="squadWarbondsPanel${playerIndex}"
        class="accordion-collapse collapse"
        aria-labelledby="squadWarbondsHeading${playerIndex}"
        data-bs-parent="#squadWarbondsAccordion"
      >
        <div class="accordion-body">
          ${warbondsList
            .map((warbondName, warbondIndex) => {
              const id = `warbond${warbondIndex}-player${playerIndex}`;
              const code = `warbond${warbondIndex}`;
              const checked = playerWarbonds[playerIndex]?.has(code)
                ? "checked"
                : "";
              return `
              <div class="form-check">
                <input
                  class="form-check-input squadWarbondCheckbox"
                  type="checkbox"
                  id="${id}"
                  data-player="${playerIndex}"
                  data-warbond="${code}"
                  ${checked}
                />
                <label class="form-check-label text-white" for="${id}">
                  ${warbondName}
                </label>
              </div>`;
            })
            .join("")}
        </div>
      </div>
    </div>`,
  ).join("");

  container.innerHTML = `
    <h5 class="text-white mt-3">Squad Warbonds (per player)</h5>
    <p class="text-white-50 small mb-2">
      Each Helldiver can roll from their own set of warbonds. Ticking a box in
      the shared checklist above updates every player at once.
    </p>
    <div class="accordion" id="squadWarbondsAccordion">${checklists}</div>
  `;
};

// The shared checklist acts as "apply to all players" while in squad mode
const syncSquadWarbondsFromGlobal = () => {
  PLAYER_NAMES.forEach((_, playerIndex) => {
    playerWarbonds[playerIndex] = new Set(checkedWarbonds);
  });
  saveSquadWarbondOptions();
  buildSquadWarbondUI();
};

// Tag helper functions
const isSupportItem = (item) => item?.tags?.includes(TAG_SUPPORT);
const isBackpackItem = (item) => item?.tags?.includes(TAG_BACKPACK);
const isExosuitItem = (item) => item?.tags?.includes("exosuit");
const isFrvItem = (item) => item?.tags?.includes("frv");

// Squad roles: each role guarantees the player draws a matching stratagem
const ROLES = {
  support: { label: "Support", matches: (item) => isSupportItem(item) },
  at: { label: "Anti-Tank", matches: (item) => item.antitank === true },
  crowd: {
    label: "Crowd Control",
    matches: (item) =>
      ["gas", "smoke", "stun"].some((tag) => item.tags?.includes(tag)),
  },
  eagle: { label: "Eagle", matches: (item) => item.category === "Eagle" },
  orbital: { label: "Orbital", matches: (item) => item.category === "Orbital" },
};

const setPlayerRole = (playerIndex, role) => {
  playerRoles[playerIndex] = role || null;

  const randomizerOptions = JSON.parse(
    localStorage.getItem("randomizerOptions") || "{}",
  );
  const stored = randomizerOptions.playerOptions || {};
  stored[`p${playerIndex}`] = playerRoles[playerIndex] || "";
  randomizerOptions.playerOptions = stored;
  localStorage.setItem("randomizerOptions", JSON.stringify(randomizerOptions));

  // Re-roll that player so the role requirement takes effect
  rerollPlayer(playerIndex);
};
window.setPlayerRole = setPlayerRole;

// --- Difficulty presets -----------------------------------------------------

const DEFAULT_STRATAGEM_OPTIONS = {
  onlyEaglesRadio: false,
  noEaglesRadio: false,
  defaultEaglesRadio: true,
  onlyOrbitalsRadio: false,
  noOrbitalsRadio: false,
  defaultOrbitalsRadio: true,
  onlyDefenseRadio: false,
  noDefenseRadio: false,
  defaultDefenseRadio: true,
  onlySupplyRadio: false,
  noSupplyRadio: false,
  defaultSupplyRadio: true,
};

const DIFFICULTY_PRESETS = [
  {
    name: "Standard (defaults)",
    stratagemOptions: { ...DEFAULT_STRATAGEM_OPTIONS },
    supplyAmountOptions: {
      oneSupportCheck: false,
      oneBackpackCheck: false,
      oneSupportPerPlayerCheck: false,
      oneBackpackPerPlayerCheck: false,
      alwaysSupportCheck: false,
      alwaysBackpackCheck: false,
    },
  },
  {
    name: "Balanced Squad (one support + one backpack each)",
    stratagemOptions: { ...DEFAULT_STRATAGEM_OPTIONS },
    supplyAmountOptions: {
      oneSupportCheck: false,
      oneBackpackCheck: false,
      oneSupportPerPlayerCheck: false,
      oneBackpackPerPlayerCheck: false,
      alwaysSupportCheck: true,
      alwaysBackpackCheck: true,
    },
  },
  {
    name: "Strict Squad (one support & one backpack TOTAL)",
    stratagemOptions: { ...DEFAULT_STRATAGEM_OPTIONS },
    supplyAmountOptions: {
      oneSupportCheck: true,
      oneBackpackCheck: true,
      oneSupportPerPlayerCheck: false,
      oneBackpackPerPlayerCheck: false,
      alwaysSupportCheck: false,
      alwaysBackpackCheck: false,
    },
  },
  {
    name: "Self-Sufficient (max one support & backpack per player)",
    stratagemOptions: { ...DEFAULT_STRATAGEM_OPTIONS },
    supplyAmountOptions: {
      oneSupportCheck: false,
      oneBackpackCheck: false,
      oneSupportPerPlayerCheck: true,
      oneBackpackPerPlayerCheck: true,
      alwaysSupportCheck: false,
      alwaysBackpackCheck: false,
    },
  },
  {
    name: "Eagle Strike (only Eagles)",
    stratagemOptions: {
      ...DEFAULT_STRATAGEM_OPTIONS,
      onlyEaglesRadio: true,
      defaultEaglesRadio: false,
    },
    supplyAmountOptions: {
      oneSupportCheck: false,
      oneBackpackCheck: false,
      oneSupportPerPlayerCheck: false,
      oneBackpackPerPlayerCheck: false,
      alwaysSupportCheck: false,
      alwaysBackpackCheck: false,
    },
  },
  {
    name: "Orbital Supremacy (only Orbitals)",
    stratagemOptions: {
      ...DEFAULT_STRATAGEM_OPTIONS,
      onlyOrbitalsRadio: true,
      defaultOrbitalsRadio: false,
    },
    supplyAmountOptions: {
      oneSupportCheck: false,
      oneBackpackCheck: false,
      oneSupportPerPlayerCheck: false,
      oneBackpackPerPlayerCheck: false,
      alwaysSupportCheck: false,
      alwaysBackpackCheck: false,
    },
  },
  {
    name: "Home Defense (only Defense)",
    stratagemOptions: {
      ...DEFAULT_STRATAGEM_OPTIONS,
      onlyDefenseRadio: true,
      defaultDefenseRadio: false,
    },
    supplyAmountOptions: {
      oneSupportCheck: false,
      oneBackpackCheck: false,
      oneSupportPerPlayerCheck: false,
      oneBackpackPerPlayerCheck: false,
      alwaysSupportCheck: false,
      alwaysBackpackCheck: false,
    },
  },
  {
    name: "No Logistics (no Supply stratagems)",
    stratagemOptions: {
      ...DEFAULT_STRATAGEM_OPTIONS,
      noSupplyRadio: true,
      defaultSupplyRadio: false,
    },
    supplyAmountOptions: {
      oneSupportCheck: false,
      oneBackpackCheck: false,
      oneSupportPerPlayerCheck: false,
      oneBackpackPerPlayerCheck: false,
      alwaysSupportCheck: false,
      alwaysBackpackCheck: false,
    },
  },
];

const applyPreset = async () => {
  const select = document.getElementById("presetSelect");
  const preset = DIFFICULTY_PRESETS[Number(select?.value)];
  if (!preset) return;

  const randomizerOptions = JSON.parse(
    localStorage.getItem("randomizerOptions") || "{}",
  );

  [
    ["stratagemOptions", preset.stratagemOptions],
    ["supplyAmountOptions", preset.supplyAmountOptions],
  ].forEach(([category, values]) => {
    if (!values) return;
    randomizerOptions[category] = values;
    Object.entries(values).forEach(([id, checked]) => {
      const element = document.getElementById(id);
      if (element) element.checked = checked;
    });
  });
  localStorage.setItem("randomizerOptions", JSON.stringify(randomizerOptions));

  updateRadioButtonsState();
  await filterItemsByWarbond();
  rollEquipment();
  rollStratagems();
  if (typeof rollArmor === "function") rollArmor();
};
window.applyPreset = applyPreset;

// --- Seeds ------------------------------------------------------------------

const applySeedFromInput = () => {
  const value = document.getElementById("seedInput")?.value || "";
  setSeed(value);

  const randomizerOptions = JSON.parse(
    localStorage.getItem("randomizerOptions") || "{}",
  );
  randomizerOptions.seedOptions = { seedInput: value };
  localStorage.setItem("randomizerOptions", JSON.stringify(randomizerOptions));
};

// Same seed + same options + same warbonds = the same rolls for everyone
const rollChallengeOfTheDay = () => {
  const today = new Date();
  const seed = `cotd-${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const input = document.getElementById("seedInput");
  if (input) input.value = seed;
  applySeedFromInput();

  const modal = window.bootstrap?.Modal
    ? bootstrap.Modal.getInstance(document.getElementById("optionsModal"))
    : null;
  modal?.hide();

  randomizeAll();
};

// --- Seeded randomness -----------------------------------------------------
// All rolls go through random(). With no seed set it is plain Math.random();
// with a seed (e.g. the "Challenge of the Day" date) it is a deterministic
// mulberry32 PRNG, so the same seed + same options reproduces the same rolls.
let seededRandom = null;

const hashSeedString = (text) => {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
};

const mulberry32 = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const setSeed = (seedText) => {
  const trimmed = (seedText || "").trim();
  seededRandom = trimmed ? mulberry32(hashSeedString(trimmed)) : null;
};

const random = () => (seededRandom ? seededRandom() : Math.random());

// Helper: Shuffle a copy of an array (Fisher-Yates)
const shuffleArray = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Helper: Get the loadout slot containers (one set per player)
const getContainersByClass = (className) =>
  Array.from(document.querySelectorAll(`#loadoutSlots .${className}`)).sort(
    (a, b) => (Number(a.dataset.player) || 0) - (Number(b.dataset.player) || 0),
  );

const getArmorContainers = () => getContainersByClass("armorContainer");
const getEquipmentContainers = () => getContainersByClass("equipmentContainer");
const getStratContainers = () => getContainersByClass("stratagemsContainer");

// Build the loadout DOM for the current mode (solo or squad)
const buildLoadoutDOM = () => {
  const slots = document.getElementById("loadoutSlots");
  if (!slots) return;

  if (!teamMode) {
    slots.innerHTML = `
      <div
        id="armorContainer"
        class="d-flex row justify-content-start armorContainer"
        data-player="0"
      ></div>
      <div
        id="equipmentContainer"
        class="row pt-2 d-flex justify-content-center equipmentContainer"
        data-player="0"
      ></div>
      <div
        id="stratagemsContainer"
        class="row pt-2 d-flex justify-content-center stratagemsContainer"
        data-player="0"
      ></div>
    `;
  } else {
    // 2x2 grid: each player block is half of the widened column, which works
    // out to exactly the same width as the solo loadout column, so every card
    // matches the single-player size.
    slots.innerHTML = `
      <div class="row justify-content-center">
        ${PLAYER_NAMES.map(
          (name, playerIndex) => `
        <div class="playerBlock col-12 col-lg-6">
          <div class="d-flex justify-content-center align-items-center gap-2">
            <h5
              class="text-white text-center playerHeader my-2"
              onclick="rerollPlayer(${playerIndex})"
              title="Re-roll this player's loadout"
            >
              ${name}
              <i class="bi bi-arrow-repeat ms-1"></i>
            </h5>
            <select
              class="form-select form-select-sm w-auto roleSelect"
              data-player="${playerIndex}"
              onchange="setPlayerRole(${playerIndex}, this.value)"
              title="Assign a squad role"
            >
              <option value="">No role</option>
              ${Object.entries(ROLES)
                .map(
                  ([key, role]) =>
                    `<option value="${key}" ${
                      playerRoles[playerIndex] === key ? "selected" : ""
                    }>${role.label}</option>`,
                )
                .join("")}
            </select>
          </div>
          <div
            class="armorContainer d-flex row justify-content-start"
            data-player="${playerIndex}"
          ></div>
          <div
            class="equipmentContainer row pt-2 d-flex justify-content-center"
            data-player="${playerIndex}"
          ></div>
          <div
            class="stratagemsContainer row pt-2 d-flex justify-content-center"
            data-player="${playerIndex}"
          ></div>
        </div>
        `,
        ).join("")}
      </div>
    `;
  }

  // Give the loadout column more room in squad mode
  const column = document.getElementById("loadoutColumn");
  if (column) {
    column.classList.toggle("col-lg-5", !teamMode);
    column.classList.toggle("col-lg-10", teamMode);
  }
};

// Initialize event listeners
const initEventListeners = () => {
  // Supply options
  const supplyCheckIds = [
    "oneSupportCheck",
    "oneBackpackCheck",
    "alwaysSupportCheck",
    "alwaysBackpackCheck",
  ];
  supplyCheckIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", (e) =>
        updateLocalStorage(e.target, "supplyAmountOptions"),
      );
    }
  });

  // Per-player "only one" options (squad mode only)
  ["oneSupportPerPlayerCheck", "oneBackpackPerPlayerCheck"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", (e) =>
        updateLocalStorage(e.target, "supplyAmountOptions"),
      );
    }
  });
  updatePerPlayerOptionsAvailability();

  // Squad mode toggle
  if (elements.teamModeCheck) {
    elements.teamModeCheck.addEventListener("change", (e) => {
      updateLocalStorage(e.target, "teamModeOptions");
      teamMode = e.target.checked;
      buildLoadoutDOM();
      updatePerPlayerOptionsAvailability();
      rollEquipment();
      rollStratagems();
      if (typeof rollArmor === "function") rollArmor();
    });
  }

  // Stratagem radios
  stratOptionRadios.forEach((radio) => {
    if (radio) {
      radio.addEventListener("change", handleStratRadioChange);
    }
  });

  // Warbond checkboxes
  Array.from(elements.warbondCheckboxes).forEach((cb) => {
    cb.addEventListener("change", handleWarbondChange);
  });

  // Per-player warbond checkboxes (squad mode)
  const squadWarbondsContainer = document.getElementById(
    "squadWarbondsContainer",
  );
  if (squadWarbondsContainer) {
    squadWarbondsContainer.addEventListener("change", (e) => {
      const checkbox = e.target.closest(".squadWarbondCheckbox");
      if (!checkbox) return;
      const playerIndex = Number(checkbox.dataset.player);
      const warbondCode = checkbox.dataset.warbond;
      const set =
        playerWarbonds[playerIndex] ||
        (playerWarbonds[playerIndex] = new Set());
      if (checkbox.checked) {
        set.add(warbondCode);
      } else {
        set.delete(warbondCode);
      }
      saveSquadWarbondOptions();
      // Re-roll just that player with their new pool
      rerollPlayer(playerIndex);
    });
  }

  // Add toggle all warbonds functionality
  const toggleAllButton = document.getElementById("toggleAllWarbonds");
  if (toggleAllButton) {
    toggleAllButton.addEventListener("change", handleToggleAllWarbonds);
  }

  // Seed controls
  const seedInput = document.getElementById("seedInput");
  if (seedInput) {
    seedInput.addEventListener("change", applySeedFromInput);
  }
  const clearSeedButton = document.getElementById("clearSeedButton");
  if (clearSeedButton) {
    clearSeedButton.addEventListener("click", () => {
      const input = document.getElementById("seedInput");
      if (input) input.value = "";
      applySeedFromInput();
    });
  }
  const cotdButton = document.getElementById("cotdButton");
  if (cotdButton) {
    cotdButton.addEventListener("click", rollChallengeOfTheDay);
  }

  // Presets
  const presetSelect = document.getElementById("presetSelect");
  if (presetSelect) {
    presetSelect.innerHTML = DIFFICULTY_PRESETS.map((preset, index) =>
      `<option value="${index}">${preset.name}</option>`,
    ).join("");
  }
  const applyPresetButton = document.getElementById("applyPresetButton");
  if (applyPresetButton) {
    applyPresetButton.addEventListener("click", applyPreset);
  }

  // Reroll via click delegation on the loadout slots (works for every player)
  const loadoutSlots = document.getElementById("loadoutSlots");
  if (loadoutSlots) {
    loadoutSlots.addEventListener("click", (e) => {
      const lockButton = e.target.closest(".lockButton");
      if (lockButton) {
        toggleCardLock(lockButton.closest(".itemCards"));
        return;
      }
      const card = e.target.closest(".itemCards");
      if (!card || !card.dataset.category) return;
      rerollItem(card.dataset.internalName, card.dataset.category);
    });
  }
};

// Handle stratagem radio changes
const handleStratRadioChange = (e) => {
  updateLocalStorage(e.target, "stratagemOptions");
  updateRadioButtonsState();
};

const updateRadioButtonsState = () => {
  const onlyRadios = [
    "onlyEaglesRadio",
    "onlyOrbitalsRadio",
    "onlyDefenseRadio",
    "onlySupplyRadio",
  ];
  const activeOnlyRadio = onlyRadios.find(
    (id) => document.getElementById(id)?.checked,
  );

  // Get all supply checkboxes
  const supplyChecks = [
    "oneSupportCheck",
    "oneBackpackCheck",
    "oneSupportPerPlayerCheck",
    "oneBackpackPerPlayerCheck",
    "alwaysBackpackCheck",
    "alwaysSupportCheck",
  ];

  if (activeOnlyRadio) {
    // An "only" option is active - disable supply checkboxes
    supplyChecks.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = true;
    });

    // Get the category (Eagle, Orbital, Defense, Supply)
    const category = activeOnlyRadio.replace("only", "").replace("Radio", "");

    // Disable radios from other categories, keep same category enabled
    stratOptionRadios.forEach((radio) => {
      if (radio) {
        const isSameCategory = radio.id.includes(category);
        const isDefaultForCategory = radio.id === `default${category}Radio`;
        radio.disabled = !(isSameCategory || isDefaultForCategory);
      }
    });
  } else {
    // No "only" option active - enable everything
    supplyChecks.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = false;
    });

    stratOptionRadios.forEach((radio) => {
      if (radio) radio.disabled = false;
    });
  }
};

// Update the toggle all button state based on individual checkboxes
const updateToggleAllButton = () => {
  const toggleAllButton = document.getElementById("toggleAllWarbonds");
  if (!toggleAllButton) return;

  const allWarbondCheckboxes = document.querySelectorAll(".warbondCheckboxes");
  if (allWarbondCheckboxes.length === 0) return;

  const checkedCount = Array.from(allWarbondCheckboxes).filter(
    (cb) => cb.checked,
  ).length;
  const totalCount = allWarbondCheckboxes.length;

  if (checkedCount === 0) {
    toggleAllButton.checked = false;
    toggleAllButton.indeterminate = false;
  } else if (checkedCount === totalCount) {
    toggleAllButton.checked = true;
    toggleAllButton.indeterminate = false;
  } else {
    toggleAllButton.indeterminate = true;
  }
};

// Handle toggle all warbonds
const handleToggleAllWarbonds = async (e) => {
  const isChecked = e.target.checked;
  const allWarbondCheckboxes = document.querySelectorAll(".warbondCheckboxes");

  allWarbondCheckboxes.forEach((checkbox) => {
    if (checkbox.checked !== isChecked) {
      checkbox.checked = isChecked;

      // Update the checkedWarbonds Set
      if (isChecked) {
        checkedWarbonds.add(checkbox.id);
      } else {
        checkedWarbonds.delete(checkbox.id);
      }

      // Update localStorage
      updateLocalStorage(checkbox, "warbondOptions");
    }
  });

  // Filter all items after toggling
  await filterItemsByWarbond();

  // In squad mode the shared toggle applies to every player
  if (teamMode) {
    syncSquadWarbondsFromGlobal();
  }

  // Re-roll everything to reflect new warbond selection
  rollEquipment();
  rollStratagems();
  if (typeof rollArmor === "function") rollArmor();
};

// Handle warbond changes
const handleWarbondChange = async (e) => {
  updateLocalStorage(e.target, "warbondOptions");

  if (e.target.checked) {
    checkedWarbonds.add(e.target.id);
  } else {
    checkedWarbonds.delete(e.target.id);
  }

  updateToggleAllButton(); // Update the toggle button state
  await filterItemsByWarbond();

  // In squad mode the shared checklist applies to every player
  if (teamMode) {
    syncSquadWarbondsFromGlobal();
    rollEquipment();
    rollStratagems();
    if (typeof rollArmor === "function") rollArmor();
  }
};

// Filter items by warbond (optimized)
const filterItemsByWarbond = async () => {
  const originalLists = {
    strats: [...STRATAGEMS],
    prims: [...PRIMARIES],
    seconds: [...SECONDARIES],
    throws: [...THROWABLES],
    boosts: [...BOOSTERS],
    armorPassives: [...ARMOR_PASSIVES],
    armorSets: [...ARMOR_SETS],
  };

  Object.keys(workingLists).forEach((key) => {
    workingLists[key] = originalLists[key].filter(
      (item) =>
        checkedWarbonds.has(item.warbondCode) || item.warbondCode === "none",
    );
  });

  // Update armor lists AFTER filtering is complete
  if (typeof updateArmorLists === "function") {
    updateArmorLists(workingLists.armorPassives, workingLists.armorSets);
  }
};

// Filter a stratagem list based on the radio options (Eagles/Orbitals/etc.)
const filterStratList = async (baseList = null) => {
  let filteredList = [...(baseList ?? workingLists.strats)];

  const onlyRadios = [
    { radio: document.getElementById("onlyDefenseRadio"), category: "Defense" },
    { radio: document.getElementById("onlyEaglesRadio"), category: "Eagle" },
    {
      radio: document.getElementById("onlyOrbitalsRadio"),
      category: "Orbital",
    },
    { radio: document.getElementById("onlySupplyRadio"), category: "Supply" },
  ];

  // Check for "only" options first
  for (const { radio, category } of onlyRadios) {
    if (radio?.checked) {
      return filteredList.filter((strat) => strat.category === category);
    }
  }

  // Filter out "no" options
  const noRadios = [
    { radio: document.getElementById("noDefenseRadio"), category: "Defense" },
    { radio: document.getElementById("noEaglesRadio"), category: "Eagle" },
    { radio: document.getElementById("noOrbitalsRadio"), category: "Orbital" },
    { radio: document.getElementById("noSupplyRadio"), category: "Supply" },
  ];

  const categoriesToFilter = noRadios
    .filter(({ radio }) => radio?.checked && !radio.disabled)
    .map(({ category }) => category);

  if (categoriesToFilter.length) {
    filteredList = filteredList.filter(
      (strat) => !categoriesToFilter.includes(strat.category),
    );
  }

  return filteredList;
};

// A player's stratagem pool: their warbond selection plus the shared radio options
const filterStratListForPlayer = async (playerIndex) =>
  filterStratList(getPlayerWorkingLists(playerIndex).strats);

// Get random unique numbers with supply constraints (solo mode - one player)
const getRandomUniqueNumbers = (list, options, amt) => {
  const { oneSupport, oneBackpack, alwaysSupport, alwaysBackpack } = options;
  let hasBackpack = false;
  let hasSupportWeapon = false;
  let hasExosuit = false;
  let hasFRV = false;
  const numbers = [];

  // Early exit if constraints can't be met
  if (alwaysSupport && !list.some((item) => item.tags?.includes(TAG_SUPPORT))) {
    console.warn("No support weapons available");
    return [];
  }
  if (
    alwaysBackpack &&
    !list.some((item) => item.tags?.includes(TAG_BACKPACK))
  ) {
    console.warn("No backpacks available");
    return [];
  }

  let attempts = 0;
  const maxAttempts = 500;

  while (numbers.length < amt && attempts < maxAttempts) {
    attempts++;
    const randomNumber = Math.floor(random() * list.length);
    const item = list[randomNumber];
    const tags = item.tags || [];
    const isSupport = tags.includes(TAG_SUPPORT);
    const isBackpack = tags.includes(TAG_BACKPACK);
    const isExosuit = tags.includes("exosuit");
    const isFRV = tags.includes("frv");

    // Skip duplicates
    if (numbers.includes(randomNumber)) {
      continue;
    }

    // If we already have an exosuit, skip any additional exosuits (enforces max 1 exosuit)
    if (hasExosuit && isExosuit) {
      continue;
    }

    if (hasFRV && isFRV) {
      continue;
    }

    // Check "one support" constraint
    if (oneSupport && hasSupportWeapon && isSupport) {
      continue;
    }

    // Check "one backpack" constraint
    if (oneBackpack && hasBackpack && isBackpack) {
      continue;
    }

    // For "always" constraints, we need to check if this item helps fulfill a needed requirement
    let needed = [];
    if (alwaysSupport && !hasSupportWeapon) needed.push("support");
    if (alwaysBackpack && !hasBackpack) needed.push("backpack");

    // If we have unmet requirements, this item must satisfy at least one of them
    if (needed.length > 0) {
      const satisfiesSupport = needed.includes("support") && isSupport;
      const satisfiesBackpack = needed.includes("backpack") && isBackpack;

      if (!satisfiesSupport && !satisfiesBackpack) {
        continue;
      }
    }

    // If we get here, the item is valid
    numbers.push(randomNumber);
    if (isSupport) hasSupportWeapon = true;
    if (isBackpack) hasBackpack = true;
    if (isExosuit) hasExosuit = true;
    if (isFRV) hasFRV = true;
  }

  if (attempts >= maxAttempts) {
    console.error("Max attempts reached, returning what we have");
  }

  return numbers;
};

// Squad mode: roll stratagems for the whole team with team-wide constraints.
// Each player draws from their own pool (their warbond selection + the shared
// radio options), so the fill happens player by player against shared team
// counters.
const rollTeamStratagems = (pools, options, lockedByPlayer) => {
  const total = TEAM_SIZE * 4; // 4 stratagem slots per player

  // Team-wide caps. "Always" rules take priority over "only one" rules, and
  // the team-wide "only one" rule beats the per-player one (it is stricter).
  const maxSupports = options.alwaysSupport
    ? TEAM_SIZE
    : options.oneSupport
      ? 1
      : options.oneSupportPerPlayer
        ? TEAM_SIZE
        : total;
  const maxBackpacks = options.alwaysBackpack
    ? TEAM_SIZE
    : options.oneBackpack
      ? 1
      : options.oneBackpackPerPlayer
        ? TEAM_SIZE
        : total;

  // Try progressively looser rule sets so tiny per-player pools can still fill
  // the squad. Support/backpack counts are relaxed last - the vehicle caps and
  // then uniqueness give way first.
  const fillTiers = [
    { unique: true, respectCaps: true, respectVehicleCaps: true },
    { unique: true, respectCaps: true, respectVehicleCaps: false },
    { unique: true, respectCaps: false, respectVehicleCaps: false },
    { unique: false, respectCaps: false, respectVehicleCaps: false },
  ];

  let result = null;
  for (const tier of fillTiers) {
    for (let attempt = 0; attempt < 200; attempt++) {
      result = tryFillTeam(
        pools,
        options,
        tier,
        maxSupports,
        maxBackpacks,
        lockedByPlayer,
      );
      if (result) break;
    }
    if (result) break;
  }

  if (!result) {
    console.warn("Squad randomizer: could not fill all stratagem slots");
    // Last resort: everyone gets four random stratagems from their own pool.
    result = pools.map((pool) => {
      const picks = [];
      for (let i = 0; i < 4 && pool.length; i++) {
        picks.push(pool[Math.floor(random() * pool.length)]);
      }
      return picks;
    });
  }

  return result;
};

// One attempt at filling all four players. Returns per-player pick arrays, or
// null when some player could not be filled under the current tier's rules.
const tryFillTeam = (
  pools,
  options,
  tier,
  maxSupports,
  maxBackpacks,
  lockedByPlayer,
) => {
  const used = new Set();
  const perPlayer = [[], [], [], []];
  const team = { s: 0, b: 0, e: 0, f: 0 };
  const supportCapPerPlayer =
    tier.respectCaps && options.oneSupportPerPlayer ? 1 : TEAM_SIZE;
  const backpackCapPerPlayer =
    tier.respectCaps && options.oneBackpackPerPlayer ? 1 : TEAM_SIZE;

  const acceptItem = (playerIndex, item) => {
    perPlayer[playerIndex].push(item);
    if (tier.unique) used.add(item.internalName);
    if (isSupportItem(item)) team.s += 1;
    if (isBackpackItem(item)) team.b += 1;
    if (isExosuitItem(item)) team.e += 1;
    if (isFrvItem(item)) team.f += 1;
  };

  // 0. Locked slots are placed first and always count as taken.
  for (let playerIndex = 0; playerIndex < TEAM_SIZE; playerIndex++) {
    (lockedByPlayer?.[playerIndex] || []).forEach((item) => {
      if (!item) return;
      if (!pools[playerIndex].some((x) => x.internalName === item.internalName)) {
        return; // lock dropped elsewhere when the item left the pool
      }
      perPlayer[playerIndex].push(item);
      used.add(item.internalName);
      if (isSupportItem(item)) team.s += 1;
      if (isBackpackItem(item)) team.b += 1;
      if (isExosuitItem(item)) team.e += 1;
      if (isFrvItem(item)) team.f += 1;
    });
  }

  // 1. Guaranteed picks: with "always" rules every player gets one of each
  // required category (dual-tagged items such as the Autocannon count for
  // both, and single-tag items are preferred when both rules are active).
  // Locked items already satisfy their player's requirement.
  for (let playerIndex = 0; playerIndex < TEAM_SIZE; playerIndex++) {
    const pool = pools[playerIndex];

    if (
      options.alwaysSupport &&
      !perPlayer[playerIndex].some(isSupportItem)
    ) {
      const available = pool.filter(
        (item) =>
          !used.has(item.internalName) &&
          isSupportItem(item) &&
          (!tier.respectCaps || team.s < maxSupports),
      );
      if (available.length) {
        const candidates = options.alwaysBackpack
          ? available.filter((item) => !isBackpackItem(item))
          : available;
        const chosenList = candidates.length ? candidates : available;
        acceptItem(
          playerIndex,
          chosenList[Math.floor(random() * chosenList.length)],
        );
      }
    }

    if (
      options.alwaysBackpack &&
      !perPlayer[playerIndex].some(isBackpackItem)
    ) {
      // (role requirements are handled below)
      const available = pool.filter(
        (item) =>
          !used.has(item.internalName) &&
          isBackpackItem(item) &&
          (!tier.respectCaps || team.b < maxBackpacks),
      );
      if (available.length) {
        // Prefer single-tag backpacks so the support count stays exact when
        // both "always" rules are active
        const candidates = options.alwaysSupport
          ? available.filter((item) => !isSupportItem(item))
          : available;
        const chosenList = candidates.length ? candidates : available;
        acceptItem(
          playerIndex,
          chosenList[Math.floor(random() * chosenList.length)],
        );
      }
    }

    // Role requirement: this player must draw a stratagem matching their role
    const role = ROLES[playerRoles[playerIndex]];
    if (role && !perPlayer[playerIndex].some(role.matches)) {
      const picks = perPlayer[playerIndex];
      const playerSupports = picks.filter(isSupportItem).length;
      const playerBackpacks = picks.filter(isBackpackItem).length;
      const available = pool.filter((item) => {
        if (used.has(item.internalName) || !role.matches(item)) return false;
        if (!tier.respectCaps) return true;
        if (
          isSupportItem(item) &&
          (team.s >= maxSupports || playerSupports >= supportCapPerPlayer)
        ) {
          return false;
        }
        if (
          isBackpackItem(item) &&
          (team.b >= maxBackpacks || playerBackpacks >= backpackCapPerPlayer)
        ) {
          return false;
        }
        return true;
      });
      if (available.length) {
        acceptItem(
          playerIndex,
          available[Math.floor(random() * available.length)],
        );
      }
    }
  }

  // 2. Fill every player's remaining slots from their own pool
  for (let playerIndex = 0; playerIndex < TEAM_SIZE; playerIndex++) {
    const picks = perPlayer[playerIndex];
    let playerSupports = picks.filter(isSupportItem).length;
    let playerBackpacks = picks.filter(isBackpackItem).length;

    for (const item of shuffleArray(pools[playerIndex])) {
      if (picks.length >= 4) break;
      if (tier.unique && used.has(item.internalName)) continue;

      if (
        isSupportItem(item) &&
        tier.respectCaps &&
        (team.s >= maxSupports || playerSupports >= supportCapPerPlayer)
      ) {
        continue;
      }
      if (
        isBackpackItem(item) &&
        tier.respectCaps &&
        (team.b >= maxBackpacks || playerBackpacks >= backpackCapPerPlayer)
      ) {
        continue;
      }
      if (isExosuitItem(item) && tier.respectVehicleCaps && team.e >= 1) {
        continue;
      }
      if (isFrvItem(item) && tier.respectVehicleCaps && team.f >= 1) {
        continue;
      }

      acceptItem(playerIndex, item);
      if (isSupportItem(item)) playerSupports += 1;
      if (isBackpackItem(item)) playerBackpacks += 1;
    }

    if (picks.length < 4) return null; // this attempt failed
  }

  // Role requirements must hold before the attempt counts as a success -
  // otherwise later, cap-relaxed tiers get a chance to satisfy them.
  for (let playerIndex = 0; playerIndex < TEAM_SIZE; playerIndex++) {
    const role = ROLES[playerRoles[playerIndex]];
    if (role && !perPlayer[playerIndex].some(role.matches)) {
      return null;
    }
  }

  return perPlayer;
};

// Card HTML template for a stratagem
const stratCardHTML = (stratagem, playerIndex, position) => `
  <div class="col-3 px-1 d-flex justify-content-center">
    <div class="card itemCards" data-internal-name="${stratagem.internalName}" data-category="strat" data-position="${position}" data-player="${playerIndex}">
      <button class="lockButton" type="button" title="Lock / unlock">
        <i class="bi bi-unlock"></i>
      </button>
      <img
          src="../images/stratagems/${stratagem.imageURL}"
          class="img-card-top"
          alt="${stratagem.displayName}"
          id="${stratagem.internalName}-randImage"
      />
      <div class="card-body itemNameContainer p-0 p-lg-2 align-items-center">
          <p class="card-title text-white">${stratagem.displayName}</p>
      </div>
    </div>
  </div>
`;

// Card HTML template for a piece of equipment
const equipmentCardHTML = (item) => `
  <div class="col-3 px-1 d-flex justify-content-center">
    <div class="card itemCards" data-internal-name="${item.internalName}" data-category="${item.category}">
      <button class="lockButton" type="button" title="Lock / unlock">
        <i class="bi bi-unlock"></i>
      </button>
      <img
          src="../images/equipment/${item.imageURL}"
          class="img-card-top"
          alt="${item.displayName}"
          id="${item.internalName}-randImage"
      />
      <div class="card-body itemNameContainer p-0 p-lg-2 align-items-center">
          <p class="card-title text-white">${item.displayName}</p>
      </div>
    </div>
  </div>
`;

// Roll stratagems
const rollStratagems = async () => {
  proTipCounter++;
  if (proTipCounter === 3) rollProTip();

  const options = getSupplyOptions();
  const containers = getStratContainers();

  // Per player: a length-4 array with one item (or undefined) per slot, so
  // locked slots keep their position.
  const slots = [];

  if (teamMode) {
    // Every player rolls from their own pool (per-player warbonds + shared
    // radio options) against the team-wide constraints.
    const pools = [];
    for (let playerIndex = 0; playerIndex < containers.length; playerIndex++) {
      pools.push(await filterStratListForPlayer(playerIndex));
    }
    const lockedByPlayer = containers.map((_, playerIndex) =>
      collectLockedStrats(playerIndex, pools[playerIndex]),
    );
    const playerPicks = rollTeamStratagems(pools, options, lockedByPlayer);

    containers.forEach((_, playerIndex) => {
      const locked = lockedByPlayer[playerIndex];
      const lockedNames = new Set(
        locked.filter(Boolean).map((item) => item.internalName),
      );
      const newPicks = (playerPicks[playerIndex] || []).filter(
        (item) => !lockedNames.has(item.internalName),
      );
      const row = new Array(4);
      let next = 0;
      for (let position = 0; position < 4; position++) {
        row[position] = locked[position] ?? newPicks[next++];
      }
      slots.push(row);
    });
  } else {
    const filteredList = await filterStratList();
    for (let playerIndex = 0; playerIndex < containers.length; playerIndex++) {
      const locked = collectLockedStrats(playerIndex, filteredList);
      const ownItems = locked.filter(Boolean);
      const newPicks = pickStratagemsForSlots(
        filteredList,
        4 - ownItems.length,
        ownItems,
        [],
        options,
      );
      const row = new Array(4);
      let next = 0;
      for (let position = 0; position < 4; position++) {
        row[position] = locked[position] ?? newPicks[next++];
      }
      slots.push(row);
    }
  }

  rolledStrats = [];

  containers.forEach((container, playerIndex) => {
    container.innerHTML = "";
    (slots[playerIndex] || []).forEach((stratagem, position) => {
      if (!stratagem) return;
      rolledStrats.push(stratagem.internalName);
      container.innerHTML += stratCardHTML(stratagem, playerIndex, position);
    });
  });

  refreshLockIcons();
};

// Roll one player's equipment from their own pool.
// usedBoosters tracks boosters already taken by other squad members.
// usedByOthers (optional) maps category -> Set of internalNames taken by
// other players, for the "no duplicate equipment" option.
const rollEquipmentForPlayer = (
  container,
  playerIndex,
  usedBoosters,
  usedByOthers,
) => {
  const equipmentCategories = ["prims", "seconds", "throws", "boosts"];
  const lists = getPlayerWorkingLists(playerIndex);
  container.innerHTML = "";

  equipmentCategories.forEach((category) => {
    let list = lists[category];

    if (!list?.length) {
      container.innerHTML += `<div class="col-3 d-flex justify-content-center"><div class="card itemCards"></div></div>`;
      return;
    }

    // A locked slot keeps its item (as long as it is still in the pool)
    const lockKey = `equip:${playerIndex}:${category}`;
    if (lockedSlots.has(lockKey)) {
      const lockedItem =
        list.find(
          (item) => item.internalName === lockedSlots.get(lockKey),
        ) || null;
      if (lockedItem) {
        if (category === "boosts") usedBoosters.add(lockedItem.internalName);
        if (usedByOthers) {
          if (!usedByOthers.has(category)) {
            usedByOthers.set(category, new Set());
          }
          usedByOthers.get(category).add(lockedItem.internalName);
        }
        container.innerHTML += equipmentCardHTML(lockedItem);
        return;
      }
      lockedSlots.delete(lockKey);
    }

    if (teamMode && category === "boosts") {
      const unused = list.filter(
        (item) => !usedBoosters.has(item.internalName),
      );
      if (unused.length) {
        list = unused;
      } else {
        console.warn(
          "Squad randomizer: not enough unique boosters, allowing duplicates",
        );
      }
    }

    if (usedByOthers?.has(category)) {
      const taken = usedByOthers.get(category);
      const unused = list.filter(
        (item) => !taken.has(item.internalName),
      );
      if (unused.length) {
        list = unused;
      } else {
        console.warn(
          "Squad randomizer: no unique equipment left, allowing duplicates",
        );
      }
    }

    const randomIndex = Math.floor(random() * list.length);
    const item = list[randomIndex];
    if (category === "boosts") usedBoosters.add(item.internalName);
    if (usedByOthers) {
      if (!usedByOthers.has(category)) {
        usedByOthers.set(category, new Set());
      }
      usedByOthers.get(category).add(item.internalName);
    }

    container.innerHTML += equipmentCardHTML(item);
  });
};

// Roll equipment
const rollEquipment = () => {
  proTipCounter++;
  if (proTipCounter === 3) rollProTip();

  const options = getSupplyOptions();
  // Boosters are unique across the team (matching the in-game rule)
  const usedBoosters = new Set();
  const usedByOthers = options.uniqueEquipment ? new Map() : null;
  getEquipmentContainers().forEach((container, playerIndex) => {
    rollEquipmentForPlayer(
      container,
      playerIndex,
      usedBoosters,
      usedByOthers,
    );
  });
  refreshLockIcons();
};

// Shared helper: swap a card's contents for a new item
const updateCardWithItem = (card, item, imagePath) => {
  const img = card.querySelector("img");
  const nameP = card.querySelector(".card-title");

  if (img && nameP) {
    img.src = `${imagePath}${item.imageURL}`;
    nameP.innerText = item.displayName;
    card.dataset.internalName = item.internalName;
  }
};

// --- Item locks -------------------------------------------------------------
// A locked slot keeps its current item through re-rolls. Keys look like
// "strat:0:2", "equip:1:booster" or "armor:3" and store the internalName.

const refreshLockIcons = () => {
  document.querySelectorAll("#loadoutSlots .itemCards").forEach((card) => {
    let key = null;
    if (card.classList.contains("armorLogo")) {
      key = `armor:${card.dataset.player || 0}`;
    } else if (card.dataset.category === "strat") {
      key = `strat:${card.dataset.player || 0}:${card.dataset.position || 0}`;
    } else if (card.dataset.category) {
      key = `equip:${card.closest(".equipmentContainer")?.dataset.player || 0}:${card.dataset.category}`;
    }
    if (!key) return;
    const locked = lockedSlots.has(key);
    card.classList.toggle("lockedCard", locked);
    const icon = card.querySelector(".lockButton i");
    if (icon) {
      icon.className = locked ? "bi bi-lock-fill" : "bi bi-unlock";
    }
  });
};

// Toggle the lock on a stratagem/equipment card
const toggleCardLock = (card) => {
  if (!card) return;
  let key = null;
  if (card.dataset.category === "strat") {
    key = `strat:${card.dataset.player || 0}:${card.dataset.position || 0}`;
  } else if (card.dataset.category) {
    key = `equip:${card.closest(".equipmentContainer")?.dataset.player || 0}:${card.dataset.category}`;
  }
  if (!key) return;
  if (lockedSlots.has(key)) {
    lockedSlots.delete(key);
  } else if (card.dataset.internalName) {
    lockedSlots.set(key, card.dataset.internalName);
  }
  refreshLockIcons();
};

// Toggle the lock on an armor card
const toggleArmorLock = (buttonElement) => {
  const card = buttonElement.closest(".armorLogo");
  if (!card) return;
  const key = `armor:${card.dataset.player || 0}`;
  if (lockedSlots.has(key)) {
    lockedSlots.delete(key);
  } else if (card.dataset.internalName) {
    lockedSlots.set(key, card.dataset.internalName);
  }
  refreshLockIcons();
};

// Locked stratagem slots for a player, validated against their current pool.
// Returns a length-4 array with the locked item (or undefined) per position;
// locks whose item left the pool are dropped.
const collectLockedStrats = (playerIndex, pool) => {
  const slots = new Array(4);
  for (let position = 0; position < 4; position++) {
    const key = `strat:${playerIndex}:${position}`;
    if (!lockedSlots.has(key)) continue;
    const item = pool.find(
      (s) => s.internalName === lockedSlots.get(key),
    );
    if (item) {
      slots[position] = item;
    } else {
      lockedSlots.delete(key);
    }
  }
  return slots;
};

// Pick `count` stratagems for a player while honouring every rule relative to
// items that are staying put (their own locked items + other players' rolls).
const pickStratagemsForSlots = (
  pool,
  count,
  ownItems,
  otherItems,
  options,
) => {
  if (count <= 0) return [];
  const usedNames = new Set(
    [...ownItems, ...otherItems].map((item) => item.internalName),
  );
  const ownSupports = ownItems.filter(isSupportItem).length;
  const ownBackpacks = ownItems.filter(isBackpackItem).length;
  const ownExosuits = ownItems.filter(isExosuitItem).length;
  const ownFRVs = ownItems.filter(isFrvItem).length;
  const remainingSupports = otherItems.filter(isSupportItem).length;
  const remainingBackpacks = otherItems.filter(isBackpackItem).length;
  const remainingExosuits = otherItems.filter(isExosuitItem).length;
  const remainingFRVs = otherItems.filter(isFrvItem).length;

  const effectiveOptions = {
    oneSupport: false,
    oneBackpack: false,
    alwaysSupport: false,
    alwaysBackpack: false,
  };
  let candidates = pool.filter(
    (item) => !usedNames.has(item.internalName),
  );

  if (options.alwaysSupport) {
    if (ownSupports === 0) {
      effectiveOptions.alwaysSupport = true;
      effectiveOptions.oneSupport = true;
    }
  } else {
    const blockSupports =
      (options.oneSupport && remainingSupports + ownSupports >= 1) ||
      (options.oneSupportPerPlayer && ownSupports >= 1);
    if (blockSupports) {
      candidates = candidates.filter((item) => !isSupportItem(item));
    } else if (options.oneSupport || options.oneSupportPerPlayer) {
      effectiveOptions.oneSupport = true;
    }
  }

  if (options.alwaysBackpack) {
    if (ownBackpacks === 0) {
      effectiveOptions.alwaysBackpack = true;
      effectiveOptions.oneBackpack = true;
    }
  } else {
    const blockBackpacks =
      (options.oneBackpack && remainingBackpacks + ownBackpacks >= 1) ||
      (options.oneBackpackPerPlayer && ownBackpacks >= 1);
    if (blockBackpacks) {
      candidates = candidates.filter((item) => !isBackpackItem(item));
    } else if (options.oneBackpack || options.oneBackpackPerPlayer) {
      effectiveOptions.oneBackpack = true;
    }
  }

  if (remainingExosuits + ownExosuits >= 1) {
    candidates = candidates.filter((item) => !isExosuitItem(item));
  }
  if (remainingFRVs + ownFRVs >= 1) {
    candidates = candidates.filter((item) => !isFrvItem(item));
  }

  const indices = getRandomUniqueNumbers(candidates, effectiveOptions, count);
  return indices.map((index) => candidates[index]).filter(Boolean);
};

// Fill a role requirement by swapping out the least-constrained pick
const repairRoleRequirement = (picks, pool, role, usedNames) => {
  if (!role || picks.some(role.matches)) return;
  const candidates = pool.filter(
    (item) =>
      role.matches(item) &&
      !usedNames.has(item.internalName) &&
      !picks.some((pick) => pick.internalName === item.internalName),
  );
  if (!candidates.length) {
    console.warn("Squad randomizer: could not satisfy role requirement");
    return;
  }
  const replaceableIndex = picks.findIndex(
    (item) => !isSupportItem(item) && !isBackpackItem(item),
  );
  const index = replaceableIndex >= 0 ? replaceableIndex : picks.length - 1;
  if (index >= 0) {
    picks[index] = candidates[Math.floor(random() * candidates.length)];
  }
};

// --- Copy loadout as text ---------------------------------------------------

const copyLoadoutText = async () => {
  const armorContainers = getArmorContainers();
  const equipContainers = getEquipmentContainers();
  const stratContainers = getStratContainers();
  const playerCount = teamMode ? TEAM_SIZE : 1;

  const lines = ["Helldivers 2 Randomizer"];
  const seedValue = document.getElementById("seedInput")?.value?.trim();
  if (seedValue) lines.push(`Seed: ${seedValue}`);

  for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
    lines.push("");
    lines.push(teamMode ? `Player ${playerIndex + 1}` : "Loadout");

    const armorName = armorContainers[playerIndex]
      ?.querySelector(".card-title")
      ?.innerText?.trim();
    if (armorName) lines.push(`  Armor: ${armorName}`);

    const equipment = equipContainers[playerIndex]
      ? Array.from(
          equipContainers[playerIndex].querySelectorAll(".card-title"),
        )
          .map((el) => el.innerText?.trim())
          .filter(Boolean)
      : [];
    if (equipment.length === 4) {
      lines.push(
        `  Primary: ${equipment[0]} | Secondary: ${equipment[1]} | Throwable: ${equipment[2]} | Booster: ${equipment[3]}`,
      );
    }

    const stratagems = stratContainers[playerIndex]
      ? Array.from(
          stratContainers[playerIndex].querySelectorAll(".card-title"),
        )
          .map((el) => el.innerText?.trim())
          .filter(Boolean)
      : [];
    stratagems.forEach((name, position) =>
      lines.push(`  Stratagem ${position + 1}: ${name}`),
    );
  }

  const text = lines.join("\n");
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  const button = document.getElementById("copyLoadoutButton");
  if (button) {
    const icon = button.querySelector("i");
    if (icon) icon.className = "bi bi-check2";
    setTimeout(() => {
      if (icon) icon.className = "bi bi-clipboard";
    }, 1500);
  }
};

window.copyLoadoutText = copyLoadoutText;
window.refreshLockIcons = refreshLockIcons;
window.toggleArmorLock = toggleArmorLock;

// Reroll a single stratagem card (team-aware)
const rerollStratItem = async (internalName) => {
  const options = getSupplyOptions();

  // Collect every stratagem card, player by player, in roll order
  const allStratCards = getStratContainers().flatMap((container) =>
    Array.from(container.querySelectorAll(".card.itemCards")),
  );

  const clickedCard = allStratCards.find(
    (card) =>
      card.dataset.internalName === internalName &&
      card.dataset.category === "strat",
  );
  if (!clickedCard) return;

  // The clicked card's player owns the pool this reroll draws from
  const playerIndex = Number(clickedCard.dataset.player) || 0;
  if (lockedSlots.has(`strat:${playerIndex}:${clickedCard.dataset.position || 0}`)) {
    return; // locked slots cannot be re-rolled individually
  }
  const filteredList = await filterStratListForPlayer(playerIndex);

  const currentPosition = allStratCards.indexOf(clickedCard);

  // Identify the currently rolled stratagems (from the full list, so options
  // changed since the roll don't break identification)
  const currentItems = allStratCards
    .map((card) =>
      STRATAGEMS.find((s) => s.internalName === card.dataset.internalName),
    )
    .filter(Boolean);

  const currentItem = currentItems[currentPosition];
  if (!currentItem) return;

  // Everything that must stay in place: in squad mode that is the whole team,
  // in solo mode just the other three slots of the single loadout.
  const otherItems = currentItems.filter(
    (_, index) => index !== currentPosition,
  );
  const otherItemNames = new Set(otherItems.map((item) => item.internalName));

  const remainingSupports = otherItems.filter(isSupportItem).length;
  const remainingBackpacks = otherItems.filter(isBackpackItem).length;
  const remainingExosuits = otherItems.filter(isExosuitItem).length;
  const remainingFRVs = otherItems.filter(isFrvItem).length;

  // The rerolled player's own remaining slots (for the per-player "only one"
  // rules, which only apply in squad mode)
  const samePlayerOtherItems = allStratCards
    .filter(
      (card) =>
        card !== clickedCard &&
        card.dataset.player === clickedCard.dataset.player,
    )
    .map((card) =>
      STRATAGEMS.find((s) => s.internalName === card.dataset.internalName),
    )
    .filter(Boolean);
  const playerRemainingSupports = samePlayerOtherItems.filter(
    isSupportItem,
  ).length;
  const playerRemainingBackpacks = samePlayerOtherItems.filter(
    isBackpackItem,
  ).length;

  // "Always" guarantees one per player in squad mode, one per loadout in solo
  const requiredMinimum = teamMode ? TEAM_SIZE : 1;

  let availableItems = filteredList.filter(
    (item) => !otherItemNames.has(item.internalName),
  );

  // Apply "always support" constraint (takes priority over the "only one"
  // support rules)
  if (options.alwaysSupport && remainingSupports < requiredMinimum) {
    availableItems = availableItems.filter(isSupportItem);
  } else if (options.oneSupport && remainingSupports >= 1) {
    availableItems = availableItems.filter((item) => !isSupportItem(item));
  } else if (
    teamMode &&
    options.oneSupportPerPlayer &&
    playerRemainingSupports >= 1
  ) {
    availableItems = availableItems.filter((item) => !isSupportItem(item));
  }

  // Apply "always backpack" constraint (takes priority over the "only one"
  // backpack rules)
  if (options.alwaysBackpack && remainingBackpacks < requiredMinimum) {
    availableItems = availableItems.filter(isBackpackItem);
  } else if (options.oneBackpack && remainingBackpacks >= 1) {
    availableItems = availableItems.filter((item) => !isBackpackItem(item));
  } else if (
    teamMode &&
    options.oneBackpackPerPlayer &&
    playerRemainingBackpacks >= 1
  ) {
    availableItems = availableItems.filter((item) => !isBackpackItem(item));
  }

  // Max one exosuit / FRV across the team
  if (remainingExosuits >= 1) {
    availableItems = availableItems.filter((item) => !isExosuitItem(item));
  }
  if (remainingFRVs >= 1) {
    availableItems = availableItems.filter((item) => !isFrvItem(item));
  }

  // Avoid rolling the same item again
  availableItems = availableItems.filter(
    (item) => item.internalName !== currentItem.internalName,
  );

  if (availableItems.length === 0) {
    console.warn("No valid stratagems available for reroll");
    return;
  }

  const randomIndex = Math.floor(random() * availableItems.length);
  const newItem = availableItems[randomIndex];

  updateCardWithItem(clickedCard, newItem, "../images/stratagems/");

  if (rolledStrats[currentPosition] !== undefined) {
    rolledStrats[currentPosition] = newItem.internalName;
  }
};

// Reroll a single equipment card (team-aware for boosters)
const rerollEquipmentItem = (internalName, category) => {
  const categoryMap = {
    primary: "prims",
    secondary: "seconds",
    throwable: "throws",
    booster: "boosts",
  };

  const clickedCard = document.querySelector(
    `.card[data-internal-name="${internalName}"][data-category="${category}"]`,
  );
  if (!clickedCard) return;

  const playerContainer = clickedCard.closest(".equipmentContainer");
  if (!playerContainer) return;

  const playerIndex = Number(playerContainer.dataset.player) || 0;
  if (lockedSlots.has(`equip:${playerIndex}:${category}`)) {
    return; // locked slots cannot be re-rolled individually
  }
  const listKey = categoryMap[category];
  const list = getPlayerWorkingLists(playerIndex)[listKey];
  if (!list?.length) return;

  // Remove current item to avoid rolling the same one
  let availableItems = list.filter((item) => item.internalName !== internalName);

  // Prevent duplicates within the same player's equipment slots
  const otherCards = Array.from(
    playerContainer.querySelectorAll(".card.itemCards"),
  ).filter((card) => card !== clickedCard);
  const otherInternalNames = new Set(
    otherCards.map((card) => card.dataset.internalName),
  );
  availableItems = availableItems.filter(
    (item) => !otherInternalNames.has(item.internalName),
  );

  // Boosters are always unique across the squad; with the "no duplicate
  // equipment" option on, every category is.
  if (
    teamMode &&
    (category === "booster" || getSupplyOptions().uniqueEquipment)
  ) {
    const otherNames = getEquipmentContainers()
      .filter((container) => container !== playerContainer)
      .flatMap((container) =>
        Array.from(
          container.querySelectorAll(`.card[data-category="${category}"]`),
        ).map((card) => card.dataset.internalName),
      );

    const uniqueOptions = availableItems.filter(
      (item) => !otherNames.includes(item.internalName),
    );
    if (uniqueOptions.length) {
      availableItems = uniqueOptions;
    }
  }

  if (availableItems.length === 0) {
    console.warn("No unique equipment available");
    return;
  }

  const randomIndex = Math.floor(random() * availableItems.length);
  const newItem = availableItems[randomIndex];

  updateCardWithItem(clickedCard, newItem, "../images/equipment/");
};

// Reroll individual item
const rerollItem = async (internalName, category) => {
  if (category === "strat") {
    await rerollStratItem(internalName);
  } else {
    rerollEquipmentItem(internalName, category);
  }
};

// Make rerollItem available globally
window.rerollItem = rerollItem;

// Re-roll one player's whole loadout (squad mode). The other players keep
// their rolls, and all team-wide rules still hold.
const rerollPlayer = async (playerIndex) => {
  if (!teamMode) return;
  const options = getSupplyOptions();
  const stratContainers = getStratContainers();
  const equipContainers = getEquipmentContainers();
  const targetStratContainer = stratContainers[playerIndex];
  if (!targetStratContainer) return;

  // Everything currently held by the OTHER players
  const otherItems = [];
  stratContainers.forEach((container, index) => {
    if (index === playerIndex) return;
    container.querySelectorAll(".card.itemCards").forEach((card) => {
      const item = STRATAGEMS.find(
        (s) => s.internalName === card.dataset.internalName,
      );
      if (item) otherItems.push(item);
    });
  });
  const usedNames = new Set(otherItems.map((item) => item.internalName));
  const remainingSupports = otherItems.filter(isSupportItem).length;
  const remainingBackpacks = otherItems.filter(isBackpackItem).length;
  const remainingExosuits = otherItems.filter(isExosuitItem).length;
  const remainingFRVs = otherItems.filter(isFrvItem).length;

  // Locked stratagem slots stay; the rest are re-rolled around them
  const fullPool = await filterStratListForPlayer(playerIndex);
  const locked = collectLockedStrats(playerIndex, fullPool);
  const ownItems = locked.filter(Boolean);
  const usedNames = new Set([
    ...ownItems,
    ...otherItems,
  ].map((item) => item.internalName));
  const pool = fullPool.filter((item) => !usedNames.has(item.internalName));

  const picks = pickStratagemsForSlots(
    pool,
    4 - ownItems.length,
    ownItems,
    otherItems,
    options,
  );

  // Role requirement is repaired after the fact (swapping the least
  // constrained pick for a role-matching one)
  repairRoleRequirement(picks, pool, ROLES[playerRoles[playerIndex]], usedNames);

  const row = new Array(4);
  let next = 0;
  for (let position = 0; position < 4; position++) {
    row[position] = locked[position] ?? picks[next++];
  }

  targetStratContainer.innerHTML = "";
  row.forEach((stratagem, position) => {
    if (!stratagem) return;
    if (rolledStrats[playerIndex * 4 + position] !== undefined) {
      rolledStrats[playerIndex * 4 + position] = stratagem.internalName;
    }
    targetStratContainer.innerHTML += stratCardHTML(
      stratagem,
      playerIndex,
      position,
    );
  });

  // Equipment: other players' current items are avoided when the "no
  // duplicate equipment" option is on; boosters are always unique
  const usedBoosters = new Set();
  equipContainers.forEach((container, index) => {
    if (index === playerIndex) return;
    container
      .querySelectorAll('.card[data-category="booster"]')
      .forEach((card) => {
        if (card.dataset.internalName) {
          usedBoosters.add(card.dataset.internalName);
        }
      });
  });
  let usedByOthers = null;
  if (options.uniqueEquipment) {
    usedByOthers = new Map();
    equipContainers.forEach((container, index) => {
      if (index === playerIndex) return;
      container
        .querySelectorAll(".card.itemCards[data-category]")
        .forEach((card) => {
          const cat = card.dataset.category;
          if (!cat || cat === "strat" || !card.dataset.internalName) return;
          if (!usedByOthers.has(cat)) usedByOthers.set(cat, new Set());
          usedByOthers.get(cat).add(card.dataset.internalName);
        });
    });
  }
  rollEquipmentForPlayer(
    equipContainers[playerIndex],
    playerIndex,
    usedBoosters,
    usedByOthers,
  );
  refreshLockIcons();

  if (typeof rollArmor === "function") rollArmor(playerIndex);
};

// Make rerollPlayer available globally (used by the player header clicks)
window.rerollPlayer = rerollPlayer;

// Local storage management
const updateLocalStorage = (element, type) => {
  const randomizerOptions = JSON.parse(
    localStorage.getItem("randomizerOptions") || "{}",
  );

  randomizerOptions[type] = {
    ...randomizerOptions[type],
    [element.id]: element.checked,
  };

  localStorage.setItem("randomizerOptions", JSON.stringify(randomizerOptions));
};

const checkLocalStorageForOptionsPreferences = async () => {
  const stored = localStorage.getItem("randomizerOptions");

  if (!stored) {
    const defaultOptions = {
      warbondOptions: Object.fromEntries(
        Array.from({ length: 28 }, (_, i) => [`warbond${i}`, true]),
      ),
      stratagemOptions: {
        onlyEaglesRadio: false,
        noEaglesRadio: false,
        defaultEaglesRadio: true,
        onlyOrbitalsRadio: false,
        noOrbitalsRadio: false,
        defaultOrbitalsRadio: true,
        onlyDefenseRadio: false,
        noDefenseRadio: false,
        defaultDefenseRadio: true,
        onlySupplyRadio: false,
        noSupplyRadio: false,
        defaultSupplyRadio: true,
      },
      supplyAmountOptions: {
        oneBackpackCheck: false,
        oneSupportCheck: false,
        oneBackpackPerPlayerCheck: false,
        oneSupportPerPlayerCheck: false,
        alwaysBackpackCheck: false,
        alwaysSupportCheck: false,
      },
      teamModeOptions: {
        teamModeCheck: false,
      },
    };
    localStorage.setItem("randomizerOptions", JSON.stringify(defaultOptions));
    await applyStoredOptionsToLists(defaultOptions);
    return;
  }

  const data = JSON.parse(stored);
  await applyStoredOptionsToLists(data);
};

const applyStoredOptionsToLists = async (options) => {
  // Apply checkbox states
  for (const category in options) {
    for (const id in options[category]) {
      const element = document.getElementById(id);
      if (
        element &&
        (element.type === "checkbox" || element.type === "radio")
      ) {
        element.checked = options[category][id];
      }
    }
  }

  // Apply squad mode (rebuild the loadout DOM for the right number of players)
  teamMode = !!elements.teamModeCheck?.checked;
  buildLoadoutDOM();

  // Rebuild checkedWarbonds set
  checkedWarbonds.clear();
  Array.from(elements.warbondCheckboxes).forEach((cb) => {
    if (cb.checked) checkedWarbonds.add(cb.id);
  });

  // Per-player warbond selections (defaults to the global selection)
  loadSquadWarbondOptions(options);

  // Squad roles and seed
  const storedRoles = options.playerOptions;
  playerRoles = PLAYER_NAMES.map(
    (_, playerIndex) => storedRoles?.[`p${playerIndex}`] || null,
  );
  const seedValue = options.seedOptions?.seedInput || "";
  const seedInput = document.getElementById("seedInput");
  if (seedInput) seedInput.value = seedValue;
  setSeed(seedValue);

  updateToggleAllButton(); // Update the toggle button state after loading
  await filterItemsByWarbond();
  updatePerPlayerOptionsAvailability();
  updateRadioButtonsState();
};

// Utility functions
const rollProTip = () => {
  if (typeof PRO_TIPS !== "undefined" && PRO_TIPS?.length) {
    const randomTip = PRO_TIPS[Math.floor(random() * PRO_TIPS.length)];
    elements.proTipsText.innerHTML = randomTip;
    proTipCounter = 0;
  }
};

const randomizeAll = async () => {
  await checkLocalStorageForOptionsPreferences();
  updateToggleAllButton(); // Ensure toggle button reflects current state
  rollEquipment();
  await rollStratagems();
  if (typeof rollArmor === "function") rollArmor();
  rollProTip();
};

// Initialize
initEventListeners();
randomizeAll();
