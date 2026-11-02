// Trophy cabinets, records, achievements, Hall of Fame, season recap (js/trophies.js, js/trophy-shelves.js and the meta files)

/** how a trophy is drawn: sprite shape, metal, ribbon colours, or club colours instead of metal */
interface TroDef { s: string; m?: string; r?: string[]; c?: string[] }
interface TroWin { year: number | null; club: string }
/** one trophy in a cabinet (miss = not won yet, drawn as a silhouette) */
interface TroItem { k: string; name: string; d: TroDef; wins: TroWin[]; miss?: number }
/** a cabinet shelf (mem = keepsakes, not counted as trophies) */
interface Shelf { t: string; mem?: number; items: TroItem[] }
/** something won: a trophy, an award or a promotion */
interface Won { name: string; year: number; club?: string; w?: number }
/** a season row the cabinets read: the player's history or the manager's */
interface CareerRow { year: number; club: string; clubId: ClubId; lg: string; trophies?: string[]; won?: string[] }

// ---- Records and the rival (js/records.js): st.records
interface LeagueRecord { n: string | null; g: number; year: number | null; real?: number; me?: number; prev?: string | null }
interface PersonalBest { v: number; year: number; opp?: ClubId | NationCode; nt?: number; club?: string }
interface Rival { id: PlayerId; n: string; since: number; ret?: number }
interface RivalSeason { year: number; o: number; g: number; a: number; apps: number; club: string; bdo: number | null }
interface Records { lg: Dict<LeagueRecord>; me: Dict<PersonalBest>; rival: Rival | null; rivalLog: RivalSeason[] }
/** league records broken this season */
interface SeasonRecord { records?: string[] }

// ---- Achievements (js/achievements.js)
interface AchSeason { goals: number; assists: number; cs: number; apps: number; avg: number; age: number }
/** live career totals the achievements check (G.ach.totals) */
interface AchTotals {
  p: Player; apps: number; goals: number; assists: number; tro: string[]; aw: string[]; lgs: number; abroad: boolean;
  rows: MatchRow[]; seasons: AchSeason[]; has: (list: string[], re: RegExp) => boolean; peak: number; nat: NationCode;
  hist: SeasonRecord[]; leagueTitles: number; teenGoals: number;
}
/** [id, icon, name, description, check] */
type AchDef = [string, string, string, string, (A: AchTotals) => unknown];

// ---- Hall of Fame (js/hof.js): the score of a career and the entries kept in localStorage
interface HofScore { total: number; parts: Dict<number>; grade: string; icon: string }
interface HofEntry {
  id: string; name: string; nat: NationCode; role: RoleKey; from: number; to: number; seasons: number; clubs: string[];
  apps: number; goals: number; assists: number; caps: number; trophies: number; big: string[]; bdo: number; score: number; grade: string;
  mgr: HofMgr | null; icon: string; goat: number; peak: number; date: number;
}
interface HofMgr { only: number; role: string; seasons: number; trophies: number }

// ---- End-of-season recap (js/recap.js for the player, G.mgr.seasonEnd for the manager): st.recap
interface RecapRow { pos: number; id: ClubId; pts: number; gd: number; me: boolean }
interface PlayerRecap {
  year: number; rec: SeasonRecord; club: ClubId; lg: string; tier: number; pos: number; n: number; nat: NationCode;
  /** [at season start, now] */
  ovr: number[]; fame: number[]; money: number[];
  table: RecapRow[]; champion: ClubId; scorer: AwardShort; pots: AwardShort; bdo: AwardShort[]; myBdo?: number | null; boot: AwardShort | null;
  lgG: number; eu: Dict<string>; tours: NtRollEntry[]; best: MatchRow | null; role: RoleKey;
}

/** options of the balancing simulations (js/debug.js) */
interface DebugOpts {
  nat?: NationCode; role?: RoleKey; pos?: string; seed?: number; plan?: { focus?: string; intensity?: number };
  at?: number; retireAge?: number; stopAge?: number; verbose?: boolean; n?: number; [k: string]: any;
}
/** the manager's end-of-season recap (G.mgr.seasonEnd) */
interface MgrRecap {
  mgr: number; year: number; rec: MgrSeason; club: ClubId; pos: number; n: number; tgt: number; obj: string; won: string[];
  /** reputation [before, after] */
  rep: number[]; conf: number; lg: string; champion: ClubId; bdo: AwardShort[]; sacked?: number; last?: number;
}

// ---- Career charts (js/ui-stats.js)
/** a line of the overall chart: points [season label, value]; dash = dashed line */
interface ChartSeries { name: string; color: string; pts: [string, number][]; dash?: number }
interface BarRow { label: string; g: number; a: number }
