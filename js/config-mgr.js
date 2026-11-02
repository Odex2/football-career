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

// The formation tab (M9 S1, js/ui-pitch-edit.js): a move that costs more than BAD points of Forza XI asks first;
// UNDO formations can be undone; starters under LOW_COND % of fitness are flagged in a manual XI
G.CFG2.PITCH_EDIT = { BAD: 3, UNDO: 5, LOW_COND: 60 };

// The assistant's turnover (M9 S1, js/mgr-rotate.js), with the automatic XI only. Big matches (finals, BIG_EU rounds
// in Europe, a rival, a side within NEAR places or as strong as us) keep the best XI; easy ones are a side EASY_GAP
// or more weaker, or the national cup before LATE_CUP. A starter under COND rests for a bench player of his role
// within SUB_GAP of overall; in easy matches also who started RUN in a row, a reserve idle for IDLE matches plays,
// and a boy up to YOUNG_AGE with potential at the club's strength plays one in two. At most MAX changes, at most
// DROP points of Forza XI lost; the goalkeeper changes only in the national cup. A starter at FULL fitness plays (the
// rules on starts in a row, idle reserves and boys skip him) unless one of the next AHEAD matches is big and he
// would reach it tired (under MGR_TEAM.COND_OK, where fitness starts to cost): then at most SAVE of them rest
G.CFG2.ROTATE = {
  BIG_EU: ['Ottavi', 'Quarti', 'Semifinali', 'Finale'], LATE_CUP: ['Quarti', 'Semifinali', 'Finale'], NEAR: 3, EASY_GAP: 6,
  SUB_GAP: 6, RUN: 3, IDLE: 4, YOUNG_AGE: 21, FULL: 90, AHEAD: 2, SAVE: 2,
  EASY: { COND: 80, MAX: 5, DROP: 5 }, NORMAL: { COND: 70, MAX: 3, DROP: 2 }
};

// The coaches' market (M9 S2, js/mgr-jobs.js). Interest of a club, 0..100: BASE + REP per point of reputation over the
// club's, over the last HIST seasons GOAL for an objective reached, ABOVE for a place better than it, TROPHY per trophy
// (2 at most), FANS per point of the fans' love (FANS_MAX at most), FLAG for a flag player, −TRAITOR for a traitor,
// NAT for a club of his nation. A club calls at the end of the season from CALL (bigger, or within CALL_REP of
// reputation with more money). A bench stays free VAC_DAYS; an offer lasts MID_DAYS; the chance of being picked is
// 0.5 + (interest − best free coach) / CHANCE_DIV within CHANCE; rejected, the own club's trust drops APPLY_CONF.
// RELEASE: the chances that the club lets him go for free or for a fee (WEEKS of wage per year left), else it refuses.
// Contract: YEARS (one more from LONG_REP), RENEW_UP more wage on a renewal, ASK_P to get ASK_UP more, CONF_KEEP the
// trust to stay one more year at the end; sacked, PAYOUT of the money left. Resigning costs RESIGN_REP of reputation
// (RESIGN_REP_OK if the season was going well) and RESIGN_FANS of love. Without a job −1 of reputation every IDLE_DAYS;
// ⏩ waits WAIT_DAYS (at most WAIT_STEPS match days); the simulation takes the best offer after AUTO_DAYS
G.CFG2.MGR_JOBS = {
  BASE: 55, REP: 4, HIST: 3, GOAL: 4, ABOVE: 2, TROPHY: 3, FANS: 0.2, FANS_MAX: 10, FLAG: 10, TRAITOR: 40, NAT: 3,
  CALL: 60, CALL_REP: 3, VAC_DAYS: 7, MID_DAYS: 3, NEWS_REP: 70, CHANCE_DIV: 40, CHANCE: [0.05, 0.95], APPLY_CONF: 3,
  RELEASE: [0.5, 0.3], WEEKS: 40, YEARS: 2, LONG_REP: 75, RENEW_UP: 0.15, ASK_P: 0.5, ASK_UP: 0.15, CONF_KEEP: 25, PAYOUT: 0.5,
  RESIGN_REP: 2, RESIGN_REP_OK: 5, RESIGN_FANS: 5, IDLE_DAYS: 90, NEW_YEAR_DAYS: 30, WAIT_DAYS: 7, WAIT_STEPS: 12, AUTO_DAYS: 30, AUTO_WAITS: 8,
  IDT: 4  // M9 S3: interest per point of the manager's fit with the club's identity (G.mgrId.fit, −2..+2)
};

