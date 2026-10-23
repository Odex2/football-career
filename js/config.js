// @ts-check
// All balancing numbers live here.
// The game lives in one global namespace, G. This file loads first (index.html), so it creates it.
var G = {};

G.CFG = {
  START_YEAR: 2026,
  START_AGE: 17,
  MAX_SEASONS: 25,
  RETIRE_MIN_AGE: 32,
  RETIRE_FORCED_AGE: 33,      // from this age, no offers + no contract = forced retirement

  // Season blocks: share of league matchdays played in each block
  BLOCKS: ['Estate', 'Autunno', 'Inverno', 'Primavera', 'Finale', 'Torneo'],
  BLOCK_ICONS: ['☀️', '🍂', '❄️', '🌸', '🏆', '🌍'],
  BLOCK_SHARE: [0.12, 0.38, 0.2, 0.3, 0],
  PROMO_SLOTS: 3,             // up/down between divisions

  // Squads: 4-4-2 for every club
  /** @type {Dict<number>} */ FORMATION: { POR: 1, DC: 2, TS: 2, CC: 2, ES: 2, ATT: 2 },
  /** @type {Dict<number>} */ SQUAD: { POR: 3, DC: 4, TS: 4, CC: 4, ES: 4, ATT: 4 },
  SQUAD_MIN: 20, SQUAD_MAX: 27,
  ROTATION: 0.12,             // chance a starter is rested in a match
  SUBS: 3,

  // NPC development
  NPC_GROW: 0.3, NPC_NOISE: 1.4, NPC_PEAK: 27, NPC_DECL: 0.9, NPC_DECL_AGE: 30,
  NPC_RETIRE_AGE: 35, NPC_MAX_AGE: 39,
  YOUTH_PER_YEAR: [1, 2], WONDERKID: 0.035,
  YOUTH_POT: [3, 14], WONDERKID_POT: [16, 27],  // potential above starting ovr (keeps the number of stars stable over decades)

  // Economy (M€ per season unless stated)
  REV_BASE: 3, REV_DIV: 8,
  /** @type {Dict<number>} */ LEAGUE_MULT: { ENG1: 1.5, ESP1: 1.15, GER1: 1.1, ITA1: 1.0, FRA1: 0.95, KSA1: 1.5, USA1: 0.85, POR1: 0.6, NED1: 0.6,
    TUR1: 0.65, BEL1: 0.5, SCO1: 0.45, tier2: 0.35, other: 0.4 },
  WAGE_SHARE: 0.62, TRANSFER_SHARE: 0.3, CARRY: 0.5,
  VALUE_BASE: 0.6, VALUE_DIV: 5.2,          // value M€ = base * e^((ovr-60)/div) * age factor
  WAGE_K: 1.2, WAGE_DIV: 6.2,               // wage k€/week = k * e^((ovr-55)/div) * league mult
  /** @type {Dict<number>} */ PRIZE: { UCL: 60, UEL: 20, UECL: 8, title: 15, cup: 4 },

  // AI transfer market
  MARKET_PASSES: [2, 1],      // summer, january
  MAX_BUYS: [3, 1],
  CAND_SAMPLE: 25,
  SELL_RESIST: 0.15,          // chance a club sells to a smaller club anyway

  // Coaches
  COACH_BONUS_DIV: 15, COACH_BONUS_MAX: 1.5,
  SACK_GAP_MID: 6, SACK_P_MID: 0.2, SACK_GAP_END: 4, SACK_P_END: 0.35,
  /** @type {Dict<string>} */ COACH_STYLES: { giovani: 'Lancia i giovani', offensivo: 'Calcio offensivo', difensivo: 'Prima non prenderle', motivatore: 'Motivatore', tattico: 'Stratega' },

  // UEFA: league-phase places per nation [UCL, UEL (incl. cup winner), UECL]; totals 36/36/36
  /** @type {Dict<UefaInfo>} */
  UEFA: {
    UCL: { name: 'Champions League', md: 8, prize: 'UCL' },
    UEL: { name: 'Europa League', md: 8, prize: 'UEL' },
    UECL: { name: 'Conference League', md: 6, prize: 'UECL' }
  },
  /** @type {Dict<number[]>} */ UEFA_ACCESS: { ENG: [4, 2, 1], ITA: [4, 2, 1], ESP: [4, 2, 1], GER: [4, 2, 1], FRA: [3, 2, 1], NED: [2, 2, 1], POR: [2, 2, 1],
    BEL: [2, 1, 2], TUR: [2, 1, 2], CZE: [1, 2, 2], GRE: [1, 2, 2], AUT: [1, 2, 2], DEN: [1, 2, 2], SUI: [1, 2, 2], NOR: [1, 2, 2],
    SCO: [1, 2, 2], POL: [1, 2, 3], CRO: [1, 2, 3], SRB: [0, 1, 2], UKR: [0, 1, 3] },

  // Match model
  GOAL_BASE: 1.35,
  GOAL_SCALE: 25,
  HOME_ADV: 3,
  /** @type {Dict<number>} */ GOAL_W: { POR: 0, DC: 0.05, TS: 0.04, CC: 0.1, ES: 0.17, ATT: 0.33 },
  /** @type {Dict<number>} */ ASSIST_W: { POR: 0.01, DC: 0.04, TS: 0.11, CC: 0.19, ES: 0.2, ATT: 0.14 },
  ASSIST_RATE: 0.75,
  QUAL_DIV: 12,

  // Playing time (main player)
  MIN_K: 3.2,
  YOUTH_BONUS: 2,
  SUB_CHANCE: 0.45,
  RIVAL_POT_MAX: 95,          // the career rival's potential is raised close to the player's, up to this
  SPEC: 0.5,                  // how much specialised shooting/passing (vs the role norm) adds to the player's goals/assists
  FORM_WEIGHT: 3.5,           // form (-2..2) x this = ovr points in the coach's eyes
  /** @type {Dict<number>} */ ROLE_FLOOR: { titolare: 0.75, rotazione: 0.4, riserva: 0.1 }, // contract role = minimum start chance
  FLOOR_BAD_FORM: -0.8,       // below this form even the promised role is cut
  FLOOR_CUT: 0.6,
  REL_DIV: 20,                // coach relationship / REL_DIV = ovr points of trust

  // Ratings
  RATING_BASE: 6.2, RATING_DIV: 16,

  // Player creation
  POT_MIN: 66, POT_MAX: 94,
  // Hidden GOAT mode: 1 = a talent seen once every 100 careers, 2 = once every 1000
  /** @type {{ [level: number]: { pot: number[], start: number } }} */ GOAT: { 1: { pot: [92, 93], start: 2 }, 2: { pot: [95, 96], start: 4 } },
  START_OVR_BASE: 50, START_OVR_POT: 0.32,
  CEIL_NOISE: 4,
  TRAIT_COUNT: [1, 2],

  // Growth (fraction of gap to ceiling closed per season, before attribute peak)
  GROW_RATE: 0.2,
  GROW_YOUNG: [[20, 1.25], [24, 1.15]],  // extra growth up to age 20, then up to 24
  // Great seasons raise the potential: avg rating >= AVG[0] gives +1, >= AVG[1] +2 (regular starter, club not far below, up to AGE)
  POT_UP: { AVG: [6.7, 7.1], SHARE: 0.5, LEVEL: 6, AGE: 27, MAX: 8, CAP: 92 },
  GROW_TALENT_BASE: 0.7, GROW_TALENT_DIV: 50,
  GROW_MIN_FACTOR: 0.55, GROW_MIN_SLOPE: 0.6,  // growth vs share of minutes
  DECL_BASE: 0.5, DECL_EXP: 1.25,
  DECL_TALENT: 1.25,          // decline mult = DECL_TALENT - (pot-60)/60
  FOCUS_MULT: 1.8, FOCUS_OTHERS: 0.95, FOCUS_KEY: 1.4, FOCUS_KEY_W: 0.1, // 'key' focus = attributes weighing >= FOCUS_KEY_W for the role
  // heal = injury matches recovered per match, mo = morale per block, decl = decline after the peak age
  INTENSITY: [
    { name: 'Leggera', grow: 0.75, inj: 0.5, heal: 2, mo: 1, decl: 0.75, desc: 'cresci meno, ma guarisci il doppio più in fretta, morale più alto e declino più lento dopo il picco' },
    { name: 'Normale', grow: 1, inj: 1, heal: 1, mo: 0, decl: 1, desc: 'equilibrio tra crescita e rischio infortuni' },
    { name: 'Intensa', grow: 1.25, inj: 1.9, heal: 1, mo: 0, decl: 1.15, desc: 'cresci di più, ma quasi il doppio degli infortuni e declino più rapido dopo il picco' }
  ],
  INJ_BASE: 0.12, INJ_OLD_AGE: 30, INJ_OLD_MULT: 1.3,
  INJ_MATCHES: [1, 12],

  // Morale
  MORALE_START: 60,
  MORALE_RATING: 4, MORALE_MINUTES: 8, MORALE_REVERT: 0.15,

  // Contracts, offers, negotiation
  CONTRACT_YEARS: [2, 5],
  OFFER_MAX: 5,
  RAISE_ASK: 0.15,            // each counter-offer asks +15% wage (or better role / +1 year)
  RAISE_BASE_OK: 0.55, RAISE_AGENT: 0.07, RAISE_ROUND: 0.15,
  WITHDRAW: [0.3, 0.55],      // chance the club walks away after 1st / 2nd failed raise
  TAX: 0.45,
  // Release clause (M€ = market value x MULT; Liga clubs always ask a huge one) and contract bonuses (x weekly wage)
  CLAUSE: { MULT: [1.6, 2.6], ESP: [2.6, 4], CUT: 0.3, MIN: 1.1, BLOCK: 0.6, PAY_NEAR: 1.25, FANS: -8 },
  BONUS: { goal: 0.3, app: 0.05, trophy: 2, UP: 0.5 },
  WEEKS_PER_BLOCK: 10,

  // Fame, fans, legend
  FAME_START: 5,
  BANDIERA: 80,               // fan affection needed to become a club legend
  BANDIERA_SEASONS: 5,
  DERBY_FANS: 4,
  // Captain: score = seasons at club x8 + years over 18 (max 12) x2 + fans x0.3 + (ovr - team) x1.5 + coach x0.1 (+20 club legend)
  CAPTAIN: { SEASONS: 2, AGE: 22, NEED: 55, DROP: 35, STRIP_REL: -40, MORALE: 2, FANS: 1.25, RENEW: 1.1, FAME: 2, NT_CAPS: 60, NT_AGE: 26 },

  // Awards
  POTS_MIN_SHARE: 0.5,
  BDO_MIN_APPS: 20,
  BOOT_COEF: { top5: 2, eu: 1.5, other: 1 },
  BDO_LEAGUE: { top5: 1, eu: 0.75, other: 0.65 },
  /** @type {Dict<number>} */ BDO: { rating: 30, goal: 0.8, assist: 0.5, cs: 0.6, UCL: 25, UEL: 8, UECL: 4, titleTop: 12, title: 5, cup: 4, pots: 6, boot: 6, str: 0.6, fame: 0.1, goalCap: 30 },

  // Events
  EVENT_CHANCE: 0.6,
  // Second career (coach or sporting director). rep0 = BASE + legend score / SCORE + fame / FAME.
  // Clubs whose fans love you (affection >= LOVE) call first with perks: patience, budget, squad morale.
  MGR_AW: { MONTH_MIN: 3, CHAMP: 3, WORLD_MIN: 28, HOF: [1, 4, 10] }, // second-career awards: min matches in a block, title bonus, world haul, legend points
  MGR: { MAX_AGE: 70, REP_BASE: 46, REP_SCORE: 55, REP_FAME: 20, REP_MIN: 50, REP_MAX: 74, OFFERS: 5, LOVE: 45,
    CONF0: 60, PAT_DIV: 4, BUD_DIV: 250, MOR_DIV: 8, BLOCK_CONF: 2.5, END_CONF: 5, TROPHY_CONF: 12,
    MORALE_DIV: 30, MORALE_RES: 1.2, REP_SMALL: 8, BUYS: [4, 2], SELL: 0.9, PRICE: 1.15, STAR_NO: 0.4 },
  // manager's XI (js/mgr-team.js): ovr lost per fitness point below 100, fitness lost per start (+ for the old), gained resting
  MGR_TEAM: { COND_OK: 80, COND_K: 0.18, COND_PLAY: 6, REST_AT: 70, REST_PEN: 6, COND_OLD: 3, OLD: 31, COND_REST: 20, COND_MIN: 55, YOUTH: 2, YOUTH_SHARE: 0.35 },
  MGR_LIFE: { TACTIC: /** @type {Dict<number[]>} */ ({ att: [-2, 1], bal: [0, 0], def: [1, -1.5] }), SHIRT_SEASONS: 5, SHIRT_START: 8, SHIRT_MO: 1, HEIR_OVR: 52, HEIR_POT: [80, 90] }, // tactic cost [morale, fans] per block, retired shirt, heir
  MGR_EV_CHANCE: 0.4, // chance of a second-career event card after a block
  ROLE_SWAP: { OVR: 5, GAIN: 0.15 }, // coach's role change offer: max overall lost, min gain in start chance
  GOALS: { STRETCH: 4, STARTER: 0.5, AVG: [6.6, 6.9], CS: 10, APPS: 26, FAME: 3, FANS: 4, MORALE: 6 }, // season goals (js/goals.js): rewards per level
  // Decisive moments (js/moments.js): chance = BASE + option base + (attribute - 60) / ATTR_DIV + form * FORM
  MOMENTS: { PER_BLOCK: 2, BASE: 0.3, ATTR_DIV: 90, FORM: 0.03, OPP_DIV: 70, STOP: 0.15, GK_TIP: 0.7, MIN: 0.1, MAX: 0.85, GK_HINT: 0.42, GK_OTHER: 0.15, MIN_MINS: 1, RATING_OK: 0.6, RATING_KO: -0.4, COUNTER: 0.4 },
  PRESS_CHANCE: 0.45,         // press conference after a block when no event came up

  // Ages at which each attribute peaks, and decline speed after the peak
  /** @type {Dict<number>} */ PEAK: { vel: 25, res: 27, for: 28, fin: 29, tir: 29, tes: 29, pas: 31, vis: 32,
          dri: 27, mar: 30, con: 29, pos: 32, fre: 33, rif: 30, usc: 31 },
  /** @type {Dict<number>} */ DECL_MULT: { vel: 1.4, res: 1.2, for: 0.9, fin: 0.9, tir: 0.8, tes: 0.8, pas: 0.6, vis: 0.5,
               dri: 1.1, mar: 0.8, con: 1, pos: 0.5, fre: 0.4, rif: 1, usc: 0.8 },
  // Generation bias by weight of the attribute in the chosen role
  GEN_BIAS: [[0.15, 3], [0.08, 0], [0.03, -5], [0.001, -9], [0, -16]],
  GEN_NOISE: 5,

  // Agent market (js/agents.js)
  AGENT: {
    EXTRA: 5,              // random agents added at career start
    MIN: 12,               // active agents kept on the market
    ELITE: 3,              // agents with 4+ stars kept on the market
    RETIRE: 0.07,          // yearly chance an agent quits
    DRIFT: 0.22,           // yearly chance skill moves by one star
    CLOSED: 0.25,          // chance an agent takes no new clients this window
    FEE: [0, 4, 6, 8, 10, 12],        // base commission % by stars
    FAME: [0, 0, 14, 32, 52, 72],     // fame needed by stars
    JITTER: 8              // +/- fame requirement noise
  },

  // National teams and international tournaments (js/national.js, js/tournament.js)
  NT: {
    /** @type {Dict<number>} */ QUOTA: { POR: 3, DC: 4, TS: 4, CC: 4, ES: 3, ATT: 4 },  // call-ups per role (22)
    BLEND: 0.5,            // squad strength = BLEND x best XI of real players + rest x base strength
    MIN_FOUND: 11,         // players needed to use the real squad
    FORM_W: 2,             // form weight in the ct's eyes
    FAME_DIV: 30,          // fame / FAME_DIV = extra points for famous players
    CALL_K: 1.5,
    GAP: 1.6,              // national matches: strength gaps count more (fewer upsets)           // softness of the call-up cut
    WINDOW: 3,             // matches per international window (autumn and spring)
    QUAL_NOISE: 3,         // randomness of qualification
    QUAL_FORM: 4,          // your nation: points per match above 1.5 x this = strength bonus to qualify
    SACK_BAD: 0.7,         // ct sacked after a group exit or failed qualification
    LEAVE: 0.15,           // ct leaves anyway after a tournament
    BDO_GOAL: 0.6,         // Ballon d'Or bonus per tournament goal
    FINALIST: 0.4,         // runner-up squad gets this share of the winners' bonus
    /** @type {Dict<TourInfo>} */
    TOURS: {
      WC: { n: 'Mondiale', size: 48, q: { UEFA: 16, CONMEBOL: 7, CAF: 9, AFC: 8, CONCACAF: 7, OFC: 1 }, bdo: 10 },
      EURO: { n: 'Europeo', size: 24, q: { UEFA: 24 }, bdo: 7 },
      COPA: { n: 'Copa América', size: 16, q: { CONMEBOL: 10, CONCACAF: 6 }, bdo: 6 },
      ASIA: { n: 'Coppa d’Asia', size: 16, q: { AFC: 16 }, bdo: 2 },
      AFCON: { n: 'Coppa d’Africa', size: 16, q: { CAF: 16 }, bdo: 4 }
    },
    /** @type {Dict<string>} */ CONT: { UEFA: 'EURO', CONMEBOL: 'COPA', CONCACAF: 'COPA', AFC: 'ASIA', CAF: 'AFCON' }
  }
};

