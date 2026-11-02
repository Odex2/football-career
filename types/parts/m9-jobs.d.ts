// M9 snapshot S2 (phase M10): the coaches' market (js/mgr-jobs.js, js/ui-mgr-jobs.js)

/** an open bench: from and until are days (G.mgrJobs.now), co the coach the club picked; app = the manager applied with this chance; held = kept
 *  open while the club waits for the manager's answer */
interface Vacancy { club: ClubId; from: number; until: number; co: CoachId; app?: number; held?: number }
/** the manager's contract: years left, wage k€ a week; free = he let the renewal go */
interface MgrContract { years: number; wage: number; free?: number }
interface Mgr {
  contract?: MgrContract;
  /** the renewal the board offers, waiting for an answer */
  renew?: { years: number; wage: number };
  /** days without a job, and the day they were last counted */
  idle?: number; idleAt?: number;
}
/** int = the club's interest; until = the day the offer ends (mid-season); rel = the current club lets him go
 *  ('free'), for a fee in M€ ('fee') or not ('no') */
interface MgrOffer { int?: number; until?: number; rel?: string; fee?: number }
interface State { vac?: Vacancy[] }
interface MgrRecap { /** the contract ended: the manager is free (M9 S2) */ free?: number }
