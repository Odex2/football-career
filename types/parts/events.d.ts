// Types for js/events.js, js/events-data*.js, js/press*.js, js/events-mgr.js, js/transfers.js, js/contracts.js
// (checker only, see types/game.d.ts). Cards are plain data, so typing them checks every effect key and condition field.

/** Effects of an answer (G.events.effects): morale, coach relation, fame, fans, money k€, form, matches out,
 *  attributes ('any' = a random one of the role), and special actions. p = chance of ok, else ko */
interface EventFx {
  mo?: number; rel?: number; fa?: number; fn?: number; $?: number; fo?: number; inj?: number;
  at?: Dict<number>;
  req?: number; vis?: number; promise?: number; renew?: number; buy?: string; agent?: number; dropAgent?: number;
  /** 'KSA' | 'USA' | 'HOME' | 'COACH' */
  offer?: string;
  role?: number;
  /** leaves a mark in st.flags for a follow-up card (js/events-data3.js) */
  mark?: string;
  p?: number; ok?: EventFx; ko?: EventFx;
  /** press answers: a promise checked at the end of the block (js/press.js) */
  bet?: PressBetDef;
}

/** [label, effects, result text, result text when p fails] */
type EventOpt = [string, EventFx?, string?, string?];

/** A card of G.events.cards or G.press.cards: weight, condition on the context, title, text, options */
interface EventDef {
  id: string;
  w?: number | ((X: EvCtx) => number);
  c: (X: EvCtx) => unknown;
  t: string;
  d: string;
  o: EventOpt[];
  once?: number;
  /** drawn before any other card when its condition holds */
  force?: number;
  /** the st.flags mark this card consumes */
  clear?: string;
  /** press cards: the number promised, shown as {betN} */
  n?: (X: EvCtx) => number;
}

/** A press promise as a card defines it: k = goals | ga | avg | derby | pos | wins; n overrides the card's number */
interface PressBetDef { k: string; ok?: EventFx; ko?: EventFx; n?: number | ((X: EvCtx) => number) }

/** The promise being checked (st.bet) */
interface PressBet { k: string; n: number; ok: EventFx; ko: EventFx; b: number; year: number; t: string }

/** A role change the coach can propose (G.events.roleSwap) */
interface RoleSwap { to: RoleKey; ovr: number; ch: number; now: number }

/** What card conditions and texts see (G.events.ctx + G.events.stats) */
interface EvCtx {
  st: State; p: Player; W: World; club: Club; L: LeagueInfo; co: Coach | null;
  rel: number; b: number; age: number; fame: number; money: number; ovr: number; form: number; morale: number;
  /** the last block played (an empty object before the first one) */
  last: BlockSum;
  minShare: number; avg: number; goalsS: number; appsS: number; pos: number; n: number; tier: number; big: boolean;
  euro: string[]; riv: Club | null; loan: boolean; flags: CareerFlags; seasons: number; atClub: number;
  abroad: boolean; att: boolean; def: boolean;
  lgG: number; lgA: number; lgApps: number; lastApps: number; lastG: number; lastMatches: number; minPct: number;
  /** the last n matches played all satisfy f */
  recent: (n: number, f: (r: MatchRow) => unknown) => boolean;
  dry: number; scorerRank: number; leaderG: number; bdoRank: number; teamBest: number;
  cupAlive: boolean; euAlive: boolean; ptsGap: number;
  /** set by some conditions and by the press room */
  swap?: RoleSwap | null; derbyClub?: Club | null; derbyName?: string; betN?: number;
}

interface State {
  bet?: PressBet | null;
}
interface Player {
  /** press promises kept and broken */
  press?: { kept: number; broken: number };
}

/** Effects of a manager card (G.mgrEv.effects): board confidence, squad morale, reputation, fans, your money k€,
 *  club budget M€, +overall to the best academy kid, heir = bring your heir to the club; p = chance of ok, else ko */
interface MgrFx { conf?: number; mo?: number; rep?: number; fn?: number; $?: number; bud?: number; young?: number; heir?: number; p?: number; ok?: MgrFx; ko?: MgrFx }

/** A manager card (G.mgrEv.cards): [label, effects, result text, result text when p fails] per option */
interface MgrEventDef { id: string; w: number; once?: number; c: (X: MgrEvCtx) => unknown; t: string; d: string; o: [string, MgrFx, string, string?][] }

/** What manager cards see (G.mgrEv.ctx) */
interface MgrEvCtx {
  st: State; m: Mgr; W: World; club: Club; b: number; coach: boolean; ds: boolean; pos: number; n: number;
  conf: number; morale: number;
  /** best player, best academy kid (19 or less), an old coach of yours in the league, your heir if he plays */
  star: Npc; kid: Npc; old: Coach; heir: Npc | null; rich: boolean;
}

interface Offer {
  /** the buyer was asked to pay the clause (G.contracts.payClause); the agent negotiated it (G.transfers.agentDeal) */
  tried?: number;
  agent?: number;
}

/** The role an AI club wants to strengthen and the overall range it looks in (G.transfers.need) */
interface MarketNeed { r: RoleKey; lo: number; hi: number; gap: number; depth?: number }