// The managed club's floor for the market (M9, fix after S2): when the manager signs and every summer its budget is at
// least REV of the revenue (with one decimal: rounding to whole M€ left small clubs at 0) and ABS M€ by tier (first,
// second division); its wage room is enough for ROOM wages of a player at its level (strength −2 to + LEVEL)
G.CFG2.MGR_FLOOR = { REV: 0.3, ABS: [3, 2], LEVEL: 3, ROOM: 2 };

// The club's identity (M9 S3, js/mgr-identity.js): patience +PAT[0] when respected in a season, −PAT[1] when betrayed,
// within PAT_LIM; fans +FANS; a big signing is BIG over the squad's strength; a home-grown player is OWN_AGE or less
// (or promoted by the club), and selling one costs a club of Bandiere FLAG_PAT; the interview comes with interest TALK
// or more, every answer adds IV[0] to the chance when right and takes IV[1] when wrong
G.CFG2.MGR_ID = { PAT: [8, 8], PAT_LIM: [-30, 40], FANS: 4, BIG: 2, OWN_AGE: 21, FLAG_PAT: 5, TALK: 50, IV: [0.08, 0.05] };

// The player's positions (M9 S5, js/positions.js): the overall loses FAM per point of familiarity under 100 and SIDE on
// the side of the weaker foot; a new player has 1 or 2 neighbours at FAM0; START a match started there, LEARN a block of
// the focus "Imparare la posizione"; a position not played for UNUSED seasons drops DROP a season down to MIN; the old
// main position stays at OLD. ASK: the coach's yes = BASE + gain in start chance × NEED + relationship × REL + overall
// gained × OVR − AGAIN for each request already made this season, within P; a no costs NO of relationship (× requests).
// GOAL: the season goal of each position [kind, per season as a starter, at least]
G.CFG2.POS = {
  FAM: 0.12, SIDE: 1, FAM0: [55, 75], START: 2, LEARN: 6, UNUSED: 2, DROP: 5, MIN: 50, OLD: 90, LEARN_GROW: 0.5,
  ASK: { BASE: 0.35, NEED: 0.8, REL: 0.005, OVR: 0.03, AGAIN: 0.15, P: [0.05, 0.9], NO: 3 },
  /** @type {Dict<[string, number, number]>} */
  GOAL: { PP: ['goals', 14, 6], SP: ['assists', 8, 3], ALA: ['goals', 9, 3], ED: ['goals', 7, 3], ES: ['goals', 7, 3], TRQ: ['goals', 7, 3], REG: ['assists', 7, 3], CC: ['assists', 6, 3] }
};

