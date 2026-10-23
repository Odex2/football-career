// M8 phase J: the match calendar. Dates are days counted from the first day of the
// season (day 0, a Saturday in August).

/** the dates of one European competition */
interface EuroCal {
  /** league phase matchdays (Champions League: a Tuesday, half the matches on Wednesday) */
  lp: number[];
  /** knockout rounds: [first leg, second leg] */
  po: number[]; r16: number[]; qf: number[]; sf: number[];
  /** the final, one date */
  f: number;
}

/** the season's calendar, built by G.cal.build at the start of the season */
interface SeasonCal {
  /** day 0 as 'YYYY-MM-DD' */
  d0: string;
  /** first and last day of blocks 0-4 */
  bl: number[][];
  /** per league, the date of each matchday (a Saturday is split with the Sunday) */
  lg: Dict<number[]>;
  /** per league, the matches moved away from their matchday: { 'matchday:homeId': date } */
  mv: Dict<Dict<number>>;
  /** per national cup, the date of each round (a Tuesday is split with the Wednesday; the final is one date) */
  cup: Dict<number[]>;
  eu: Dict<EuroCal>;
  /** first day of the two national team breaks (9 days each) */
  nt: number[];
}

/** one match of a club in the calendar, played (res) or to play */
interface CalEntry {
  d: number;
  /** 'lg', a nation's code for its cup, 'UCL' / 'UEL' / 'UECL', 'nt' for the national team, 'brk' for a break */
  ck: string;
  /** null: not drawn yet */
  opp: ClubId | NationCode | null;
  home: boolean | null;
  /** the competition's name */
  name: string;
  /** round or phase */
  rd?: string;
  /** league matchday */
  md?: number;
  /** European knockout: first (1) or second (2) leg */
  leg?: number;
  /** the date it was moved from */
  moved?: number;
  /** played: [our goals, theirs] */
  res?: number[];
  row?: MatchRow;
}

/** why a match counts (G.season.importance) */
interface Importance { why: string; tag: string }

interface Season {
  cal?: SeasonCal;
  /** the date being played (rows take it as dt) */
  today?: number;
}
/** cup ties of the current round: [home, away, winner]; a bye is [id, -1, id] */
interface CupState { ties?: number[][] }
/** European knockout: first-leg goals of each tie, [a, b] */
interface EuroComp { leg?: number[][] }
/** the dates of the block, played one by one (a calendar season) */
interface BlockInProgress { days?: number[] }
interface MatchRow { dt?: number }
/** a match a club still has to play, for the clash check: date, competition, key of a league match */
interface CalBusy { d: number; lab: string; k: string }
