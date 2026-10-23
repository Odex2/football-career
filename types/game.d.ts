// Shapes of the game's data, for TypeScript's checker only (tsc -p jsconfig.json). The browser never loads this file:
// the game stays plain JavaScript, and the JS files point at these names in JSDoc comments, e.g. /** @param {State} st */.
// Built from real saves (player careers, manager careers, an old director save); keep it in step with the code.

// ---- Small aliases: they read better in signatures than bare numbers and strings
/** Index into world.clubs */
type ClubId = number;
/** Index into world.players (NPC footballers) */
type PlayerId = number;
/** Index into world.coaches */
type CoachId = number;
/** 'POR' | 'DC' | 'TS' | 'CC' | 'ES' | 'ATT' (kept as string so Object.keys(G.ROLES) can be used directly) */
type RoleKey = string;
/** 'vel', 'res', 'for', ... one of G.ATTRS */
type AttrKey = string;
/** League key: nation code + tier, e.g. 'ITA1', 'ENG2' */
type LeagueKey = string;
/** Nation code, e.g. 'ITA' */
type NationCode = string;
/** League table row: [played, won, drawn, lost, goals for, goals against, points] */
type TableRow = number[];
/** Plain object used as a dictionary, e.g. the tables in js/config.js */
type Dict<T> = { [k: string]: T };
/** The 15 attributes (or their ceilings), keyed by AttrKey */
type Attrs = { [k: string]: number };

// ---- Random numbers (js/rng.js)
interface Rng {
  next(): number;
  int(a: number, b: number): number;
  range(a: number, b: number): number;
  chance(p: number): boolean;
  pick<T>(list: T[]): T;
  shuffle<T>(list: T[]): T[];
  normal(): number;
  poisson(lambda: number): number;
  state?(): number;
}

// ---- Static data (built at load from js/names.js, js/world.js, js/config.js)
interface LeagueInfo { key: LeagueKey; nat: NationCode; tier: number; name: string; size: number }
interface NationInfo { id: NationCode; name: string; flag: string; cup: string; eu: number; leagues: { n: string; c: string }[]; [k: string]: any }
interface RoleInfo { label: string; name: string; macro: string }

// ---- The world
interface Club {
  id: ClubId;
  name: string;
  short: string;
  nat: NationCode;
  lg: LeagueKey;
  /** strength from the data file */
  base: number;
  /** current strength (average of the best XI plus the coach) */
  str: number;
  rep: number;
  /** crest colours and style letter */
  c1: string;
  c2: string;
  sty: string;
  /** rival clubs */
  riv: ClubId[];
  /** squad */
  sq: PlayerId[];
  /** best XI, bench by role and best bench players (rebuilt by G.season.refresh) */
  xi?: PlayerId[];
  bench?: { [role: string]: PlayerId[] };
  benchTop?: PlayerId[];
  coach: CoachId;
  /** honours: trophy name -> times won */
  hon: { [trophy: string]: number };
  /** revenue and transfer budget, M€ */
  rev?: number;
  bud?: number;
}

/** NPC footballer, short keys to keep saves small */
interface Npc {
  i: PlayerId;
  /** name, nationality, role, age, overall, potential */
  n: string;
  nt: NationCode;
  r: RoleKey;
  a: number;
  o: number;
  p: number;
  /** club (-1 free agent), contract years, wage */
  c: ClubId;
  y: number;
  w: number;
  /** season stats: [apps, starts, ... ] see js/squads.js */
  s: number[];
  /** career: [apps, goals, assists] */
  k: number[];
  fa?: number;
  /** the manager's heir (js/mgr-life.js) */
  heir?: number;
}

interface Coach { i: CoachId; n: string; nt: NationCode; a: number; rep: number; sty: string; c: ClubId; ret?: number; me?: number }

interface Agent { i: number; n: string; nt: NationCode; s: number; ret: boolean; fee: number; fame: number; open: boolean }

interface World {
  clubs: Club[];
  /** null where a retired player's slot waits to be reused (see free) */
  players: Npc[];
  coaches: Coach[];
  agents: Agent[];
  free?: PlayerId[];
  nextPid: number;
  nextCid: number;
  ntCoach?: number;
}

// ---- The main player
interface Contract { years: number; wage: number; role: string; clause?: number; bonus?: { g: number; a: number; t: number } }

interface SeasonGoal { k: string; n: number; lvl: number; t: string; base?: number }

/** One finished season in the player's history */
interface SeasonRecord {
  year: number;
  age: number;
  club: string;
  clubId: ClubId;
  lg: string;
  pos: number;
  apps: number;
  matches: number;
  goals: number;
  assists: number;
  cs: number;
  avg: number;
  ovr: number;
  inj: number;
  lgG: number;
  lgA: number;
  trophies: string[];
  awards: string[];
  loan: boolean;
  potUp?: number;
  bonus?: number;
  goal?: { ok: number; t: string; up?: number };
  nt?: string;
  bdo?: number;
  captain?: number;
}

