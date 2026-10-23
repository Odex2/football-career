// @ts-check
// Balancing numbers added by M8. G.CFG is closed for TypeScript (it is born full in
// config.js), so the new ones live in G.CFG2, which is born empty and filled one key at a time.

G.CFG2 = {};

// The first club of a career, drawn at random (G.game.startClub): weight exp(-(str - weakest) / T),
// x HOME at a club of one's own country (when its league is in the game), x FAR for faraway leagues.
// Below LUCKY odds the first news says how lucky the draw was: 1 in 10,000 is a club of strength ~77 or more,
// about 1 career in 1,000 (with 470 clubs almost every club has odds below 1%, so 0.01 would fire nearly always).
G.CFG2.START_CLUB = {
  T: 6, HOME: 3, LUCKY: 0.0001,
  /** @type {Dict<number>} */ FAR: { KSA: 0.3, USA: 0.6 }
};

// The match calendar (M8 phase J, js/calendar.js): REST free days between two matches of a club; the last
// LAST_FIXED matchdays of a league never move; a big match is against a club of reputation BIG_REP or more;
// the last LAST_MD matchdays can be decisive; NEXT rows in the "Prossime partite" card
G.CFG2.CAL = { REST: 2, LAST_FIXED: 2, BIG_REP: 85, LAST_MD: 3, NEXT: 5 };

// The manager's squad (M8 phase B, js/mgr-squad.js): SHARE = starts expected by squad role; PM* = a player's
// morale (PM0 when unknown, PM_K per point of share missed, at most PM_MAX per block, PM_RES per win minus loss,
// PM_REV back towards PM0; on the pitch (pm - PM_MID) / PM_DIV overall points; PM_TEAM what the 16 who play most
// give the squad's morale, again around PM_MID); REQ_AT = below it a player asks; TALK = chance a talk works;
// FORM_K/FORM_MAX = the form's effect; INJ* = injuries (chance per start, plus per fitness point under 75, short or
// long); CAP = the captain's effect, CAP_SWAP his morale.
// Tuned against the spec with tests/stats.js balance (16 careers each, all automatic). With the spec's numbers a
// winning squad's morale climbed to 85-90 and a losing one sank, and since morale counts on the pitch the strong got
// stronger (Inter +6 points a season) and the weak weaker (a Segunda club last every year). So morale now follows
// playing time more than results: PM_MAX [-20, 2] (a little gain for playing more than promised, a big loss for a
// key player left out), PM_RES 0.2, PM_REV 0.2; the pitch counts it around PM_MID 70, where starters sit, not 60;
// REQ_AT 35 (the 😠 face), so a key player left on the bench asks within two blocks (B8.2)
G.CFG2.MGR_SQ = {
  /** @type {Dict<number>} */ SHARE: { cru: 0.8, imp: 0.6, rot: 0.3, ris: 0.08, pro: 0.15 },
  PM0: 65, PM_K: 25, PM_MAX: [-20, 2], PM_RES: 0.2, PM_REV: 0.2, PM_MID: 70, PM_DIV: 25, PM_TEAM: 0.05,
  REQ_AT: 35, PROMISE_FAIL: -15, TALK: 0.5,
  FORM_K: 0.6, FORM_MAX: 0.5,
  INJ_BASE: 0.006, INJ_COND: 0.0006, INJ_SHORT: [1, 3], INJ_LONG: [4, 10], INJ_LONG_P: 0.2,
  CAP: 0.3, CAP_SWAP: 6
};

// Live matches of the manager (M8 phase C, js/mgr-live.js): HALF1 = share of the goals expected in the first half;
// at half time PUSH (all out attack) or PARK (sit back) add to [our attack, our defence]; the dressing-room talk
// works with chance TALK[0] + squad morale / TALK[1] and gives TALK_OK or TALK_KO strength for the second half and
// TALK_MO squad morale
G.CFG2.MGR_LIVE = { HALF1: 0.45, PUSH: [0.25, -0.2], PARK: [-0.2, 0.25], TALK: [0.35, 200], TALK_OK: 1.5, TALK_KO: -0.5, TALK_MO: [2, -3] };

// The FIFA-style market (M8 phase D, js/mgr-deal.js and js/mgr-deal-out.js): RESULTS of a search, REPORTS full
// reports a window; the potential is shown within POT_FOG (POT_SCOUTED once reported); offers to a club at FEE of
// the price, accepted with FEE_P (COUNTER_P: a counter-offer COUNTER_UP higher); the player takes WAGE of what he
// asks with WAGE_P, ROLE_UP / ROLE_DOWN for a role above or below what he would get, from BASE_P; BIDS for our
// players at every window (BID_LIST chance one goes to a listed player, at BID_FEE of his value, BID_COUNTER_P
// for a counter); RENEW_P a renewal; LOAN_MAX loans out that grow LOAN_GROW, LOAN_FEE of the price for a loan in;
// SPLIT the shares of budget moved to wages; the assistant (phase G) buys for a starter AUTO_GAP under the club's
// strength, trying at most AUTO_TRIES players
G.CFG2.MGR_DEAL = {
  RESULTS: 15, REPORTS: 4, POT_FOG: 5, POT_SCOUTED: 2,
  FEE: [0.9, 1, 1.15], FEE_P: [0.35, 0.7, 0.92], COUNTER_P: 0.6, COUNTER_UP: 0.15,
  WAGE: [0.9, 1, 1.1], WAGE_P: [-0.25, 0, 0.15], ROLE_UP: 0.15, ROLE_DOWN: -0.3, BASE_P: 0.75,
  BIDS: [0, 3], BID_LIST: 0.6, BID_FEE: [0.9, 1.3], BID_COUNTER_P: 0.5,
  RENEW_P: 0.8, LOAN_MAX: 4, LOAN_GROW: 1.5, LOAN_FEE: 0.1,
  SPLIT: [-20, -10, 0, 10, 20], AUTO_GAP: 5, AUTO_TRIES: 3
};

// The academy (M8 phase E, js/mgr-youth.js): up to SCOUTS youth scouts, a level costs LVL_COST M€ a season and
// gives LVL_O overall, LVL_POT potential and LVL_FOG of fog on it; a scout finds a boy with FIND_P every block,
// overall O0, potential POT plus (nation's base - 70) / NAT_POT; at most MAX boys, who grow GROW a season and at
// OUT_AGE are promoted or let go. A new role takes 100 points: DEV_RUN a block for who started DEV_SHARE of the
// matches, DEV_IDLE otherwise. TRAIN: what the training intensity does to recovery, growth and injuries
G.CFG2.MGR_YOUTH = {
  SCOUTS: 2, LVL_COST: [0.2, 0.5, 1], LVL_O: 3, LVL_FOG: [8, 5, 3], FIND_P: 0.5,
  O0: 38, POT: [62, 78], LVL_POT: 3, NAT_POT: 4, MAX: 8, GROW: [2, 5], OUT_AGE: 19,
  DEV_RUN: 25, DEV_IDLE: 10, DEV_SHARE: 0.3,
  /** @type {Dict<{ rest: number, grow: number, inj: number }>} */
  TRAIN: { leggero: { rest: 1.25, grow: 0.8, inj: 0.8 }, normale: { rest: 1, grow: 1, inj: 1 }, intenso: { rest: 0.8, grow: 1.3, inj: 1.3 } }
};
