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
// Locked slots: Map<"strat:p:pos" | "equip:p:category" | "armor:p", internalName>
const lockedSlots = new Map();
// Random pre-made loadout assignment for each player (null = fully random)
let premadeBuildsEnabled = false;
let premadeIndices = [null, null, null, null];
const modifiedPremadePlayers = new Set();

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
// separately; in solo mode everyone shares the global list. When enabled,
// each player is restricted to their randomly assigned pre-made kit.
const getPlayerWorkingLists = (playerIndex) => {
  const raw = {
    prims: [...PRIMARIES],
    seconds: [...SECONDARIES],
    throws: [...THROWABLES],
    boosts: [...BOOSTERS],
    strats: [...STRATAGEMS],
    armorPassives: [...ARMOR_PASSIVES],
    armorSets: [...ARMOR_SETS],
  };

  let lists;
  if (teamMode && playerWarbonds[playerIndex]) {
    const set = playerWarbonds[playerIndex];
    const byWarbond = (list) =>
      list.filter(
        (item) => set.has(item.warbondCode) || item.warbondCode === "none",
      );
    lists = {};
    Object.keys(raw).forEach((key) => {
      lists[key] = byWarbond(raw[key]);
    });
  } else {
    lists = Object.fromEntries(
      Object.entries(workingLists).map(([key, list]) => [key, [...list]]),
    );
  }

  // Pre-made loadout: keep only the kit's items. If that leaves a category
  // empty (its item is excluded by a warbond filter, say), the kit wins and
  // its item is used as-is.
  const assignedIndex = premadeIndices[teamMode ? playerIndex : 0];
  if (
    premadeBuildsEnabled &&
    assignedIndex != null &&
    PREMADE_LOADOUTS[assignedIndex]
  ) {
    const kitItems = PREMADE_LOADOUTS[assignedIndex].items || {};
    Object.keys(raw).forEach((key) => {
      const allowed = new Set(kitItems[key] || []);
      if (!allowed.size) return;
      const filtered = lists[key].filter((item) =>
        allowed.has(item.internalName),
      );
      lists[key] = filtered.length
        ? filtered
        : raw[key].filter((item) => allowed.has(item.internalName));
    });
  }

  return lists;
};

// --- Pre-made loadouts ------------------------------------------------------

const savePremadeOptions = () => {
  const randomizerOptions = JSON.parse(
    localStorage.getItem("randomizerOptions") || "{}",
  );
  randomizerOptions.premadeOptions = {
    enabled: premadeBuildsEnabled,
  };
  localStorage.setItem("randomizerOptions", JSON.stringify(randomizerOptions));
};

const updatePlayerBuildLabels = () => {
  document.querySelectorAll(".playerHeader").forEach((header) => {
    const label = header.querySelector(".playerBuildName");
    if (!label) return;

    const playerIndex = Number(header.dataset.player);
    const assignedIndex = premadeIndices[playerIndex];
    const build =
      premadeBuildsEnabled && assignedIndex != null
        ? PREMADE_LOADOUTS[assignedIndex]
        : null;
    const modified = modifiedPremadePlayers.has(playerIndex);
    label.textContent = build
      ? `Build: ${build.name}${modified ? " (modified)" : ""}`
      : "";
    label.classList.toggle("d-none", !build);
  });
};

const markPremadeBuildModified = (playerIndex, category, internalName) => {
  if (!premadeBuildsEnabled) return;
  const assignedIndex = premadeIndices[teamMode ? playerIndex : 0];
  if (assignedIndex == null) return;
  const build = PREMADE_LOADOUTS[assignedIndex];
  if (!build) return;

  const categoryMap = {
    primary: "prims",
    secondary: "seconds",
    throwable: "throws",
    strat: "strats",
    armor: "armorPassives",
  };
  const buildCategory = categoryMap[category];
  if (
    buildCategory &&
    build.items[buildCategory]?.length &&
    !build.items[buildCategory].includes(internalName)
  ) {
    modifiedPremadePlayers.add(playerIndex);
    updatePlayerBuildLabels();
  }
};

window.markPremadeBuildModified = markPremadeBuildModified;