/** @type {Dict<RoleInfo>} */
G.ROLES = {
  POR: { label: 'POR', name: 'Portiere', macro: 'POR' },
  DC: { label: 'DC', name: 'Difensore centrale', macro: 'DEF' },
  TS: { label: 'TS/TD', name: 'Terzino', macro: 'DEF' },
  CC: { label: 'CC', name: 'Centrocampista', macro: 'CEN' },
  ES: { label: 'ES/ED', name: 'Esterno', macro: 'CEN' },
  ATT: { label: 'ATT', name: 'Attaccante', macro: 'ATT' }
};

// 15 attributes shared by every role; weights decide the overall
G.ATTRS = ['vel', 'res', 'for', 'fin', 'tir', 'tes', 'pas', 'vis', 'dri', 'mar', 'con', 'pos', 'fre', 'rif', 'usc'];
/** @type {Dict<string>} */
G.ATTR_NAMES = { vel: 'Velocità', res: 'Resistenza', for: 'Forza', fin: 'Finalizzazione', tir: 'Tiro da fuori',
  tes: 'Colpo di testa', pas: 'Passaggio', vis: 'Visione', dri: 'Dribbling', mar: 'Marcatura', con: 'Contrasto',
  pos: 'Posizionamento', fre: 'Freddezza', rif: 'Riflessi', usc: 'Uscite e presa' };