// The board's pact, the expectations, the president and the requests (M9 S4, js/mgr-pact.js, js/mgr-asks.js).
// LV per level: bud = budget ±, sh = positions of the league goal (+ harder), cup = rounds of cup and Europe (+ later),
// conf = confidence at once, loss = weight of a bad table, push = expectations next year, top = at least that place,
// need = confidence needed (−AMB_EASY with an ambitious president); REWARD = [confidence, reputation, fans] when an
// ambitious pact is reached; ADV = share of the extra budget lent on next year's; EXP = limits, KEEP and GAP of the
// yearly update, TROPHY per trophy, RELEG after a relegation; OWN_P the chance of a new owner (×OWN_RED in the red),
// MEC_YEARS of patron; PRES = what each president adds: share of his half of the extra, chance of requests, patience
G.CFG2.PACT = {
  /** @type {Dict<PactLevel>} */
  LV: {
    reb: { bud: -0.3, sh: -2, cup: -1, conf: 10, loss: 1, push: -0.5, need: 0 },
    norm: { bud: 0, sh: 0, cup: 0, conf: 0, loss: 1, push: 0, need: 0 },
    amb: { bud: 0.3, sh: 1, cup: 1, conf: 0, loss: 1.25, push: 1, need: 50 },
    all: { bud: 0.6, sh: 2, cup: 1, conf: 0, loss: 1.5, push: 2, need: 70, top: 3 }
  },
  // Ricostruzione in a row: the cut grows STEP a year up to MAX, a bad table weighs LOSS more a year; the goal is never
  // more than EASE places easier than today's
  REB: { STEP: 0.15, MAX: 0.6, LOSS: 0.25 }, EASE: 3,
  LOW: 30, AMB_EASY: 15, REWARD: /** @type {Dict<number[]>} */ ({ amb: [8, 1, 4], all: [15, 2, 8] }), ADV: 0.5,
  EXP: [-2, 4], KEEP: 0.6, GAP: 0.3, TROPHY: 0.5, RELEG: -1,
  OWN_P: 0.02, OWN_RED: 4, MEC_YEARS: 3, FAN_CONF: 25, AMB_PRES: 1.2,
  /** @type {Dict<{ half: number, ask: number, pat: number }>} */
  PRES: { amb: { half: 1, ask: 0.05, pat: 0 }, pat: { half: 0.4, ask: 0, pat: 10 }, acc: { half: 0, ask: -0.15, pat: 0 }, fan: { half: 0.7, ask: 0, pat: 0 }, mec: { half: 1, ask: 0.15, pat: 0 } },
  // the requests: chance = BASE + (confidence − 50) / DIV + the president's; costs and effects
  ASK: { BASE: 0.5, DIV: 100, P: [0.1, 0.9], BUD: 0.15, BUD_CONF: [5, 2], WAGE: 0.15, WAGE_CONF: [3, 1], GOAL_CONF: 6, TIME: 25, TIME_BLOCKS: 2,
    YTH: 1.25, YTH_COST: 0.05, OK: 2, NO: 4, FAIL: 6, RED_WAGE: 1.3, PLAY: 3 }
};

// The three levers of the tactic (M9 S6, js/mgr-tactics.js): 0 low/short, 1 medium (the vice's, nothing changes), 2
// high/long. Each table is [our goals, goals we stop] against what the opponent does: PRESS against his build-up
// (short, mixed, long), BUILD against his pressing (low, medium, high), LONG_LOW more for a long ball against a low
// line, LINE against slow or fast forwards. CAP the most all levers move a side's goals; TIRE the condition lost with
// a high press. FAM: tactical familiarity grows GROW a match with the same system, loses LEVER per lever changed and
// FORM for a new formation; under LOW up to MAL of strength; START with a new club. STYLE: when an AI club's forwards
// are fast (the best 4 under FAST_AGE on average: 4 clubs in 10), its midfield good with the ball (the best 3 GOOD over its XI) and
// its centre-backs tall (TALL cm on average)
G.CFG2.TAC = {
  PRESS: [[[-0.02, 0], [-0.01, 0], [-0.01, 0.03]], [], [[0.04, 0.04], [0, 0], [0, -0.04]]],
  BUILD: [[[0.03, 0], [0.01, 0], [-0.04, -0.02]], [], [[-0.02, 0], [0, 0], [0.05, 0]]], LONG_LOW: -0.03,
  LINE: [[[-0.02, 0], [0, 0.03]], [], [[0.01, 0.03], [0, -0.06]]],
  CAP: 0.1, TIRE: 1.4,
  FAM: { GROW: 5, LEVER: 10, FORM: 25, LOW: 50, MAL: 0.5, START: 60 },
  STYLE: { FAST_AGE: 26.3, GOOD: 1.5, TALL: 187 }
};
