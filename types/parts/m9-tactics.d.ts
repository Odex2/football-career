// M9 snapshot S6 (phase M1): the tactic's levers (js/mgr-tactics.js)

/** pressing, build-up, defensive line: 0 low/short, 1 medium, 2 high/long */
interface TacLevers { press: number; build: number; line: number; [k: string]: number }
/** an AI club's style: its levers, and fast forwards (1) */
interface TacStyle extends TacLevers { fast: number }
interface Mgr {
  /** the levers, tactical familiarity 0..100, the system of the last match and that match */
  lev?: TacLevers; tfam?: number; tsys?: string; tkey?: string;
}
/** the interview's "Che calcio vuoi fare?": the levers at the signing */
interface MgrOffer { play?: string }
interface Vacancy { play?: string }
