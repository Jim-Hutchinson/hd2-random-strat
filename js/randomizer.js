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
});

// The per-player "only one" options only apply in squad mode, so they are
// disabled while rolling for a single player.
const updatePerPlayerOptionsAvailability = () => {
  ["oneSupportPerPlayerCheck", "oneBackpackPerPlayerCheck"].forEach((id) => {
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

// Helper: Shuffle a copy of an array (Fisher-Yates)
const shuffleArray = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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
          <h5
            class="text-white text-center playerHeader my-2"
            onclick="rerollPlayer(${playerIndex})"
            title="Re-roll this player's loadout"
          >
            ${name}
            <i class="bi bi-arrow-repeat ms-1"></i>
          </h5>
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

  // Reroll via click delegation on the loadout slots (works for every player)
  const loadoutSlots = document.getElementById("loadoutSlots");
  if (loadoutSlots) {
    loadoutSlots.addEventListener("click", (e) => {
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
    const randomNumber = Math.floor(Math.random() * list.length);
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
const rollTeamStratagems = (pools, options) => {
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
      result = tryFillTeam(pools, options, tier, maxSupports, maxBackpacks);
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
        picks.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      return picks;
    });
  }

  return result;
};

// One attempt at filling all four players. Returns per-player pick arrays, or
// null when some player could not be filled under the current tier's rules.
const tryFillTeam = (pools, options, tier, maxSupports, maxBackpacks) => {
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

  // 1. Guaranteed picks: with "always" rules every player gets one of each
  // required category (dual-tagged items such as the Autocannon count for
  // both, and single-tag items are preferred when both rules are active).
  for (let playerIndex = 0; playerIndex < TEAM_SIZE; playerIndex++) {
    const pool = pools[playerIndex];

    if (options.alwaysSupport) {
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
          chosenList[Math.floor(Math.random() * chosenList.length)],
        );
      }
    }

    if (
      options.alwaysBackpack &&
      !perPlayer[playerIndex].some(isBackpackItem)
    ) {
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
          chosenList[Math.floor(Math.random() * chosenList.length)],
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

  return perPlayer;
};

// Card HTML template for a stratagem
const stratCardHTML = (stratagem, playerIndex, position) => `
  <div class="col-3 px-1 d-flex justify-content-center">
    <div class="card itemCards" data-internal-name="${stratagem.internalName}" data-category="strat" data-position="${position}" data-player="${playerIndex}">
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

  let playerPicks;
  if (teamMode) {
    // Every player rolls from their own pool (per-player warbonds + shared
    // radio options) against the team-wide constraints.
    const pools = [];
    for (let playerIndex = 0; playerIndex < containers.length; playerIndex++) {
      pools.push(await filterStratListForPlayer(playerIndex));
    }
    playerPicks = rollTeamStratagems(pools, options);
  } else {
    const filteredList = await filterStratList();
    playerPicks = containers.map(() =>
      getRandomUniqueNumbers(filteredList, options, 4).map(
        (index) => filteredList[index],
      ),
    );
  }

  rolledStrats = [];

  containers.forEach((container, playerIndex) => {
    container.innerHTML = "";
    (playerPicks[playerIndex] || []).forEach((stratagem, position) => {
      rolledStrats.push(stratagem.internalName);
      container.innerHTML += stratCardHTML(stratagem, playerIndex, position);
    });
  });
};

// Roll one player's equipment from their own pool.
// usedBoosters tracks boosters already taken by other squad members.
const rollEquipmentForPlayer = (container, playerIndex, usedBoosters) => {
  const equipmentCategories = ["prims", "seconds", "throws", "boosts"];
  const lists = getPlayerWorkingLists(playerIndex);
  container.innerHTML = "";

  equipmentCategories.forEach((category) => {
    let list = lists[category];

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

    if (!list?.length) {
      container.innerHTML += `<div class="col-3 d-flex justify-content-center"><div class="card itemCards"></div></div>`;
      return;
    }

    const randomIndex = Math.floor(Math.random() * list.length);
    const item = list[randomIndex];
    if (category === "boosts") usedBoosters.add(item.internalName);

    container.innerHTML += equipmentCardHTML(item);
  });
};

// Roll equipment
const rollEquipment = () => {
  proTipCounter++;
  if (proTipCounter === 3) rollProTip();

  // Boosters are unique across the team (matching the in-game rule)
  const usedBoosters = new Set();
  getEquipmentContainers().forEach((container, playerIndex) => {
    rollEquipmentForPlayer(container, playerIndex, usedBoosters);
  });
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

  const randomIndex = Math.floor(Math.random() * availableItems.length);
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

  // Boosters are unique across the whole squad (matching the in-game rule)
  if (teamMode && category === "booster") {
    const otherBoosterNames = getEquipmentContainers()
      .filter((container) => container !== playerContainer)
      .flatMap((container) =>
        Array.from(
          container.querySelectorAll('.card[data-category="booster"]'),
        ).map((card) => card.dataset.internalName),
      );

    const uniqueOptions = availableItems.filter(
      (item) => !otherBoosterNames.includes(item.internalName),
    );
    if (uniqueOptions.length) {
      availableItems = uniqueOptions;
    }
  }

  if (availableItems.length === 0) {
    console.warn("No unique equipment available");
    return;
  }

  const randomIndex = Math.floor(Math.random() * availableItems.length);
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

  // Translate the team rules into constraints for this single player
  const effectiveOptions = {
    oneSupport: false,
    oneBackpack: false,
    alwaysSupport: false,
    alwaysBackpack: false,
  };
  let pool = (await filterStratListForPlayer(playerIndex)).filter(
    (item) => !usedNames.has(item.internalName),
  );

  if (options.alwaysSupport) {
    // They are one of the four Helldivers, so they bring exactly one support
    effectiveOptions.alwaysSupport = true;
    effectiveOptions.oneSupport = true;
  } else if (options.oneSupport || options.oneSupportPerPlayer) {
    effectiveOptions.oneSupport = true;
    if (options.oneSupport && remainingSupports >= 1) {
      // The team-wide cap is already used up by someone else
      pool = pool.filter((item) => !isSupportItem(item));
    }
  }

  if (options.alwaysBackpack) {
    effectiveOptions.alwaysBackpack = true;
    effectiveOptions.oneBackpack = true;
  } else if (options.oneBackpack || options.oneBackpackPerPlayer) {
    effectiveOptions.oneBackpack = true;
    if (options.oneBackpack && remainingBackpacks >= 1) {
      pool = pool.filter((item) => !isBackpackItem(item));
    }
  }

  if (remainingExosuits >= 1) {
    pool = pool.filter((item) => !isExosuitItem(item));
  }
  if (remainingFRVs >= 1) {
    pool = pool.filter((item) => !isFrvItem(item));
  }

  const indices = getRandomUniqueNumbers(pool, effectiveOptions, 4);
  const picks = indices.map((index) => pool[index]).filter(Boolean);

  targetStratContainer.innerHTML = "";
  picks.forEach((stratagem, position) => {
    if (rolledStrats[playerIndex * 4 + position] !== undefined) {
      rolledStrats[playerIndex * 4 + position] = stratagem.internalName;
    }
    targetStratContainer.innerHTML += stratCardHTML(
      stratagem,
      playerIndex,
      position,
    );
  });

  // Equipment, keeping boosters unique across the squad
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
  rollEquipmentForPlayer(equipContainers[playerIndex], playerIndex, usedBoosters);

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
      if (element) element.checked = options[category][id];
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

  updateToggleAllButton(); // Update the toggle button state after loading
  await filterItemsByWarbond();
  updatePerPlayerOptionsAvailability();
  updateRadioButtonsState();
};

// Utility functions
const rollProTip = () => {
  if (typeof PRO_TIPS !== "undefined" && PRO_TIPS?.length) {
    const randomTip = PRO_TIPS[Math.floor(Math.random() * PRO_TIPS.length)];
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
