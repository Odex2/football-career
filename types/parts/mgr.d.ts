// Manager career: starting profiles, the lineup screen, the market (js/mgr*.js)

/** starting profile of a manager-only career (G.mgr.BG) */
interface MgrBg { n: string; d: string; rep: number; fame: number; love?: number; youthX?: number }

/** a formation of G.mgrTeam.FORMS: players per role, goal modifiers, description */
interface Formation { s: Dict<number>; atk: number; def: number; d: string }

/** the managed club's side carries its own XI */
interface MatchSide { mgr?: number }