/** @type {Dict<{ name: string, keys: AttrKey[] }>} */
G.GROUPS = {
  fis: { name: 'Fisico', keys: ['vel', 'res', 'for'] },
  att: { name: 'Attacco', keys: ['fin', 'tir', 'tes'] },
  tec: { name: 'Tecnica', keys: ['pas', 'vis', 'dri'] },
  dif: { name: 'Difesa', keys: ['mar', 'con'] },
  men: { name: 'Mentale', keys: ['pos', 'fre'] },
  gk: { name: 'Portiere', keys: ['rif', 'usc'] }
};

// Overall weights per role (missing = 0)
/** @type {Dict<Dict<number>>} */
G.WEIGHTS = {
  POR: { rif: 0.32, usc: 0.22, pos: 0.18, fre: 0.10, pas: 0.06, for: 0.06, vel: 0.04, res: 0.02 },
  DC: { mar: 0.22, con: 0.22, tes: 0.14, for: 0.14, pos: 0.12, vel: 0.06, pas: 0.05, fre: 0.03, res: 0.02 },
  TS: { vel: 0.18, con: 0.15, res: 0.14, mar: 0.12, pas: 0.12, dri: 0.09, pos: 0.08, for: 0.05, vis: 0.04, fre: 0.03 },
  CC: { pas: 0.22, vis: 0.18, res: 0.10, dri: 0.10, con: 0.08, tir: 0.08, pos: 0.08, fre: 0.06, for: 0.05, fin: 0.03, mar: 0.02 },
  ES: { vel: 0.22, dri: 0.22, pas: 0.12, fin: 0.10, tir: 0.08, vis: 0.08, res: 0.08, fre: 0.06, for: 0.02, tes: 0.02 },
  ATT: { fin: 0.26, vel: 0.12, fre: 0.12, pos: 0.10, tes: 0.10, dri: 0.10, tir: 0.08, for: 0.08, pas: 0.04 }
};

