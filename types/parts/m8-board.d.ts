// M8 phases F and G: the board, the assistant (its contracts are used from phase D), the Hall of Fame, the save slots

type BoardState = 'ok' | 'mid' | 'ko';
/** a goal of the board: category, text, importance, state now (run = it can still change); to = the round of the
 * cup (clubs left) or the European stage to reach, at = the smallest round of the cup the club played, c = the
 * European competition, lim = the wage bill allowed (M€), out = the -4 for an early exit already taken */
interface BoardGoal { k: 'lg' | 'cup' | 'eu' | 'fin' | 'yth'; txt: string; imp: 'alta' | 'media' | 'bassa'; st: BoardState; run?: number; to?: number; at?: number; c?: string; lim?: number; out?: number }
/** what the assistant does by itself: renew contracts, deal on the market, look after the academy */
interface Assistant { contracts: 0 | 1; market: 0 | 1; youth: 0 | 1 }
/** games: the matches on the bench in the whole career */
interface Mgr { goals?: BoardGoal[]; nt?: NationCode | null; ntOffer?: NationCode | null; assist?: Assistant; games?: number }
interface MgrRecap { goals?: BoardGoal[]; score?: number }
/** the Hall of Fame of players or of managers (old entries have none: a manager-only career if mgr.only) */
interface HofEntry { t?: 'pl' | 'mgr' }
/** the clubs coached and the matches on the bench (entries saved from phase G) */
interface HofMgr { clubs?: string[]; games?: number }
/** a save slot on the start screen (G.save.info): who, where, which season, finished or not */
interface SaveSlot { name: string; club: string; year: number; mgr: boolean; over: boolean }
