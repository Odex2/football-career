// M8 phase D: the FIFA-style market (js/mgr-deal.js, js/mgr-deal-out.js, js/ui-mgr-deal.js)

/** a search: role ('' = all), maximum age (0 = any), maximum price in % of the budget (0 = any), only high
 * potential, only contracts running out, nation of the club ('' = any) */
interface DealFilter { r: RoleKey | ''; age: number; price: number; pot: boolean; exp: boolean; nat: NationCode | '' }
/** an offer of another club for one of our players */
interface IncomingBid { id: PlayerId; by: ClubId; fee: number }
/** a loan: to = the club that has the player now (pl.ln is the club that owns him); opt = the fee to buy a player
 * we took on loan, kept from the end of the season to the end of the summer window */
interface LoanOut { to: ClubId; y: number; opt?: number }
/** the negotiation on the Trattativa tab: with the club ('club', or 'counter' at the fee it asks), then with the
 * player ('player': wage choice wk 0..2, the promised role sr, the years; want = the role he would get); loan = a loan
 * with an option to buy */
interface Deal { id: PlayerId; step: 'club' | 'counter' | 'player'; fee: number; loan?: number; wk?: number; sr?: SquadRole; yrs?: number; want?: SquadRole }
interface Mgr {
  /** reported players, failed negotiations ('ko', 'rin' a renewal turned down) and bids: all of this window */
  rep2?: { [id: number]: number }; neg?: { [id: number]: string }; bids?: IncomingBid[];
  loans?: { [id: number]: LoanOut }; split?: number; wageRoom?: number; deal?: Deal | null;
}
interface Npc { ln?: ClubId }