/** @type {Dict<TraitInfo>} */
G.TRAITS = {
  precoce: { name: 'Precoce', desc: 'Picco anticipato, cresce in fretta da giovane', peak: -2, young: 1.3 },
  tardivo: { name: 'Esplosione tardiva', desc: 'Lento fino a 21 anni, poi esplode', peak: 2, young: 0.7, mid: 1.4 },
  integro: { name: 'Integro', desc: 'Si infortuna raramente', inj: 0.4 },
  fragile: { name: 'Fragile', desc: 'Infortuni frequenti', inj: 1.8 },
  pro: { name: 'Professionista', desc: 'Declino più lento', decl: 0.7 },
  bomber: { name: 'Istinto', desc: 'Finalizzazione (Riflessi per il POR) cresce di più', key: 1.3 }
};

// Agents: skill 1-5 boosts visibility and negotiation; fee is % of wage; need some fame to sign you
// Starting agents; the agent market then changes every season (js/agents.js)
G.AGENTS = [
  { n: 'Luca Ferretti', nt: 'ITA', s: 1 }, { n: 'Pedro Almeida', nt: 'POR', s: 1 },
  { n: 'Sophie Marchand', nt: 'FRA', s: 2 }, { n: 'Kenan Aydın', nt: 'TUR', s: 2 },
  { n: 'Mark Holloway', nt: 'ENG', s: 3 }, { n: 'Ana Ribeiro', nt: 'POR', s: 3 },
  { n: 'Viktor Lang', nt: 'GER', s: 4 }, { n: 'Rafael Montero', nt: 'ESP', s: 4 },
  { n: 'Elena Volkova', nt: 'SRB', s: 5 }, { n: 'Jorge Salazar', nt: 'ARG', s: 5 }
];

