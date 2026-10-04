// Pre-made loadout kits (generated from specOpsSpecs.md - the Special Ops
// specialist kits). Each kit lists internalNames per category. When a kit is
// selected in the randomizer options, every category rolls from the kit's
// items: kits with more options than fit in one loadout are picked randomly
// following the other rules, and a kit that violates a rule is kept as-is.
const PREMADE_LOADOUTS = [
  {
    name: "The Arsonist",
    items: {
      prims: [
      "sg451cookout",
      ],
      seconds: [
      "p72crisper",
      ],
      throws: [
      "g10incendiarygrenade",
      ],
      strats: [
      "flam40flamethrower",
      "axflam75hotdog",
      "eaglenapalmairstrike",
      "orbitalnapalmbarrage",
      "aflam40flamesentry",
      ],
      armorPassives: [
      "inflammable",
      ],
    },
  },
  {
    name: "The Asphyxiator",
    items: {
      prims: [
      "sg225iebreakerincendiary",
      ],
      seconds: [
      "gp31grenadepistol",
      ],
      throws: [
      "g4gasgrenade",
      ],
      strats: [
      "tx41sterilizer",
      "orbitalgasstrike",
      "md8gasmines",
      "axtx13dogbreath",
      "s11speargun",
      ],
      armorPassives: [
      "advancedfiltration",
      ],
    },
  },
  {
    name: "The O.G.",
    items: {
      prims: [
      "ar23liberator",
      ],
      seconds: [
      "p2peacemaker",
      ],
      throws: [
      "g12highexplosivegrenade",
      ],
      strats: [
      "mg43machinegun",
      "orbitalprecisionstrike",
      "amg43machinegunsentry",
      "eagleairstrike",
      ],
      armorPassives: [
      "extrapadding",
      ],
    },
  },
  {
    name: "The Engineer",
    items: {
      prims: [
      "smg37defender",
      ],
      seconds: [
      "p92warrant",
      ],
      throws: [
      "g50seeker",
      ],
      strats: [
      "amls4xrocketsentry",
      "ms11solosilo",
      "fx12shieldgeneratorrelay",
      "am12mortarsentry",
      ],
      armorPassives: [
      "engineeringkit",
      ],
    },
  },
  {
    name: "Eagle-1's Favorite",
    items: {
      prims: [
      "r2amendment",
      ],
      seconds: [
      "las58talon",
      ],
      throws: [
      "g6fraggrenade",
      ],
      strats: [
      "eagle500kgbomb",
      "eagleairstrike",
      "eaglestrafingrun",
      "eagleclusterbomb",
      ],
      armorPassives: [
      "servoassisted",
      ],
    },
  },
  {
    name: "Former Bridge Officer",
    items: {
      prims: [
      "ar61tenderizer",
      ],
      seconds: [
      "cqc2saber",
      ],
      throws: [
      "g6fraggrenade",
      ],
      strats: [
      "orbitalairburststrike",
      "orbitalprecisionstrike",
      "orbital120mmhebarrage",
      "orbital380mmhebarrage",
      ],
      armorPassives: [
      "reinforcedepaulettes",
      ],
    },
  },
  {
    name: "The Tankbuster",
    items: {
      prims: [
      "r36eruptor",
      ],
      seconds: [
      "gp20ultimatum",
      ],
      throws: [
      "g123thermitegrenade",
      ],
      strats: [
      "faf14spear",
      "eagle110mmrocketpods",
      "orbitalrailcannonstrike",
      "md17antitankmines",
      ],
      armorPassives: [
      "fortified",
      ],
    },
  },
  {
    name: "The Stunner",
    items: {
      prims: [
      "sg20halt",
      ],
      seconds: [
      "p19redeemer",
      ],
      throws: [
      "g23stungrenade",
      ],
      strats: [
      "gl52deescalator",
      "orbitalemsstrike",
      "am23emsmortarsentry",
      "axarc3k9",
      ],
      armorPassives: [
      "ballisticpadding",
      ],
    },
  },
  {
    name: "The Detonator",
    items: {
      prims: [
      "cb9explodingcrossbow",
      ],
      seconds: [
      "p2peacemaker",
      ],
      throws: [
      "g7pineapple",
      ],
      strats: [
      "gl21grenadelauncher",
      "eagleclusterbomb",
      "b100portablehellbomb",
      "md6antipersonnelminefield",
      "bmdc4pack",
      ],
      armorPassives: [
      "integratedexplosives",
      ],
    },
  },
  {
    name: "The Ghost",
    items: {
      prims: [
      "r63diligence",
      ],
      seconds: [
      "las58talon",
      ],
      throws: [
      "k2throwingknife",
      ],
      strats: [
      "orbitalsmokestrike",
      "eaglesmokestrike",
      "apw1antimaterielrifle",
      "lift860hoverpack",
      ],
      armorPassives: [
      "scout",
      ],
    },
  },
  {
    name: "The Most Democratic",
    items: {
      prims: [
      "r2124constitution",
      ],
      seconds: [
      "p4senator",
      ],
      throws: [
      "g12highexplosivegrenade",
      ],
      strats: [
      "b100portablehellbomb",
      "cqc1onetrueflag",
      "orbital380mmhebarrage",
      "eagle500kgbomb",
      ],
      armorPassives: [
      "democracyprotects",
      ],
    },
  },
  {
    name: "The Wallbouncer",
    items: {
      prims: [
      "sg8sslugger",
      ],
      seconds: [
      "p4senator",
      ],
      throws: [
      "g12highexplosivegrenade",
      ],
      strats: [
      "eat17expendableantitank",
      "mls4xcommando",
      "eaglestrafingrun",
      "lift850jumppack",
      ],
      armorPassives: [
      "extrapadding",
      ],
    },
  },
  {
    name: "Dark Render",
    items: {
      prims: [
      "r6deadeye",
      ],
      seconds: [
      "p4senator",
      ],
      throws: [
      "g4gasgrenade",
      ],
      strats: [
      "aac8autocannonsentry",
      "gr8recoillessrifle",
      "orbitalwalkingbarrage",
      "eaglestrafingrun",
      ],
      armorPassives: [
      "servoassisted",
      ],
    },
  },
  {
    name: "Tyler Johnson the GOAT",
    items: {
      prims: [
      "ar23pliberatorpenetrator",
      ],
      seconds: [
      "gp31grenadepistol",
      ],
      throws: [
      "g123thermitegrenade",
      ],
      strats: [
      "eagleairstrike",
      "orbital120mmhebarrage",
      "aac8autocannonsentry",
      "mg43machinegun",
      ],
      armorPassives: [
      "extrapadding",
      ],
    },
  },
  {
    name: "The Paramedic",
    items: {
      prims: [
      "ar23cliberatorconcussive",
      ],
      seconds: [
      "p11stimpistol",
      ],
      throws: [
      "gsh39shield",
      ],
      strats: [
      "eaglesmokestrike",
      "fx12shieldgeneratorrelay",
      "b1supplypack",
      "m102gunnerfrv",
      ],
      armorPassives: [
      "medkit",
      ],
    },
  },
  {
    name: "The Viper Commando",
    items: {
      prims: [
      "ar23aliberatorcarbine",
      ],
      seconds: [
      "sg22bushwhacker",
      ],
      throws: [
      "k2throwingknife",
      ],
      strats: [
      "mls4xcommando",
      "orbitallaser",
      "md6antipersonnelminefield",
      "exo45patriotexosuit",
      ],
      armorPassives: [
      "peakphysique",
      ],
    },
  },
  {
    name: "The Peace Officer",
    items: {
      prims: [
      "ar32pacifier",
      ],
      seconds: [
      "cqc19stunlance",
      ],
      throws: [
      "g4gasgrenade",
      ],
      strats: [
      "sh20ballisticshieldbackpack",
      "gl52deescalator",
      "egl21grenadierbattlement",
      "m102gunnerfrv",
      ],
      armorPassives: [
      "ballisticpadding",
      ],
    },
  },
  {
    name: "Child of Helghan",
    items: {
      prims: [
      "sta52assaultrifle",
      ],
      seconds: [
      "p113verdict",
      ],
      throws: [
      "g12highexplosivegrenade",
      ],
      strats: [
      "stax3wasplauncher",
      "orbitalnapalmbarrage",
      "md8gasmines",
      "aarc3teslatower",
      ],
      armorPassives: [
      "acclimated",
      ],
    },
  },
  {
    name: "The Overwatch",
    items: {
      prims: [
      "ar23pliberatorpenetrator",
      ],
      seconds: [
      "gp31grenadepistol",
      ],
      throws: [
      "g123thermitegrenade",
      ],
      strats: [
      "b1supplypack",
      "mg206heavymachinegun",
      "eat12antitankemplacement",
      "eagle500kgbomb",
      ],
      armorPassives: [
      "engineeringkit",
      ],
    },
  },
  {
    name: "The Heavy Gunner",
    items: {
      prims: [
      "br14adjudicator",
      ],
      seconds: [
      "p113verdict",
      ],
      throws: [
      "g6fraggrenade",
      ],
      strats: [
      "mg206heavymachinegun",
      "emg101hmgemplacement",
      "orbitalgatlingbarrage",
      "axar23guarddog",
      ],
      armorPassives: [
      "siegeready",
      ],
    },
  },
  {
    name: "The Autocannoneer",
    items: {
      prims: [
      "jar5dominator",
      ],
      seconds: [
      "p2peacemaker",
      ],
      throws: [
      "g13incendiaryimpact",
      ],
      strats: [
      "ac8autocannon",
      "aac8autocannonsentry",
      "exo49emancipatorexosuit",
      "orbital120mmhebarrage",
      ],
      armorPassives: [
      "fortified",
      ],
    },
  },
  {
    name: "The Lightshow",
    items: {
      prims: [
      "las5scythe",
      ],
      seconds: [
      "las7dagger",
      ],
      throws: [
      "g142pyrotech",
      ],
      strats: [
      "las98lasercannon",
      "orbitallaser",
      "axlas5rover",
      "alas98lasersentry",
      ],
      armorPassives: [
      "unflinching",
      ],
    },
  },
  {
    name: "The Stormcaller",
    items: {
      prims: [
      "arc12blitzer",
      ],
      seconds: [
      "p2peacemaker",
      ],
      throws: [
      "g31arc",
      ],
      strats: [
      "arc3arcthrower",
      "axarc3k9",
      "aarc3teslatower",
      "orbitalemsstrike",
      ],
      armorPassives: [
      "electricalconduit",
      ],
    },
  },
  {
    name: "The Bullet Whisperer",
    items: {
      prims: [
      "variable",
      ],
      seconds: [
      "p113verdict",
      ],
      throws: [
      "g6fraggrenade",
      ],
      strats: [
      "m105stalwart",
      "orbitalgatlingbarrage",
      "ag16gatlingsentry",
      "amg43machinegunsentry",
      ],
      armorPassives: [
      "siegeready",
      ],
    },
  },
  {
    name: "The Mad Scientist",
    items: {
      prims: [
      "sg8ppunisherplasma",
      ],
      seconds: [
      "plas15loyalist",
      ],
      throws: [
      "g31arc",
      ],
      strats: [
      "plas45epoch",
      "lift182warppack",
      "orbitallaser",
      "aarc3teslatower",
      ],
      armorPassives: [
      "adrenodefibrillator",
      ],
    },
  },
  {
    name: "The Problem Child",
    items: {
      prims: [
      "arc12blitzer",
      ],
      seconds: [
      "gp20ultimatum",
      ],
      throws: [
      "g31arc",
      ],
      strats: [
      "rl77airburstrocketlauncher",
      "orbitalnapalmbarrage",
      "am12mortarsentry",
      "md14incendiarymines",
      ],
      armorPassives: [
      "integratedexplosives",
      ],
    },
  },
  {
    name: "The Lone Penant",
    items: {
      prims: [
      "r2124constitution",
      ],
      seconds: [
      "cqc5combathatchet",
      ],
      throws: [
      "k2throwingknife",
      ],
      strats: [
      "cqc1onetrueflag",
      "orbitalemsstrike",
      "orbitalsmokestrike",
      "eaglesmokestrike",
      ],
      armorPassives: [
      "integratedexplosives",
      ],
    },
  },
  {
    name: "The Wall",
    items: {
      prims: [
      "smg72pummeler",
      ],
      seconds: [
      "plas15loyalist",
      ],
      throws: [
      "g109urchin",
      ],
      strats: [
      "emg101hmgemplacement",
      "eat12antitankemplacement",
      "egl21grenadierbattlement",
      "sh51directionalshield",
      ],
      armorPassives: [
      "extrapadding",
      ],
    },
  },
  {
    name: "The Masochist",
    items: {
      prims: [
      "las17doubleedgesickle",
      ],
      seconds: [
      "p72crisper",
      ],
      throws: [
      "g13incendiaryimpact",
      ],
      strats: [
      "rs422railgun",
      "lift182warppack",
      "md14incendiarymines",
      "orbitalairburststrike",
      ],
      armorPassives: [
      "adrenodefibrillator",
      ],
    },
  },
  {
    name: "The Preacher",
    items: {
      prims: [
      "r6deadeye",
      ],
      seconds: [
      "p4senator",
      ],
      throws: [
      "g109urchin",
      ],
      strats: [
      "eaglesmokestrike",
      "eagleairstrike",
      "lift860hoverpack",
      "flam40flamethrower",
      ],
      armorPassives: [
      "gunslinger",
      ],
    },
  },
  {
    name: "The Shotgun Surgeon",
    items: {
      prims: [
      "sg8punisher",
      ],
      seconds: [
      "sg22bushwhacker",
      ],
      throws: [
      "g6fraggrenade",
      ],
      strats: [
      "orbitalairburststrike",
      "eagle110mmrocketpods",
      "lift850jumppack",
      "orbitalwalkingbarrage",
      ],
      armorPassives: [
      "unflinching",
      ],
    },
  },
  {
    name: "The Helghast Sniper",
    items: {
      prims: [
      "plas39acceleratorrifle",
      ],
      seconds: [
      "p19redeemer",
      ],
      throws: [
      "g3smokegrenade",
      ],
      strats: [
      "orbitalgasstrike",
      "orbitalsmokestrike",
      "ms11solosilo",
      "am23emsmortarsentry",
      ],
      armorPassives: [
      "acclimated",
      ],
    },
  },
  {
    name: "The Supplier",
    items: {
      prims: [
      "las16sickle",
      ],
      seconds: [
      "p11stimpistol",
      ],
      throws: [
      "g142pyrotech",
      ],
      strats: [
      "b1supplypack",
      "eat17expendableantitank",
      "eat700expendablenapalm",
      "arc3arcthrower",
      ],
      armorPassives: [
      "medkit",
      ],
    },
  },
  {
    name: "Selenestica",
    items: {
      prims: [
      "r36eruptor",
      ],
      seconds: [
      "sg22bushwhacker",
      ],
      throws: [
      "g23stungrenade",
      ],
      strats: [
      "mg43machinegun",
      "m102gunnerfrv",
      "orbitalwalkingbarrage",
      "orbitalgasstrike",
      ],
      armorPassives: [
      "peakphysique",
      ],
    },
  },
  {
    name: "Septimus",
    items: {
      prims: [
      "las5scythe",
      ],
      seconds: [
      "gp20ultimatum",
      ],
      throws: [
      "g6fraggrenade",
      ],
      strats: [
      "lift850jumppack",
      "las99quasarcannon",
      "orbital120mmhebarrage",
      "ag16gatlingsentry",
      ],
      armorPassives: [
      "democracyprotects",
      ],
    },
  },
  {
    name: "The Sapper",
    items: {
      prims: [
      "smg32reprimand",
      ],
      seconds: [
      "las7dagger",
      ],
      throws: [
      "g50seeker",
      ],
      strats: [
      "md6antipersonnelminefield",
      "md8gasmines",
      "md14incendiarymines",
      "md17antitankmines",
      ],
      armorPassives: [
      "engineeringkit",
      ],
    },
  },
  {
    name: "The Psychopath",
    items: {
      prims: [
      "flam66torcher",
      ],
      seconds: [
      "cqc19stunlance",
      ],
      throws: [
      "g4gasgrenade",
      ],
      strats: [
      "axtx13dogbreath",
      "eaglesmokestrike",
      "orbitalsmokestrike",
      "orbitalemsstrike",
      ],
      armorPassives: [
      "peakphysique",
      ],
    },
  },
  {
    name: "The Courier",
    items: {
      prims: [
      "mp98knight",
      ],
      seconds: [
      "p4senator",
      ],
      throws: [
      "ted63throwabledynamite",
      ],
      strats: [
      "eaglenapalmairstrike",
      "eaglestrafingrun",
      "lift850jumppack",
      "m102gunnerfrv",
      ],
      armorPassives: [
      "gunslinger",
      ],
    },
  },
  {
    name: "The Helljumper",
    items: {
      prims: [
      "ma5c",
      ],
      seconds: [
      "m6csocompistol",
      ],
      throws: [
      "g6fraggrenade",
      ],
      strats: [
      "orbitalrailcannonstrike",
      "m102gunnerfrv",
      "las99quasarcannon",
      "sh32shieldgeneratorpack",
      ],
      armorPassives: [
      "feetfirst",
      ],
    },
  },
  {
    name: "The Recon Operative",
    items: {
      prims: [
      "m7s",
      ],
      seconds: [
      "m6csocompistol",
      ],
      throws: [
      "g3smokegrenade",
      ],
      strats: [
      "eagleairstrike",
      "exo45patriotexosuit",
      "lift850jumppack",
      "apw1antimaterielrifle",
      ],
      armorPassives: [
      "feetfirst",
      ],
    },
  },
  {
    name: "The Raider",
    items: {
      prims: [
      "ar2coyote",
      ],
      seconds: [
      "cqc42machete",
      ],
      throws: [
      "g7pineapple",
      ],
      strats: [
      "s11speargun",
      "eaglestrafingrun",
      "orbitalrailcannonstrike",
      "aflam40flamesentry",
      ],
      armorPassives: [
      "desertstormer",
      ],
    },
  },
  {
    name: "The Sardaukar",
    items: {
      prims: [
      "las5scythe",
      ],
      seconds: [
      "cqc2saber",
      ],
      throws: [
      "g23stungrenade",
      ],
      strats: [
      "sh32shieldgeneratorpack",
      "eat17expendableantitank",
      "eagleclusterbomb",
      "eagle110mmrocketpods",
      ],
      armorPassives: [
      "desertstormer",
      ],
    },
  },
  {
    name: "The Expendable",
    items: {
      prims: [
      "sg225breaker",
      ],
      seconds: [
      "las58talon",
      ],
      throws: [
      "g10incendiarygrenade",
      ],
      strats: [
      "eat17expendableantitank",
      "eat700expendablenapalm",
      "mls4xcommando",
      "b100portablehellbomb",
      "ms11solosilo",
      "leveller",
      ],
      armorPassives: [
      "integratedexplosives",
      ],
    },
  },
  {
    name: "The Python Commando",
    items: {
      prims: [
      "onetwo",
      ],
      seconds: [
      "cqc42machete",
      ],
      throws: [
      "g12highexplosivegrenade",
      ],
      strats: [
      "m1000maxigun",
      "orbitallaser",
      "ag16gatlingsentry",
      "eaglenapalmairstrike",
      ],
      armorPassives: [
      "rocksolid",
      ],
    },
  },
  {
    name: "The Intercessor",
    items: {
      prims: [
      "sta11smg",
      ],
      seconds: [
      "p113verdict",
      ],
      throws: [
      "g3smokegrenade",
      ],
      strats: [
      "lift850jumppack",
      "cqc9defoliationtool",
      "am23emsmortarsentry",
      "orbitalprecisionstrike",
      ],
      armorPassives: [
      "peakphysique",
      ],
    },
  },
  {
    name: "The Doom Guy",
    items: {
      prims: [
      "doublefreedom",
      ],
      seconds: [
      "cqc42machete",
      ],
      throws: [
      "g6fraggrenade",
      ],
      strats: [
      "lift182warppack",
      "m105stalwart",
      "ag16gatlingsentry",
      "exo49emancipatorexosuit",
      ],
      armorPassives: [
      "rocksolid",
      ],
    },
  },
  {
    name: "Field Artillery",
    items: {
      prims: [
      "sg225spbreakerspraynpray",
      ],
      seconds: [
      "p113verdict",
      ],
      throws: [
      "g50seeker",
      ],
      strats: [
      "am12mortarsentry",
      "am23emsmortarsentry",
      "orbitalwalkingbarrage",
      "rl77airburstrocketlauncher",
      ],
      armorPassives: [
      "engineeringkit",
      ],
    },
  },
  {
    name: "The Assassin",
    items: {
      prims: [
      "r72censor",
      ],
      seconds: [
      "cqc2saber",
      ],
      throws: [
      "g89smokescreen",
      ],
      strats: [
      "lift182warppack",
      "orbitalrailcannonstrike",
      "eagle110mmrocketpods",
      "md6antipersonnelminefield",
      ],
      armorPassives: [
      "reducedsignature",
      ],
    },
  },
  {
    name: "The Saboteur",
    items: {
      prims: [
      "ar59suppressor",
      ],
      seconds: [
      "gp31grenadepistol",
      ],
      throws: [
      "ted63throwabledynamite",
      ],
      strats: [
      "bmdc4pack",
      "b100portablehellbomb",
      "md17antitankmines",
      "orbitallaser",
      ],
      armorPassives: [
      "reducedsignature",
      ],
    },
  },
  {
    name: "The Juggernaut",
    items: {
      prims: [
      "plas1scorcher",
      ],
      seconds: [
      "sg22bushwhacker",
      ],
      throws: [
      "g12highexplosivegrenade",
      ],
      strats: [
      "sh32shieldgeneratorpack",
      "cqc20breachinghammer",
      "ag16gatlingsentry",
      "orbitalairburststrike",
      ],
      armorPassives: [
      "supplementaryadrenaline",
      ],
    },
  },
  {
    name: "The Siege Breaker",
    items: {
      prims: [
      "las13trident",
      ],
      seconds: [
      "p113verdict",
      ],
      throws: [
      "gsh39shield",
      ],
      strats: [
      "leveller",
      "gl28beltfedgrenadelauncher",
      "td220bastion",
      "orbital380mmhebarrage",
      "am12mortarsentry",
      ],
      armorPassives: [
      "supplementaryadrenaline",
      ],
    },
  },
  {
    name: "The Motor Transport Operator",
    items: {
      prims: [
      "plas101purifier",
      ],
      seconds: [
      "plas15loyalist",
      ],
      throws: [
      "g123thermitegrenade",
      ],
      strats: [
      "m102gunnerfrv",
      "exo45patriotexosuit",
      "td220bastion",
      "cqc20breachinghammer",
      ],
      armorPassives: [
      "engineeringkit",
      ],
    },
  },
  {
    name: "The Counter Sniper",
    items: {
      prims: [
      "r63csdiligencecountersniper",
      ],
      seconds: [
      "m6csocompistol",
      ],
      throws: [
      "gsh39shield",
      ],
      strats: [
      "faf14spear",
      "ms11solosilo",
      "amls4xrocketsentry",
      "eat12antitankemplacement",
      ],
      armorPassives: [
      "scout",
      ],
    },
  },
  {
    name: "The Devil Dog",
    items: {
      prims: [
      "sg97sweeper",
      ],
      seconds: [
      "p69veto",
      ],
      throws: [
      "g4gasgrenade",
      ],
      strats: [
      "bflam80cremator",
      "orbitalairburststrike",
      "eagleairstrike",
      "td220bastion",
      ],
      armorPassives: [
      "concussivepadding",
      ],
    },
  },
  {
    name: "The Kriegsman",
    items: {
      prims: [
      "smgflam34stoker",
      ],
      seconds: [
      "cqc73entrenchmenttool",
      ],
      throws: [
      "g48giga",
      ],
      strats: [
      "mg43machinegun",
      "agm17gasmortarsentry",
      "egl21grenadierbattlement",
      "md6antipersonnelminefield",
      ],
      armorPassives: [
      "concussivepadding",
      ],
    },
  },
];
