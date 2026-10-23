// Types for js/player.js, js/life.js, js/captain.js, js/match.js, js/season.js and js/main.js (checker only, see types/game.d.ts)

/** The creation form of a career (G.game.newCareer, G.player.create): goat 1-2 is the "GOAT" difficulty */
interface CareerOpts { name: string; nat: NationCode; role: RoleKey; foot: string; start?: string; seed?: number; goat?: number }

interface Player {
  /** the role before the last role change (js/events-data3.js) */
  roleFrom?: RoleKey;
}

/** What a played block adds up to (G.season.summary); season = the season record when the block closed it */
interface BlockSum {
  block: number; ovrBefore: number; ovrAfter: number; injury: number; partial: boolean;
  apps: number; goals: number; assists: number; avg: number; matches: number; minShare: number;
  rows: MatchRow[]; pStart: number; season?: SeasonRecord;
}

/** A club competition as the match engine sees it: league matches count for the league stats; final 1 = a domestic cup final */
interface MatchComp { name: string; lg: boolean; final?: number }

/** The main player's part in one match (G.match.mainPart); mom = the decisive moment he played in it */
interface MatchPart { mins: number; start: boolean; injured?: boolean; mom?: MomentOutcome }

/** A side on the pitch (G.match.side, G.mgrTeam.side): who plays, its strength, the bench players who come on; gl = goals per player */
interface MatchSide { ids: PlayerId[]; main: boolean; str: number; avg: number; cameOn: PlayerId[]; gl?: number[] }

/** A decisive moment as it went (G.moments.resolve): the option taken, its outcome, the goal or assist it gave, the minute */
interface MomentOutcome { ok: boolean; why: string; opt: string; g: number; a: number; bonus: number; min: number; before: number[]; opp: string; txt?: string }

/** The creation form of a manager-only career (G.game.newManager): bg = a key of G.mgr.BG */
interface MgrCareerOpts { name: string; nat: NationCode; bg?: string; age?: number; seed?: number }

/** option of a decisive moment: [label, attributes, chance shift, kind (goal/assist/stop), text if it works, text if not, risk, counter] */
type MomentOpt = [string, AttrKey[], number, string, string, string, number?, number?];
/** a decisive moment situation (js/moments.js); gk = goalkeeper's penalty, where the scouts' tip matters */
interface Moment { id: string; r: RoleKey[]; t: string; d: string; gk?: number; o: MomentOpt[] }
