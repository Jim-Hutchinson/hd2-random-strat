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
    slots.innerHTML = PLAYER_NAMES.map(
      (name, playerIndex) => `
      <div class="playerBlock pb-2">
        <h5 class="text-white text-center playerHeader my-2">${name}</h5>
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
    ).join("");
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
const handleToggleAllWarbonds = (e) => {
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
  filterItemsByWarbond();

  // Re-roll everything to reflect new warbond selection
  rollEquipment();
  rollStratagems();
  if (typeof rollArmor === "function") rollArmor();
};

// Handle warbond changes
const handleWarbondChange = (e) => {
  updateLocalStorage(e.target, "warbondOptions");

  if (e.target.checked) {
    checkedWarbonds.add(e.target.id);
  } else {
    checkedWarbonds.delete(e.target.id);
  }

  updateToggleAllButton(); // Update the toggle button state
  filterItemsByWarbond();
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

// Filter stratagem list based on radio options
const filterStratList = async () => {
  let filteredList = [...workingLists.strats];

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

// Squad mode: roll stratagems for the whole team with team-wide constraints
const rollTeamStratagems = (list, options) => {
  const total = TEAM_SIZE * 4; // 4 stratagem slots per player

  const supports = list.filter(isSupportItem);
  const backpacks = list.filter(isBackpackItem);

  // "Always" rules guarantee one of each across the whole team
  const requiredSupports = options.alwaysSupport ? TEAM_SIZE : 0;
  const requiredBackpacks = options.alwaysBackpack ? TEAM_SIZE : 0;

  const used = new Set();
  const picks = [];

  const takeFrom = (pool, amount) => {
    const available = shuffleArray(
      pool.filter((item) => !used.has(item.internalName)),
    );
    available.slice(0, amount).forEach((item) => {
      used.add(item.internalName);
      picks.push(item);
    });
  };

  // Backpack-carried support weapons (Autocannon, Recoilless, ...) carry both
  // tags, which would muddy the "one support"/"one backpack" counts. Prefer
  // single-tag items for the guaranteed picks whenever enough are available.
  const pureSupports = supports.filter((item) => !isBackpackItem(item));
  const pureBackpacks = backpacks.filter((item) => !isSupportItem(item));

  takeFrom(
    pureSupports.length >= requiredSupports ? pureSupports : supports,
    requiredSupports,
  );
  takeFrom(
    pureBackpacks.length >= requiredBackpacks ? pureBackpacks : backpacks,
    requiredBackpacks,
  );

  if (picks.length < requiredSupports + requiredBackpacks) {
    console.warn(
      "Squad randomizer: not enough support/backpack stratagems available to cover the whole team",
    );
  }

  // Caps for the remaining fills. "Always" rules take priority over "only one"
  // rules, and the team-wide "only one" rule beats the per-player one (it is
  // strictly stricter).
  const maxSupports = options.alwaysSupport
    ? Math.min(requiredSupports, supports.length)
    : options.oneSupport
      ? 1
      : options.oneSupportPerPlayer
        ? TEAM_SIZE
        : total;
  const maxBackpacks = options.alwaysBackpack
    ? Math.min(requiredBackpacks, backpacks.length)
    : options.oneBackpack
      ? 1
      : options.oneBackpackPerPlayer
        ? TEAM_SIZE
        : total;

  // Fill the remaining slots with random stratagems that respect the team-wide caps
  const baseCounts = {
    s: picks.filter(isSupportItem).length,
    b: picks.filter(isBackpackItem).length,
    e: picks.filter(isExosuitItem).length,
    f: picks.filter(isFrvItem).length,
  };
  const baseNames = new Set(picks.map((item) => item.internalName));

  // Try progressively looser rule sets so a tiny filtered pool can still fill
  // the squad. Support/backpack counts are relaxed last - the vehicle caps and
  // then uniqueness give way first.
  const fillTiers = [
    { unique: true, respectCaps: true, respectVehicleCaps: true },
    { unique: true, respectCaps: true, respectVehicleCaps: false },
    { unique: true, respectCaps: false, respectVehicleCaps: false },
    { unique: false, respectCaps: false, respectVehicleCaps: false },
  ];

  let filler = [];
  for (const tier of fillTiers) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const pool = tier.unique
        ? shuffleArray(list.filter((item) => !baseNames.has(item.internalName)))
        : shuffleArray(list);

      const local = [];
      let s = baseCounts.s;
      let b = baseCounts.b;
      let e = baseCounts.e;
      let f = baseCounts.f;

      for (const item of pool) {
        if (picks.length + local.length >= total) break;

        if (isSupportItem(item)) {
          if (tier.respectCaps && s >= maxSupports) continue;
          s++;
        }
        if (isBackpackItem(item)) {
          if (tier.respectCaps && b >= maxBackpacks) continue;
          b++;
        }
        if (isExosuitItem(item)) {
          if (tier.respectVehicleCaps && e >= 1) continue;
          e++;
        }
        if (isFrvItem(item)) {
          if (tier.respectVehicleCaps && f >= 1) continue;
          f++;
        }

        local.push(item);
      }

      // Last resort: top up with random repeats so nobody is left with an
      // empty slot when the filtered pool is smaller than the squad needs.
      let guard = 0;
      while (
        !tier.unique &&
        picks.length + local.length < total &&
        guard < 500
      ) {
        guard++;
        local.push(list[Math.floor(Math.random() * list.length)]);
      }

      if (picks.length + local.length >= total) {
        filler = local;
        break;
      }
    }
    if (filler.length) break;
  }

  if (!filler.length) {
    console.warn("Squad randomizer: could not fill all stratagem slots");
  }

  picks.push(...filler);

  // Deal the stratagems out: supports go out first so they spread across the
  // squad, and every item goes to an eligible player with the fewest picks so
  // each player always ends up with exactly four stratagems. When a
  // per-player "only one" rule is active, players who already have that
  // category are skipped while dealing.
  const perPlayer = [[], [], [], []];
  const playerSupports = [0, 0, 0, 0];
  const playerBackpacks = [0, 0, 0, 0];
  const perPlayerSupportCap = options.oneSupportPerPlayer ? 1 : TEAM_SIZE;
  const perPlayerBackpackCap = options.oneBackpackPerPlayer ? 1 : TEAM_SIZE;

  const placeItem = (item) => {
    // Rule eligibility first, then balance by fewest picks, so per-player
    // "only one" caps are respected without piling items onto one player.
    let candidates = perPlayer.map((_, index) => index);

    if (isSupportItem(item)) {
      const eligible = candidates.filter(
        (index) => playerSupports[index] < perPlayerSupportCap,
      );
      if (eligible.length) candidates = eligible;
    }
    if (isBackpackItem(item)) {
      const eligible = candidates.filter(
        (index) => playerBackpacks[index] < perPlayerBackpackCap,
      );
      if (eligible.length) candidates = eligible;
    }

    const minLength = Math.min(
      ...candidates.map((index) => perPlayer[index].length),
    );
    const shortest = candidates.filter(
      (index) => perPlayer[index].length === minLength,
    );
    const target = shortest[Math.floor(Math.random() * shortest.length)];
    perPlayer[target].push(item);
    if (isSupportItem(item)) playerSupports[target] += 1;
    if (isBackpackItem(item)) playerBackpacks[target] += 1;
  };

  [
    ...shuffleArray(picks.filter(isSupportItem)),
    ...shuffleArray(
      picks.filter((item) => isBackpackItem(item) && !isSupportItem(item)),
    ),
    ...shuffleArray(
      picks.filter((item) => !isSupportItem(item) && !isBackpackItem(item)),
    ),
  ].forEach(placeItem);

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
  const filteredList = await filterStratList();
  const containers = getStratContainers();

  let playerPicks;
  if (teamMode) {
    playerPicks = rollTeamStratagems(filteredList, options);
  } else {
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

// Roll equipment
const rollEquipment = () => {
  proTipCounter++;
  if (proTipCounter === 3) rollProTip();

  const equipmentCategories = ["prims", "seconds", "throws", "boosts"];
  const containers = getEquipmentContainers();
  // Boosters are unique across the team (matching the in-game rule)
  const usedBoosters = new Set();

  containers.forEach((container) => {
    container.innerHTML = "";

    equipmentCategories.forEach((category) => {
      let list = workingLists[category];

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
  const filteredList = await filterStratList();

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

  const listKey = categoryMap[category];
  const list = workingLists[listKey];
  if (!list?.length) return;

  const clickedCard = document.querySelector(
    `.card[data-internal-name="${internalName}"][data-category="${category}"]`,
  );
  if (!clickedCard) return;

  const playerContainer = clickedCard.closest(".equipmentContainer");

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
  updatePerPlayerOptionsAvailability();

  // Rebuild checkedWarbonds set
  checkedWarbonds.clear();
  Array.from(elements.warbondCheckboxes).forEach((cb) => {
    if (cb.checked) checkedWarbonds.add(cb.id);
  });

  updateToggleAllButton(); // Update the toggle button state after loading
  await filterItemsByWarbond();
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
