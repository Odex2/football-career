// M9 snapshot S4 (phase M11): the board's pact, the expectations, the president, the requests
// (js/mgr-pact.js, js/mgr-asks.js, js/ui-mgr-society.js)

/** the president: character, year he came, the year a patron who bought the club leaves (to); exp = the expectations
 *  (positions the board adds to the league goal, −2..+4). Both only for a club the manager coached */
interface Club { pres?: { k: string; y: number; to?: number }; exp?: number }
/** the pact of a season: level, extra budget (M€), advance on next year's and the president's part, positions of the
 *  league goal, year, confidence given at once (cf), still open until the first match */
interface MgrPact { lvl: string; bud: number; adv: number; pres: number; sh: number; y: number; cf: number; open: number }
/** where the budget of the season came from (M€): left from last year, revenue, prizes, the rest (wage room), the
 *  advance given back, the floor, the pact's advance and the president's money */
interface MgrFin { y?: number; tot?: number; carry?: number; rev?: number; prize?: number; room?: number; repay?: number; floor?: number; pact?: number; pres?: number }
/** a request of the board: sell, keep a legend (flag), play a boy; due = the block it ends, acc = accepted, base = the
 *  sales or starts when it was made */
interface BoardAsk { k: string; id?: PlayerId; y?: number; due?: number; acc?: number; base?: number }
interface Mgr {
  pact?: MgrPact | null; repay?: number; fin?: MgrFin; confH?: number[]; next?: string;
  /** the manager's requests; grace = blocks of a last chance; time = clubs where he asked for it; inv = the academy's investment this season */
  asks?: { k: string; y: number; b: number; ok: number }[]; breq?: BoardAsk | null; grace?: number; time?: ClubId[]; inv?: number;
  /** players sold since the job began; seasons of Ricostruzione in a row */
  sales?: number; rebN?: number;
}
/** the pact the offer comes with (the interview's answer on the market) */
interface MgrOffer { pact?: string }
/** a level of the pact (G.CFG2.PACT.LV) */
interface PactLevel { bud: number; sh: number; cup: number; conf: number; loss: number; push: number; need: number; top?: number }
/** the pact the club offers after the interview */
interface Vacancy { pact?: string }