const getPremadeBuildsCompatibleWithLocks = (playerIndex) => {
  const equipmentCategories = {
    primary: "prims",
    secondary: "seconds",
    throwable: "throws",
  };
  const armorUsesPassive =
    typeof getSelectedArmorRollType === "function" &&
    getSelectedArmorRollType()?.type === "passive";

  return PREMADE_LOADOUTS.map((build, index) => ({ build, index }))
    .filter(({ build }) => {
      for (const [key, internalName] of lockedSlots) {
        if (key.startsWith(`strat:${playerIndex}:`)) {
          if (!build.items.strats.includes(internalName)) return false;
          continue;
        }

        if (key.startsWith(`equip:${playerIndex}:`)) {
          const category = key.slice(`equip:${playerIndex}:`.length);
          const buildCategory = equipmentCategories[category];
          if (
            buildCategory &&
            !build.items[buildCategory]?.includes(internalName)
          ) {
            return false;
          }
          continue;
        }

        if (
          armorUsesPassive &&
          key === `armor:${playerIndex}` &&
          !build.items.armorPassives.includes(internalName)
        ) {
          return false;
        }
      }
      return true;
    })
    .map(({ index }) => index);
};

const choosePremadeAssignment = (
  playerIndex,
  alreadyAssigned = new Set(),
  previousIndex = premadeIndices[playerIndex],
) => {
  let candidates = getPremadeBuildsCompatibleWithLocks(playerIndex);
  if (!candidates.length) {
    candidates =
      previousIndex != null
        ? [previousIndex]
        : PREMADE_LOADOUTS.map((_, index) => index);
  }

  const unusedCandidates = candidates.filter(
    (index) => !alreadyAssigned.has(index),
  );
  const choices = unusedCandidates.length ? unusedCandidates : candidates;
  return choices[Math.floor(Math.random() * choices.length)];
};

