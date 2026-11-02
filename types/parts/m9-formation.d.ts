// M9 snapshot S1 (phase M12): the formation tab (js/ui-pitch-edit.js)

interface Mgr {
  /** the first substitutes picked by the manager (manual XI only; club order otherwise) */
  bench?: PlayerId[];
  /** 1 = do not ask again before the first manual change */
  askManual?: number;
}
/** a formation that ↩ Annulla can bring back (G.ui.sel.undo, in memory only) */
interface FormSnap { xi: XiSlot[] | null; xiForm?: string; form: string; mode: string; bench?: PlayerId[] }
/** a move waiting for the manager's yes: swap slots a and b, or bench player b into slot a, or a new first sub */
interface PitchAsk { kind: 'swap' | 'in' | 'first'; a: number; b: number; t: string; manual: boolean }
interface PitchCard {
  /** how well the player fits the slot he stands in: 'g', 'y', 'o', 'r' (the card's border) */
  fit?: string;
  /** out of position: his overall, shown struck through under the number */
  was?: number;
  /** fitness under the rest threshold */
  tired?: boolean;
  /** bench rows: 'first' substitutes, 'bench', 'out' (injured) */
  grp?: string;
  /** the card can be dragged (computer only) */
  drag?: boolean;
}
/** the turnover's counters (js/mgr-rotate.js), kept while the switch is on: starts in a row, matches since the last start */
interface MgrRotation { run: { [id: number]: number }; idle: { [id: number]: number }; easy: number }
interface Mgr { rot?: MgrRotation }
/** 🔄 Turnover: off when missing */
interface Assistant { rotate?: 0 | 1 }
/** the managed side: how much the match mattered for the turnover ('big', 'easy', 'normal'), when it was on */
interface MatchSide { rw?: string }
