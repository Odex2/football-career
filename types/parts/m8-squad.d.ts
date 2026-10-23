// M8 phase B: the manager's squad (js/mgr-squad.js)

/** Fondamentale, Importante, Rotazione, Riserva, Promessa */
type SquadRole = 'cru' | 'imp' | 'rot' | 'ris' | 'pro';
/** a player's request: more playing time or a move; b = the block at whose end it was made */
interface PlayerRequest { id: PlayerId; k: 'spazio' | 'via'; b: number }
/** "Promise" is taken by JavaScript: the role promised, checked at the end of block b of season y */
interface RolePromise { to: SquadRole; y: number; b: number }
interface Mgr {
  /** squad role, morale 0..100, the last 5 rating gaps, matches out injured, captain */
  sr?: { [id: number]: SquadRole }; pm?: { [id: number]: number }; fm?: { [id: number]: number[] };
  inj?: { [id: number]: number }; cap?: PlayerId | null;
  /** starts in the block and club matches in the block */
  bs?: { [id: number]: number }; bp?: number;
  req?: PlayerRequest[]; promise?: { [id: number]: RolePromise };
  /** players put on the market (sold in phase D) */
  list?: { [id: number]: number };
}
/** the managed side: every starter's rating and its gap from what was expected */
interface MatchSide { rt?: number[]; rx?: number[] }
/** the managed club's ratings and its man of the match */
interface MatchRow { rt?: number[]; mom?: { n: string; r: number } }