const randomizePremadeAssignments = (
  playerIndices = null,
  refreshLabels = true,
) => {
  if (!premadeBuildsEnabled || !PREMADE_LOADOUTS.length) {
    premadeIndices = [null, null, null, null];
    modifiedPremadePlayers.clear();
    if (refreshLabels) updatePlayerBuildLabels();
    return;
  }

  const count = teamMode ? TEAM_SIZE : 1;
  if (playerIndices) {
    playerIndices.forEach((playerIndex) => {
      premadeIndices[playerIndex] = choosePremadeAssignment(playerIndex);
      modifiedPremadePlayers.delete(playerIndex);
    });
    if (refreshLabels) updatePlayerBuildLabels();
    return;
  }

  const previousIndices = [...premadeIndices];
  premadeIndices = [null, null, null, null];
  modifiedPremadePlayers.clear();
  const alreadyAssigned = new Set();
  for (const playerIndex of shuffleArray(
    Array.from({ length: count }, (_, index) => index),
  )) {
    const index = choosePremadeAssignment(
      playerIndex,
      alreadyAssigned,
      previousIndices[playerIndex],
    );
    premadeIndices[playerIndex] = index;
    alreadyAssigned.add(index);
  }
  if (refreshLabels) updatePlayerBuildLabels();
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
            data-player="${playerIndex}"
            onclick="rerollPlayer(${playerIndex})"
            title="Re-roll this player's loadout"
          >
            <span>
              ${name}
              <i class="bi bi-arrow-repeat ms-1"></i>
            </span>
            <span class="playerBuildName d-block small text-warning d-none"></span>
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
      randomizePremadeAssignments();
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

  // Toggle random pre-made builds (one independently assigned kit per player)
  const premadeToggle = document.getElementById("premadeBuildsCheck");
  if (premadeToggle) {
    premadeToggle.addEventListener("change", () => {
      premadeBuildsEnabled = premadeToggle.checked;
      randomizePremadeAssignments();
      savePremadeOptions();
      rollEquipment();
      rollStratagems();
      if (typeof rollArmor === "function") rollArmor();
    });
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
      const armorTarget = e.target.closest(
        ".armorLogo, .armorContainer .card-title",
      );
      if (armorTarget) {
        const armorContainer = armorTarget.closest(".armorContainer");
        const armorCard = armorTarget.classList.contains("armorLogo")
          ? armorTarget
          : armorContainer?.querySelector(".armorLogo");
        if (armorCard) {
          window.rerollArmor(
            armorCard.dataset.internalName,
            "armor",
            armorCard,
          );
        }
        return;
      }
      const card = e.target.closest(".itemCards");
      if (!card || !card.dataset.category) return;
      rerollItem(card);
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
  if (!list?.length || amt <= 0) return [];

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
    // Last resort: allow repeats, and fall back to the full list if a
    // player's filters leave them with no available stratagems.
    result = pools.map((pool) => {
      const picks = [];
      const fallbackPool = pool.length ? pool : STRATAGEMS;
      for (let i = 0; i < 4 && fallbackPool.length; i++) {
        picks.push(
          fallbackPool[Math.floor(Math.random() * fallbackPool.length)],
        );
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
          chosenList[Math.floor(Math.random() * chosenList.length)],
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

const getAssignedPremadeStratagems = (playerIndex) => {
  const assignedIndex = premadeIndices[teamMode ? playerIndex : 0];
  const names = premadeBuildsEnabled && assignedIndex != null
    ? PREMADE_LOADOUTS[assignedIndex]?.items?.strats || []
    : [];
  return names
    .map((name) => STRATAGEMS.find((item) => item.internalName === name))
    .filter(Boolean);
};

// Complete a player's row if constraints or an empty filtered pool prevented
// the normal picker from returning four items. With a pre-made kit enabled,
// only use items listed in that kit; repeat a kit item as the last resort.
const completeStratagemRow = (
  row,
  playerPool,
  fallbackPool,
  buildPool = [],
) => {
  const usedNames = new Set(
    row.filter(Boolean).map((item) => item.internalName),
  );
  const candidatePools = buildPool.length
    ? [playerPool, buildPool]
    : [playerPool, fallbackPool, STRATAGEMS];

  candidatePools.forEach((pool) => {
    for (const item of shuffleArray(pool || [])) {
      if (row.filter(Boolean).length === 4) break;
      if (usedNames.has(item.internalName)) continue;
      row[row.findIndex((slot) => !slot)] = item;
      usedNames.add(item.internalName);
    }
  });

  const repeatPool = playerPool?.length
    ? playerPool
    : buildPool.length
      ? buildPool
      : fallbackPool?.length
        ? fallbackPool
        : STRATAGEMS;
  while (row.filter(Boolean).length < 4 && repeatPool.length) {
    row[row.findIndex((slot) => !slot)] =
      repeatPool[Math.floor(Math.random() * repeatPool.length)];
  }

  return row;
};

// Roll stratagems
const rollStratagems = async () => {
  proTipCounter++;
  if (proTipCounter === 3) rollProTip();

  const options = getSupplyOptions();
  const containers = getStratContainers();

  // Per player: a length-4 array with one item (or undefined) per slot, so
  // locked slots keep their position.
  const slots = [];
  const fallbackPool = await filterStratList();

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
      const buildPool = getAssignedPremadeStratagems(playerIndex);
      const buildNames = buildPool.length
        ? new Set(buildPool.map((item) => item.internalName))
        : null;
      const lockedNames = new Set(
        locked.filter(Boolean).map((item) => item.internalName),
      );
      const newPicks = (playerPicks[playerIndex] || []).filter(
        (item) =>
          !lockedNames.has(item.internalName) &&
          (!buildNames || buildNames.has(item.internalName)),
      );
      const row = new Array(4);
      let next = 0;
      for (let position = 0; position < 4; position++) {
        row[position] = locked[position] ?? newPicks[next++];
      }
      slots.push(
        completeStratagemRow(
          row,
          pools[playerIndex],
          fallbackPool,
          buildPool,
        ),
      );
    });
  } else {
    const filteredList = await filterStratListForPlayer(0);
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
      slots.push(
        completeStratagemRow(
          row,
          filteredList,
          fallbackPool,
          getAssignedPremadeStratagems(playerIndex),
        ),
      );
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
const rollEquipmentForPlayer = (container, playerIndex, usedBoosters) => {
  const equipmentCategories = ["prims", "seconds", "throws", "boosts"];
  const lockCategories = {
    prims: "primary",
    seconds: "secondary",
    throws: "throwable",
    boosts: "booster",
  };
  const sourceLists = {
    prims: PRIMARIES,
    seconds: SECONDARIES,
    throws: THROWABLES,
    boosts: BOOSTERS,
  };
  const lists = getPlayerWorkingLists(playerIndex);
  container.innerHTML = "";

  equipmentCategories.forEach((category) => {
    let list = lists[category];

    // Locks take priority over warbond and pre-made kit filters.
    const lockKey = `equip:${playerIndex}:${lockCategories[category]}`;
    if (lockedSlots.has(lockKey)) {
      const lockedItem = sourceLists[category].find(
        (item) => item.internalName === lockedSlots.get(lockKey),
      );
      if (lockedItem) {
        container.innerHTML += equipmentCardHTML(lockedItem);
        if (category === "boosts") usedBoosters.add(lockedItem.internalName);
        return;
      }
      lockedSlots.delete(lockKey);
    }

    if (!list?.length) {
      container.innerHTML += `<div class="col-3 d-flex justify-content-center"><div class="card itemCards"></div></div>`;
      return;
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
  const containers = getEquipmentContainers();
  // Reserve all currently valid locked boosters before rolling unlocked ones,
  // so a random pick for an earlier player cannot duplicate a later lock.
  containers.forEach((_, playerIndex) => {
    const lockedName = lockedSlots.get(`equip:${playerIndex}:booster`);
    if (
      lockedName &&
      BOOSTERS.some(
        (item) => item.internalName === lockedName,
      )
    ) {
      usedBoosters.add(lockedName);
    }
  });
  containers.forEach((container, playerIndex) => {
    rollEquipmentForPlayer(container, playerIndex, usedBoosters);
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

// Locked stratagem slots remain authoritative even if filters or a pre-made
// kit change the current pool. Returns a length-4 array per player.
const collectLockedStrats = (playerIndex, pool) => {
  const slots = new Array(4);
  for (let position = 0; position < 4; position++) {
    const key = `strat:${playerIndex}:${position}`;
    if (!lockedSlots.has(key)) continue;
    const item = STRATAGEMS.find(
      (s) => s.internalName === lockedSlots.get(key),
    );
    if (item) {
      slots[position] = item;
    } else if (!pool.some((s) => s.internalName === lockedSlots.get(key))) {
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


window.refreshLockIcons = refreshLockIcons;
window.toggleArmorLock = toggleArmorLock;

// Reroll a single stratagem card (team-aware)
const rerollStratItem = async (clickedCard) => {
  const options = getSupplyOptions();

  // Collect every stratagem card, player by player, in roll order
  const allStratCards = getStratContainers().flatMap((container) =>
    Array.from(container.querySelectorAll(".card.itemCards")),
  );

  if (!clickedCard || !allStratCards.includes(clickedCard)) return;

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

  const getAvailableItems = (pool) => {
    let candidates = pool.filter(
      (item) => !otherItemNames.has(item.internalName),
    );

    // Apply support limits before considering the clicked slot.
    if (options.alwaysSupport && remainingSupports < requiredMinimum) {
      candidates = candidates.filter(isSupportItem);
    } else if (options.oneSupport && remainingSupports >= 1) {
      candidates = candidates.filter((item) => !isSupportItem(item));
    } else if (
      teamMode &&
      options.oneSupportPerPlayer &&
      playerRemainingSupports >= 1
    ) {
      candidates = candidates.filter((item) => !isSupportItem(item));
    }

    // Apply backpack limits before considering the clicked slot.
    if (options.alwaysBackpack && remainingBackpacks < requiredMinimum) {
      candidates = candidates.filter(isBackpackItem);
    } else if (options.oneBackpack && remainingBackpacks >= 1) {
      candidates = candidates.filter((item) => !isBackpackItem(item));
    } else if (
      teamMode &&
      options.oneBackpackPerPlayer &&
      playerRemainingBackpacks >= 1
    ) {
      candidates = candidates.filter((item) => !isBackpackItem(item));
    }

    if (remainingExosuits >= 1) {
      candidates = candidates.filter((item) => !isExosuitItem(item));
    }
    if (remainingFRVs >= 1) {
      candidates = candidates.filter((item) => !isFrvItem(item));
    }

    return candidates.filter(
      (item) => item.internalName !== currentItem.internalName,
    );
  };

  let availableItems = getAvailableItems(filteredList);

  if (availableItems.length === 0) {
    console.warn("No valid stratagems available for reroll");
    return;
  }

  const randomIndex = Math.floor(Math.random() * availableItems.length);
  const newItem = availableItems[randomIndex];

  updateCardWithItem(clickedCard, newItem, "../images/stratagems/");
  markPremadeBuildModified(playerIndex, "strat", newItem.internalName);

  if (rolledStrats[currentPosition] !== undefined) {
    rolledStrats[currentPosition] = newItem.internalName;
  }
};

// Reroll a single equipment card (team-aware for boosters)
const rerollEquipmentItem = (clickedCard) => {
  if (!clickedCard?.dataset?.category) return;
  const category = clickedCard.dataset.category;
  const internalName = clickedCard.dataset.internalName;
  const categoryMap = {
    primary: "prims",
    secondary: "seconds",
    throwable: "throws",
    booster: "boosts",
  };

  const playerContainer = clickedCard.closest(".equipmentContainer");
  if (!playerContainer) return;

  const playerIndex = Number(playerContainer.dataset.player) || 0;
  if (lockedSlots.has(`equip:${playerIndex}:${category}`)) {
    return; // locked slots cannot be re-rolled individually
  }
  const listKey = categoryMap[category];
  if (!listKey) return;
  const list = getPlayerWorkingLists(playerIndex)[listKey] || [];

  const otherCards = Array.from(
    playerContainer.querySelectorAll(".card.itemCards"),
  ).filter((card) => card !== clickedCard);
  const otherInternalNames = new Set(
    otherCards.map((card) => card.dataset.internalName),
  );

  const getAvailableItems = (source) =>
    source.filter(
      (item) =>
        item.internalName !== internalName &&
        !otherInternalNames.has(item.internalName),
    );

  let availableItems = getAvailableItems(list);

  // Boosters are unique across the whole squad when another unique choice exists.
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
    if (uniqueOptions.length) availableItems = uniqueOptions;
  }

  if (!availableItems.length) return;

  const newItem =
    availableItems[Math.floor(Math.random() * availableItems.length)];
  updateCardWithItem(clickedCard, newItem, "../images/equipment/");
  markPremadeBuildModified(playerIndex, category, newItem.internalName);
};

// Reroll individual item
const rerollItem = async (card) => {
  if (card?.dataset?.category === "strat") {
    await rerollStratItem(card);
  } else {
    rerollEquipmentItem(card);
  }
};

// Make rerollItem available globally
window.rerollItem = rerollItem;

// Re-roll one player's whole loadout (squad mode). The other players keep
// their rolls, and all team-wide rules still hold.
const rerollPlayer = async (playerIndex) => {
  if (!teamMode) return;
  randomizePremadeAssignments([playerIndex], false);
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


  const row = new Array(4);
  let next = 0;
  for (let position = 0; position < 4; position++) {
    row[position] = locked[position] ?? picks[next++];
  }
  completeStratagemRow(
    row,
    fullPool,
    await filterStratList(),
    getAssignedPremadeStratagems(playerIndex),
  );

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


  rollEquipmentForPlayer(equipContainers[playerIndex], playerIndex, usedBoosters);
  refreshLockIcons();

  if (typeof rollArmor === "function") await rollArmor(playerIndex);
  updatePlayerBuildLabels();
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

  checkedWarbonds.clear();
  Array.from(elements.warbondCheckboxes).forEach((cb) => {
    if (cb.checked) checkedWarbonds.add(cb.id);
  });

  // Per-player warbond selections (defaults to the global selection)
  loadSquadWarbondOptions(options);


  // Load the random pre-made builds toggle. Preserve the former picker setting
  // as enabled when reading older localStorage data.
  const storedPremadeOptions = options.premadeOptions || {};
  premadeBuildsEnabled =
    typeof storedPremadeOptions.enabled === "boolean"
      ? storedPremadeOptions.enabled
      : storedPremadeOptions.premadeSelect != null &&
        storedPremadeOptions.premadeSelect !== "";
  const premadeToggle = document.getElementById("premadeBuildsCheck");
  if (premadeToggle) premadeToggle.checked = premadeBuildsEnabled;

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
  buildLoadoutDOM();
  randomizePremadeAssignments();
  updateToggleAllButton(); // Ensure toggle button reflects current state
  rollEquipment();
  await rollStratagems();
  if (typeof rollArmor === "function") rollArmor();
  rollProTip();
};

// Initialize
initEventListeners();
randomizeAll();