// Ways to spend money (k€). Staff are yearly costs, paid per playing block.
G.SHOP = {
  /** @type {Dict<StaffInfo>} */
  staff: {
    trainer: { n: 'Preparatore personale', d: 'Crescita degli attributi più rapida', lv: [[150, 0.06], [400, 0.12], [900, 0.18], [2000, 0.24], [4000, 0.3]] },
    physio: { n: 'Staff medico privato', d: 'Meno infortuni e più brevi', lv: [[120, 0.2], [300, 0.35], [700, 0.5], [1500, 0.6], [3000, 0.68]] },
    nutri: { n: 'Nutrizionista', d: 'Declino più lento dopo il picco', lv: [[80, 0.1], [200, 0.2], [450, 0.3], [1000, 0.4], [2000, 0.5]] },
    mental: { n: 'Mental coach', d: 'Morale più stabile, voti meno altalenanti', lv: [[60, 3], [150, 6], [400, 9], [900, 12]] },
    analyst: { n: 'Video analista', d: 'Più fiducia dell’allenatore (minuti)', lv: [[90, 1], [250, 2], [600, 3], [1400, 4]] },
    pr: { n: 'Ufficio stampa', d: 'Fama in crescita, media più benevoli', lv: [[100, 1], [300, 2], [700, 3], [1500, 4]] }
  },
  /** @type {Dict<ShopItem>} */
  items: {
    flat: { n: 'Appartamento in centro', c: 300, mo: 3, fa: 0, once: 1 },
    villa: { n: 'Villa', c: 2500, mo: 6, fa: 2, once: 1 },
    luxury: { n: 'Villa di lusso', c: 9000, mo: 8, fa: 5, once: 1 },
    car: { n: 'Auto sportiva', c: 250, mo: 2, fa: 1, once: 1 },
    charity: { n: 'Donazione benefica', c: 500, mo: 2, fa: 2, fans: 5, season: 1 },
    academy: { n: 'Scuola calcio nel paese natale', c: 5000, mo: 5, fa: 6, once: 1 },
    // st: permanent bonus added to a staff effect · inc: income k€ a year · req: fame needed · fans: affection of all your fans
    watch: { n: 'Orologio di lusso', c: 150, mo: 1, fa: 1, once: 1 },
    chef: { n: 'Chef personale', c: 600, mo: 2, fa: 0, once: 1, st: { nutri: 0.05 } },
    gym: { n: 'Palestra privata in casa', c: 1200, mo: 1, fa: 0, once: 1, st: { trainer: 0.03 } },
    restaurant: { n: 'Ristorante di proprietà', c: 2500, mo: 2, fa: 1, once: 1, inc: 250 },
    cryo: { n: 'Centro di recupero con crioterapia', c: 3500, mo: 1, fa: 0, once: 1, st: { physio: 0.08 } },
    brand: { n: 'Linea di abbigliamento col tuo nome', c: 8000, mo: 2, fa: 4, once: 1, inc: 1500, req: 70 },
    amateur: { n: 'Club dilettantistico della tua città', c: 15000, mo: 6, fa: 5, once: 1 },
    yacht: { n: 'Yacht', c: 18000, mo: 8, fa: 6, once: 1 },
    foundation: { n: 'Fondazione benefica col tuo nome', c: 25000, mo: 5, fa: 8, fans: 8, once: 1 },
    jet: { n: 'Jet privato', c: 45000, mo: 8, fa: 8, once: 1, req: 80 },
    island: { n: 'Isola privata', c: 90000, mo: 12, fa: 8, once: 1, req: 90 }
  },
  /** @type {Dict<string>} */ ITEM_PERK: { trainer: 'crescita', nutri: 'declino', physio: 'infortuni' },
  INVEST_STEP: 1000, INVEST_MEAN: 0.05, INVEST_SD: 0.1
};