interface Trophy { name: string; year: number; club: string }
interface Award { name: string; year: number; w: number; club?: string }

interface NationalCareer {
  caps: number;
  goals: number;
  assists: number;
  rSum: number;
  rN: number;
  debut: number | null;
  tours: { key: string; n: string; year: number; res: string; apps: number; g: number }[];
  called?: number;
  cap?: number;
}

interface Player {
  name: string;
  nat: NationCode;
  role: RoleKey;
  foot: string;
  age: number;
  pot: number;
  /** potential at creation, before season goals raised it */
  pot0?: number;
  ovr: number;
  peak?: number;
  stars: number;
  starsX?: number;
  attrs: Attrs;
  ceil: Attrs;
  traits: string[];
  morale: number;
  form: number;
  /** matches still out injured */
  inj: number;
  seasons: number;
  history: SeasonRecord[];
  trophies: Trophy[];
  awards: Award[];
  tot: { apps: number; goals: number; assists: number };
  clubId: ClubId;
  loanFrom: ClubId | null;
  contract: Contract | null;
  plan: { focus: string; intensity: number };
  fame: number;
  /** k€ */
  money: number;
  agent: number | null;
  staff: { [k: string]: number };
  items: { [k: string]: number };
  invest: number;
  /** per club: fans' love, seasons and goals there, betrayals, flag player */
  fans: { [club: number]: number };
  seasonsAt: { [club: number]: number };
  goalsAt: { [club: number]: number };
  traitor: { [club: number]: number };
  bandiera: { [club: number]: number };
  /** relationship with each coach */
  rel: { [coach: number]: number };
  derbyWins: number;
  transferReq: boolean;
  nt: NationalCareer;
  captain?: ClubId | null;
  capClubs?: { [club: number]: number };
  capSeasons?: number;
  ach?: { [id: string]: number };
  visBonus?: number;
  goat?: number;
  /** manager career started without a playing career */
  mgrOnly?: number;
}

// ---- The season in progress
interface LeagueState { ids: ClubId[]; tab: Dict<TableRow>; md: number }
interface CupState { name: string; alive: ClubId[]; R: number; r: number; winner: ClubId | null }

interface EuroComp {
  key: string;
  name: string;
  teams: ClubId[];
  tab: Dict<TableRow>;
  fx: number[][][];
  md: number;
  stage: string;
  ties: number[][];
  log: { stage: string; a: ClubId; b: ClubId; ag: number; bg: number; w: ClubId }[];
  winner: ClubId | null;
}

interface Tournament {
  key: string;
  n: string;
  year: number;
  teams: NationCode[];
  groups: NationCode[][];
  tab: { [nat: string]: number[] };
  md: number;
  stage: string;
  ko: NationCode[][];
  log: { stage: string; a: NationCode; b: NationCode; ga: number; gb: number; w: NationCode; pens?: any }[];
  winner: NationCode | null;
  runner: NationCode | null;
  sc: { [k: string]: number };
  scN: { [k: string]: string };
  my: { apps: number; g: number; a: number };
  out: { [nat: string]: any };
}

/** The player's numbers in the current season */
interface SeasonStats {
  apps: number;
  starts: number;
  mins: number;
  goals: number;
  assists: number;
  cs: number;
  rSum: number;
  rN: number;
  matches: number;
  inj: number;
  clubs: ClubId[];
  /** league only: [apps, goals, assists, clean sheets, rating sum] */
  lg: number[];
}

/** One match row shown in the block summary (player's match, manager's match or national team) */
interface MatchRow {
  opp: ClubId | NationCode;
  home: boolean;
  gf: number;
  ga: number;
  mins: number;
  g: number;
  a: number;
  r: number;
  comp: string;
  derby?: boolean;
  nt?: number;
  mgr?: number;
  sc?: string[];
  form?: string;
  tac?: string;
}

/** A block being played day by day */
interface BlockInProgress {
  b: number;
  d: number;
  D: number;
  /** per league: [matchday at start, matchday target] */
  lg: { [key: string]: number[] };
  /** per cup: [rounds this block, rounds played] */
  cup: { [nat: string]: number[] };
  /** per European competition: [matchday at start, matchday target, knockout rounds played] */
  eu: { [key: string]: number[] };
  ps0: SeasonStats;
  ovrBefore: number;
  injury: number;
  /** decisive moments used in this block */
  mom?: number;
}

