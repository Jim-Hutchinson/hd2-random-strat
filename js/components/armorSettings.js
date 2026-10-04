// DOM Elements
const armorElements = {
  passiveCheck: document.getElementById("armorPassiveCheck"),
  setCheck: document.getElementById("armorSetCheck"),
  sizeCheck: document.getElementById("armorSizeCheck"),
  container: document.getElementById("armorContainer"),
};

// NOTE: armor containers are queried dynamically (see getArmorContainerElements)
// so the DOM can be rebuilt when switching between solo and squad mode.

// Lists
let armorPassivesList = [...ARMOR_PASSIVES];
let armorSetsList = [...ARMOR_SETS];
let armorSizesList = [...ARMOR_SIZES];
let workingArmorPassivesList = [];
let workingArmorSetsList = [];

// Constants
const ARMOR_TYPES = {
  PASSIVE: "passive",
  SET: "set",
  SIZE: "size",
};

const ARMOR_SIZE_ICONS = {
  light: "bi-shield-minus",
  medium: "bi-shield",
  heavy: "bi-shield-plus",
};

// Get currently selected armor roll type with validation
const getSelectedArmorRollType = () => {
  const armorChecks = [
    {
      type: ARMOR_TYPES.PASSIVE,
      element: armorElements.passiveCheck,
      list: workingArmorPassivesList,
      validate: () => workingArmorPassivesList?.length > 0,
    },
    {
      type: ARMOR_TYPES.SET,
      element: armorElements.setCheck,
      list: workingArmorSetsList,
      validate: () => workingArmorSetsList?.length > 0,
    },
    {
      type: ARMOR_TYPES.SIZE,
      element: armorElements.sizeCheck,
      list: armorSizesList,
      validate: () => armorSizesList?.length > 0,
    },
  ];

  // Find active type
  for (const armorType of armorChecks) {
    if (armorType.element?.classList.contains("active")) {
      // Validate that the list exists and has items
      if (!armorType.validate()) {
        console.warn(`${armorType.type} armor list is empty or unavailable`);
        return null;
      }
      return armorType;
    }
  }

  // Default to passive if nothing is active but passive list exists
  if (workingArmorPassivesList?.length > 0) {
    console.log("No active armor type found, defaulting to passive");
    return armorChecks[0];
  }

  return null;
};

// Get all armor containers (one per player, in player order)
const getArmorContainerElements = () =>
  Array.from(document.querySelectorAll("#loadoutSlots .armorContainer")).sort(
    (a, b) =>
      (Number(a.dataset.player) || 0) - (Number(b.dataset.player) || 0),
  );

// A player's armor pool for the given roll type (respects per-player
// warbond exclusions in squad mode). Returns null when the type uses a
// global list (armor sizes) or when per-player pools are unavailable.
const getArmorListForPlayer = (playerIndex, armorType) => {
  if (typeof getPlayerWorkingLists !== "function") return null;
  const lists = getPlayerWorkingLists(playerIndex);
  if (!lists) return null;
  if (armorType === ARMOR_TYPES.SET) return lists.armorSets;
  if (armorType === ARMOR_TYPES.PASSIVE) return lists.armorPassives;
  return null; // armor sizes are not warbond-filtered
};

