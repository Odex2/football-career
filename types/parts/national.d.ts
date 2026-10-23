// Types for js/national-data.js, js/national.js, js/tournament.js, js/europe.js, js/awards.js (checker only, see types/game.d.ts)

/** A national team in G.NT: name and flag first (G.DATA.ntNames), then confederation and base strength (G.DATA.ntTeams, every team) */
interface NtTeam { id: NationCode; name: string; flag: string; conf?: string; base?: number }

/** G.national._c: real players by nation and role (best first), with the strengths and XIs worked out from them */
interface NtCache { key: string; W: World; pool: Dict<Dict<PlayerId[]>>; str: Dict<number>; xi: Dict<PlayerId[]> }

/** The main player's part in a national match: minutes, and whether he started */
interface NtPlay { mins: number; start?: boolean }

/** A national match's competition: the name on the match row; neutral (tournaments) cancels the home advantage */
interface NtComp { name: string; neutral?: number }

/** Leaderboard entry (G.awards.entries): an NPC, or the main player (id 'me', me 1) */
interface AwardEntry {
  id: PlayerId | 'me';
  n: string;
  nt: NationCode;
  r: RoleKey;
  club: ClubId;
  apps: number;
  g: number;
  a: number;
  cs: number;
  avg: number;
  o: number;
  me?: number;
  /** Ballon d'Or score (G.awards.bdo) */
  score?: number;
}

/** An entry as the roll of honour keeps it (club name instead of id) */
interface AwardShort { id: PlayerId | 'me'; n: string; club: string; g: number; a: number; cs: number; avg: number; me: number; pts?: number; score?: number }

/** One season of st.roll (G.awards.season): league awards, champions, European winners, Ballon d'Or top 10, Golden Shoe */
interface AwardRoll {
  year: number;
  lg: Dict<{ scorer: AwardShort; assist: AwardShort; gk: AwardShort; pots: AwardShort }>;
  champs: Dict<string>;
  eu: Dict<string>;
  bdo: AwardShort[];
  boot: AwardShort | null;
  myBdo?: number | null;
}

interface Season {
  /** Ballon d'Or bonus from the summer tournaments: entry id (NPC id or 'me') -> points */
  ntBonus?: Dict<number>;
}

/** G.DATA (an untyped literal in js/names.js) with the two strings js/national-data.js adds to it */
type NtDataHost = typeof G.DATA & { ntTeams: string; ntNames: string };

/** One finished national-team tournament in st.ntRoll (newest first) */
interface NtRollEntry {
  year: number; key: string; n: string; winner: NationCode; runner: NationCode;
  scorer: { n: string; nt: NationCode; g: number; me: boolean } | null;
  /** how far the player's nation went, when it took part */
  mine: string | null;
}
