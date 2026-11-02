// M9 snapshot S5 (phase P): the player's positions (js/positions.js)

interface Player {
  /** the position he plays and his main one (the role of the engine is p.role, always the role of p.pos) */
  pos?: string; main?: string;
  /** familiarity per position 0..100, the last year he started in each one, seasons at 100 in a new position */
  fam?: Dict<number>; famY?: Dict<number>; famS?: number;
  /** his last request to the coach: year, block, requests this season */
  posAsk?: { y: number; b: number; n: number };
}
/** a new career can choose a position instead of a role */
interface CareerOpts { pos?: string }
/** the coach's proposal is a position (M9 S5) */
interface RoleSwap { pos?: string }
/** a defender's clean sheets (DC, TD, TS, MED), for the awards */
interface SeasonStats { csd?: number }
interface AwardEntry { def?: number }
/** the position he played that season */
interface SeasonRecord { posK?: string }
/** the position, in the Hall of Fame (entries from S5 on) */
interface HofEntry { pos?: string }
