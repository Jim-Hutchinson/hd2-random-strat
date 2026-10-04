// Pre-made randomizer kits mirror the specialists from The Gauntlet.
// Gauntlet stores equipment as indexes into the shared constants arrays;
// convert those indexes to internal names for the randomizer's item pools.
const getGauntletInternalName = (items, index) =>
  items[index]?.internalName ?? null;

const PREMADE_LOADOUTS = GAUNTLETSPECIALISTS.map((specialist) => ({
  name: specialist.displayName,
  items: {
    prims: [getGauntletInternalName(PRIMARIES, specialist.primary)].filter(
      Boolean,
    ),
    seconds: [
      getGauntletInternalName(SECONDARIES, specialist.secondary),
    ].filter(Boolean),
    throws: [getGauntletInternalName(THROWABLES, specialist.throwable)].filter(
      Boolean,
    ),
    strats: specialist.stratagems
      .map((index) => getGauntletInternalName(STRATAGEMS, index))
      .filter(Boolean),
    armorPassives: [
      getGauntletInternalName(ARMOR_PASSIVES, specialist.armorPassive),
    ].filter(Boolean),
  },
}));
