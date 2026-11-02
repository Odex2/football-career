// Manager career: starting profiles, the lineup screen, the market (js/mgr*.js)

/** starting profile of a manager-only career (G.mgr.BG) */
interface MgrBg { n: string; d: string; rep: number; fame: number; love?: number; youthX?: number }

/** a formation of G.mgrTeam.FORMS: players per role, goal modifiers, description */
interface Formation { s: Dict<number>; atk: number; def: number; d: string }

/** the managed club's side carries its own XI */
interface MatchSide { mgr?: number }

/** The manager while he holds a job (G.mgr.active): G.mgr.take and G.mgr.migrate fill these fields, so the
 *  functions of the job read them through G.mgr.job(st) without checks */
interface MgrJob extends Mgr {
  club: ClubId; conf: number; pat: number; morale: number; buys: number; played: number; obj: MgrObjective;
  cond: { [player: number]: number }; starts: { [player: number]: number };
  sr: { [id: number]: SquadRole }; pm: { [id: number]: number }; fm: { [id: number]: number[] };
  inj: { [id: number]: number }; bs: { [id: number]: number }; bp: number; cap: PlayerId | null;
  req: PlayerRequest[]; promise: { [id: number]: RolePromise }; list: { [id: number]: number };
  rep2: { [id: number]: number }; neg: { [id: number]: string }; bids: IncomingBid[]; loans: { [id: number]: LoanOut };
  split: number; wageRoom: number; deal: Deal | null; assist: Assistant;
  ys: YouthScout[]; yth: YouthProspect[]; dev: { [id: number]: RoleRetrain }; train: Training;
}