// Roll armor - main function (rolls one armor per player; pass a playerIndex
// to re-roll only that player)
const rollArmor = async (playerIndex = null) => {
  if (typeof proTipCounter !== "undefined") {
    proTipCounter += 1;
    if (proTipCounter === 3 && typeof rollProTip === "function") {
      rollProTip();
    }
  }

  const containers = getArmorContainerElements().filter(
    (container) =>
      playerIndex == null ||
      (Number(container.dataset.player) || 0) === playerIndex,
  );
  if (!containers.length) return;

  const activeArmorType = getSelectedArmorRollType();

  // Handle case where no valid armor type is available
  if (!activeArmorType || !activeArmorType.list?.length) {
    const message = `
      <div class="col-12 text-center text-white">
        <p>No armor options available with current filters</p>
      </div>
    `;
    containers.forEach((container) => {
      container.innerHTML = message;
    });
    return;
  }

  for (const container of containers) {
    // Per-player warbond exclusions may shrink this player's armor pool
    let list = activeArmorType.list;
    const idx = Number(container.dataset.player) || 0;
    const playerList = getArmorListForPlayer(idx, activeArmorType.type);
    if (playerList) list = playerList;

    // A locked armor slot stays put across warbond and pre-made kit filters.
    const lockKey = `armor:${idx}`;
    if (lockedSlots.has(lockKey)) {
      const sourceList =
        activeArmorType.type === ARMOR_TYPES.PASSIVE
          ? ARMOR_PASSIVES
          : activeArmorType.type === ARMOR_TYPES.SET
            ? ARMOR_SETS
            : ARMOR_SIZES;
      const stillExists = sourceList.some(
        (item) => item.internalName === lockedSlots.get(lockKey),
      );
      if (stillExists) continue;
      lockedSlots.delete(lockKey);
    }

    if (!list?.length) {
      container.innerHTML = `
        <div class="col-12 text-center text-white">
          <p>No armor options available with current filters</p>
        </div>
      `;
      continue;
    }

    // Roll random armor item
    const randomIndex = Math.floor(Math.random() * list.length);
    const rolledArmor = list[randomIndex];

    if (!rolledArmor) {
      console.error("Failed to roll armor - no item selected");
      continue;
    }

    // Generate armor image HTML
    const armorImage = await getArmorImageHTML(rolledArmor);

    // Update container
    container.innerHTML = `
      <div class="col-2 px-1 d-flex justify-content-center">
        <div class="card itemCards armorLogo"
          data-player="${idx}"
          data-internal-name="${rolledArmor.internalName}"
        >
          <button
            class="lockButton"
            type="button"
            title="Lock / unlock"
            onclick="event.stopPropagation(); window.toggleArmorLock(this)"
          >
            <i class="bi bi-unlock"></i>
          </button>
          ${armorImage}
        </div>
      </div>
      <div class="col-10 px-0 d-flex justify-content-start">
        <div class="card-body d-flex align-items-center">
          <p class="card-title text-white">${escapeHtml(rolledArmor.displayName)}</p>
        </div>
      </div>
    `;
  }

  if (typeof refreshLockIcons === "function") refreshLockIcons();
};

// Helper: Get armor image HTML
const getArmorImageHTML = async (armor) => {
  if (!armor) return "";

  // Check if it's an armor size (light/medium/heavy)
  if (armor.tags?.includes("ArmorSize")) {
    return await getArmorSizeIcon(armor.internalName);
  }

  // Regular armor or passive
  const armorPath = armor.tags?.includes("ArmorPassive")
    ? "armorpassives"
    : "armor";
  return `
    <img
      src="../images/${armorPath}/${armor.imageURL}"
      class="img-card-top"
      alt="${escapeHtml(armor.displayName)}"
      id="${armor.internalName}-randImage"
    />
  `;
};

// Reroll armor (individual item, scoped to the clicked player's container)
const rerollArmor = async (intName, category, sourceElement) => {
  const armorContainer = sourceElement?.closest(".armorContainer")
    ? sourceElement.closest(".armorContainer")
    : getArmorContainerElements()[0];
  const armorDiv = armorContainer.querySelector(".armorLogo");
  if (!armorDiv) return;

  const activeArmorType = getSelectedArmorRollType();
  if (!activeArmorType || !activeArmorType.list?.length) return;

  // Respect this player's warbond exclusions in squad mode
  const playerIndex = Number(armorContainer.dataset.player) || 0;
  if (lockedSlots.has(`armor:${playerIndex}`)) {
    return; // locked armor cannot be re-rolled individually
  }
  let armorList = activeArmorType.list;
  const playerList = getArmorListForPlayer(playerIndex, activeArmorType.type);
  if (playerList) armorList = playerList;
  if (!armorList?.length) return;

  let alternatives = armorList.filter((item) => item.internalName !== intName);
  if (!alternatives.length) return;
  const newArmor = alternatives[Math.floor(Math.random() * alternatives.length)];

  // Update the display
  const imageElement = armorDiv.querySelector(".img-card-top, .armorSizeLogo");

  // Replace only the visual, preserving the lock button and its handler.
  if (newArmor.tags?.includes("ArmorSize")) {
    const newIcon = await getArmorSizeIcon(newArmor.internalName);
    if (imageElement) {
      imageElement.outerHTML = newIcon;
    } else {
      armorDiv.insertAdjacentHTML("beforeend", newIcon);
    }
  } else {
    const img = document.createElement("img");
    const armorPath = newArmor.tags?.includes("ArmorPassive")
      ? "armorpassives"
      : "armor";
    img.src = `../images/${armorPath}/${newArmor.imageURL}`;
    img.className = "img-card-top";
    img.alt = newArmor.displayName;
    img.id = `${newArmor.internalName}-randImage`;

    if (imageElement?.tagName === "IMG") {
      imageElement.src = img.src;
      imageElement.alt = img.alt;
      imageElement.id = img.id;
    } else if (imageElement) {
      imageElement.outerHTML = img.outerHTML;
    } else {
      armorDiv.insertAdjacentHTML("beforeend", img.outerHTML);
    }
  }

  // Update the name text
  const nameElement = armorContainer.querySelector(".card-title");
  if (nameElement) {
    nameElement.textContent = newArmor.displayName;
  }

  // Keep the lock metadata in sync with the new armor
  armorDiv.dataset.internalName = newArmor.internalName;
  if (typeof window.markPremadeBuildModified === "function") {
    window.markPremadeBuildModified(playerIndex, "armor", newArmor.internalName);
  }
  if (typeof refreshLockIcons === "function") refreshLockIcons();
};