interface Season {
  year: number;
  /** 0-4 club season, 5 summer tournament */
  block: number;
  lg: { [key: string]: LeagueState };
  cups: { [nat: string]: CupState };
  eu: { [key: string]: EuroComp };
  ps: SeasonStats;
  log: any[];
  prize: { [k: number]: number };
  blockRows: MatchRow[];
  start0: { ovr: number; fame: number; money: number };
  cur?: BlockInProgress | null;
  /** chance to start a match */
  pStart?: number;
  best?: MatchRow;
  ntCall?: { called: boolean; start: number };
  tours?: { [key: string]: Tournament };
}

// ---- Cards, offers, recaps
interface EventCard {
  /** decisive moments: the situation drawn (js/moments.js) */
  sc?: string;
  id: string;
  t: string;
  d: string;
  o: string[];
  press?: number;
  mgr?: number;
  moment?: number;
  key?: string;
  hint?: number;
  betN?: number[];
}

interface Offer {
  id: number;
  club: ClubId;
  type: string;
  fee: number;
  wage: number;
  years: number;
  role: string;
  rounds: number;
  note: string;
  clause?: number;
  bonus?: { g: number; a: number; t: number };
  viaClause?: number;
  blocked?: number;
}

interface NewsItem { y: number; b: number; t: string }

// ---- Manager career (js/mgr*.js)
interface MgrPerks { pat: number; bud: number; mor: number }
interface MgrOffer { club: ClubId; fans: number; perks: MgrPerks | null; bandiera: number }
interface MgrSeason { year: number; age: number; club: string; clubId: ClubId; role: string; lg: string; pos: number | null; tgt: number | null; won: string[]; note: string }
interface XiSlot { r: RoleKey; id: PlayerId }

interface Mgr {
  /** 'mgr' (old saves: 'coach' or 'ds', migrated on load) */
  role: string;
  rep: number;
  club: ClubId | null;
  lastClub?: ClubId;
  /** our own entry in world.coaches */
  co: CoachId;
  since: number;
  jobs: number;
  seasons: number;
  sacked: number;
  /** career over */
  done?: number;
  hist: MgrSeason[];
  trophies: Trophy[];
  awards: Award[];
  /** board confidence, squad morale, fans' perks */
  conf?: number;
  pat?: number;
  perks?: MgrPerks;
  morale?: number;
  obj?: { year: number; tgt: number; n: number; txt: string };
  pos?: number;
  tactic: string;
  form: string;
  /** 'auto' or 'manual' XI */
  mode: string;
  xi?: XiSlot[] | null;
  xiForm?: string;
  /** fitness and starts per player, matches played this season */
  cond?: { [player: number]: number };
  starts?: { [player: number]: number };
  played?: number;
  youthX?: number;
  /** market */
  buys?: number;
  tg?: PlayerId[] | null;
  tgKey?: string;
  /** retired shirts, the shirt honoured at the current club, the heir */
  shirts?: { [club: number]: number };
  shirt?: ClubId | null;
  heir?: PlayerId | null;
  /** league snapshot for the manager of the month */
  snap?: { year: number; key: LeagueKey; t: { [club: number]: number[] } };
  policy?: string;
}

// ---- The whole career: what the save holds
interface State {
  v: number;
  seed: number;
  year: number;
  world: World;
  player: Player;
  S: Season | null;
  euQual: { [key: string]: ClubId[] } | null;
  over: boolean;
  retireReason?: string | null;
  news: NewsItem[];
  roll: AwardRoll[];
  ntRoll: NtRollEntry[];
  flags: { [k: string]: any };
  offers: Offer[];
  offerSeq?: number;
  noOffers?: boolean;
  renewAsked?: boolean;
  clubSell?: ClubId | null;
  coachCalls?: { coach: CoachId; club: ClubId }[];
  event?: EventCard | null;
  eventResult?: { t: string; r: string } | null;
  pressResult?: any;
  evUsed?: { [id: string]: number };
  goalOffer?: SeasonGoal[] | null;
  goal?: SeasonGoal | null;
  goalYear?: number;
  momentPick?: { key: string; i: number; hint: number; sc?: string } | null;
  momentResult?: { ok: boolean; t: string } | null;
  momSeen?: string[];
  live?: boolean;
  recap?: any;
  lastBlock?: BlockSum;
  lastTables?: { key: LeagueKey; ids: ClubId[]; tab: Dict<TableRow> };
  records?: Records;
  prevAttrs?: Attrs;
  achNew?: string[];
  ntq?: any;
  hofSaved?: boolean;
  hofId?: string;
  rngState?: number;
  debug?: number;
  mgr?: Mgr;
  mgrOffers?: { why: string; list: MgrOffer[]; coach?: MgrOffer[]; ds?: MgrOffer[] } | null;
}