// Make rerollArmor available globally
window.rerollArmor = rerollArmor;

// Set armor roll type (called from UI buttons)
const setArmorRollType = (type) => {
  clearActiveArmorRollType();

  switch (type) {
    case ARMOR_TYPES.PASSIVE:
      armorElements.passiveCheck?.classList.add("active");
      break;
    case ARMOR_TYPES.SIZE:
      armorElements.sizeCheck?.classList.add("active");
      break;
    case ARMOR_TYPES.SET:
      armorElements.setCheck?.classList.add("active");
      break;
    default:
      console.warn(`Unknown armor type: ${type}`);
  }

  // Optionally re-roll armor when type changes
  if (typeof rollArmor === "function") {
    rollArmor();
  }
};

// Clear active armor roll type
const clearActiveArmorRollType = () => {
  const armorChecks = [
    armorElements.setCheck,
    armorElements.sizeCheck,
    armorElements.passiveCheck,
  ];

  for (const check of armorChecks) {
    if (check?.classList.contains("active")) {
      check.classList.remove("active");
      break; // Only remove one active class (there should only be one)
    }
  }
};

// Get armor size icon (Bootstrap Icons)
const getArmorSizeIcon = async (size) => {
  const iconClass =
    ARMOR_SIZE_ICONS[size?.toLowerCase()] || ARMOR_SIZE_ICONS.medium;
  return `<i class="armorSizeLogo p-1 d-flex justify-content-center bi ${iconClass}"></i>`;
};

// Update working lists based on warbond filters (call this from main file)
const updateArmorLists = (filteredPassives, filteredSets) => {
  workingArmorPassivesList = filteredPassives || [];
  workingArmorSetsList = filteredSets || [];
};

// Helper: Escape HTML to prevent XSS
const escapeHtml = (text) => {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

// Initialize armor event listeners
const initArmorEventListeners = () => {
  // Add click handlers for armor type buttons
  if (armorElements.passiveCheck) {
    armorElements.passiveCheck.addEventListener("click", () =>
      setArmorRollType(ARMOR_TYPES.PASSIVE),
    );
  }
  if (armorElements.setCheck) {
    armorElements.setCheck.addEventListener("click", () =>
      setArmorRollType(ARMOR_TYPES.SET),
    );
  }
  if (armorElements.sizeCheck) {
    armorElements.sizeCheck.addEventListener("click", () =>
      setArmorRollType(ARMOR_TYPES.SIZE),
    );
  }
};

// Export/Expose necessary functions if needed
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    rollArmor,
    rerollArmor,
    setArmorRollType,
    updateArmorLists,
    initArmorEventListeners,
  };
}

// Auto-initialize if this is a browser environment
if (typeof window !== "undefined") {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initArmorEventListeners);
  } else {
    initArmorEventListeners();
  }
}
