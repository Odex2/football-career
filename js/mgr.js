// @ts-check
// Manager career: one job that joins coach and sporting director (lineup and tactic in js/mgr-team.js, market in
// js/mgr-market.js). It starts after the playing career or straight away (p.mgrOnly). The world keeps running on the
// same engine; st.mgr holds the job, the board's confidence, the squad's morale and the manager's reputation.

G.mgr = {};
/** @type {Dict<string>} */
G.mgr.ROLE = { mgr: 'Manager', coach: 'Allenatore', ds: 'Direttore sportivo' };  // old saves still show their role
/** @type {Dict<string>} */
G.mgr.TACTIC = { att: 'Offensiva', bal: 'Equilibrata', def: 'Difensiva' };
// Starting profiles of a manager-only career: reputation, fame and extras
/** @type {Dict<MgrBg>} */
G.mgr.BG = {
  prov: { n: 'Ex calciatore di provincia', d: 'Conosci lo spogliatoio, parti dal basso.', rep: 47, fame: 8 },
  naz: { n: 'Ex nazionale', d: 'Nome noto: reputazione più alta e un club che ti ama ancora.', rep: 55, fame: 35, love: 1 },
  young: { n: 'Tecnico emergente', d: 'Nessun passato da campione, ma i giovani crescono il 50% in più con te.', rep: 44, fame: 4, youthX: 1.5 }
};

/** @param {State} st @returns {boolean} */
G.mgr.active = function (st) { return !!(st.mgr && st.mgr.club !== null && !st.mgr.done); };
// The manager of a club, for the functions that run only while G.mgr.active(st) (type checker only, see MgrJob)
/** @param {State} st @returns {MgrJob} */
G.mgr.job = function (st) { return /** @type {MgrJob} */ (st.mgr); };

// Starting reputation from the playing career
/** @param {State} st @returns {number} */
G.mgr.rep0 = function (st) {
  var M = G.CFG.MGR;
  return Math.round(G.clamp(M.REP_BASE + G.hof.score(st).total / M.REP_SCORE + st.player.fame / M.REP_FAME, M.REP_MIN, M.REP_MAX));
};
/** @param {State} st @returns {number} */
G.mgr.rep = function (st) { return st.mgr ? st.mgr.rep : G.mgr.rep0(st); };

/** @param {State} st @param {number} rep @returns {Mgr} */
G.mgr.make = function (st, rep) {
  return (st.mgr = { role: 'mgr', rep: rep, hist: [], trophies: [], awards: [], sacked: 0, jobs: 0, seasons: 0, co: -1, club: null, since: st.S ? st.S.year : st.year,
    tactic: 'bal', form: '4-4-2', mode: 'auto' });
};

// What the fans' love is worth: board patience, extra budget (%), squad morale
/** @param {number} f @returns {MgrPerks|null} */
G.mgr.perks = function (f) {
  var M = G.CFG.MGR;
  return f >= M.LOVE ? { pat: Math.round(f / M.PAT_DIV), bud: Math.round(f / M.BUD_DIV * 100), mor: Math.round(f / M.MOR_DIV) } : null;
};

// Job offers: clubs whose fans love you call first (even above your level), then clubs of your level
/** @param {State} st @param {number} [low] @returns {MgrOffer[]} */
G.mgr.offers = function (st, low) {
  var M = G.CFG.MGR, p = st.player, W = st.world, rep = G.mgr.rep(st) - (low || 0), cur = st.mgr ? (st.mgr.club !== null ? st.mgr.club : st.mgr.lastClub) : null;
  var love = W.clubs.filter(function (c) {
    return c.id !== cur && (p.fans[c.id] || 0) >= M.LOVE && !p.traitor[c.id] && c.rep <= rep + 10 + (p.bandiera[c.id] ? 10 : 0);
  }).sort(function (a, b) { return (p.fans[b.id] || 0) - (p.fans[a.id] || 0); }).slice(0, 3);
  var fit = G.rng.shuffle(W.clubs.filter(function (c) { return c.id !== cur && love.indexOf(c) < 0 && c.rep >= rep - 12 && c.rep <= rep + 3; }))
    .slice(0, M.OFFERS - love.length).sort(function (a, b) { return b.rep - a.rep; });
  if (!love.length && !fit.length) fit = W.clubs.filter(function (c) { return c.id !== cur; }).sort(function (a, b) { return Math.abs(a.rep - rep) - Math.abs(b.rep - rep); }).slice(0, 2);
  return love.concat(fit).map(function (c) { return G.mgrJobs.offer(st, c.id); });  // with the club's interest (M9 S2)
};

/** @param {State} st @param {string} why @param {number} [low] */
G.mgr.offerSet = function (st, why, low) { st.mgrOffers = { why: why, list: G.mgr.offers(st, low) }; };

// One-off transfer money the club adds for a beloved legend (M€)
/** @param {Club} club @param {MgrPerks} k @returns {number} */
G.mgr.budBonus = function (club, k) { return Math.round((club.bud + club.rev) * k.bud / 100); };

// Take a job (first one, after a sacking, or a call from another club)
/** @param {State} st @param {MgrOffer} o */
G.mgr.start = function (st, o) {
  var M = G.CFG.MGR, p = st.player, W = st.world, club = W.clubs[o.club], k = o.perks || { pat: 0, bud: 0, mor: 0 };
  var m = st.mgr || G.mgr.make(st, G.mgr.rep0(st));
  if (G.mgr.active(st)) {
    // between seasons the last season is already on record; mid-season the partial one is recorded now
    if (st.S && !st.S.cur && st.S.block === 0) m.hist[m.hist.length - 1].note += ' · poi al ' + club.name;
    else G.mgr.record(st, 'Dimissioni per il ' + club.name);
    G.mgr.leave(st);
  }
  m.role = 'mgr'; m.club = club.id; m.conf = M.CONF0 + k.pat; m.pat = k.pat; m.perks = k; m.jobs++;
  m.morale = G.clamp(55 + k.mor, 0, 100); m.tactic = m.tactic || 'bal'; m.buys = 0; m.tg = null; m.big = 0; m.soldOwn = 0;
  m.mode = 'auto'; m.xi = null; m.cond = {}; m.starts = {}; m.played = 0;
  m.contract = G.mgrJobs.contract(st, club); delete m.renew; delete m.idle; delete m.idleAt;  // M9 S2
  st.over = false; st.retireReason = null; st.mgrOffers = null; st.recap = null; st.event = null; st.offers = []; st.hofSaved = false;
  p.clubId = club.id; p.loanFrom = null; p.captain = null;
  if (k.bud) club.bud += G.mgr.budBonus(club, k);
  var co = m.co >= 0 ? W.coaches[m.co] : G.coaches.add(W, { n: p.name, nt: p.nat, a: p.age, rep: m.rep, sty: 'motivatore', me: 1 });
  var old = G.coaches.of(W, club);
  if (old && old !== co) old.c = -1;
  m.co = co.i; co.rep = m.rep; co.c = club.id; club.coach = co.i;
  G.news(st, '📝 Sei il nuovo manager del ' + club.name + (o.perks ? ': i tifosi ti accolgono da eroe' : ''));
  if (!st.S) G.season.start(st);
  else { G.season.refresh(st); G.mgr.objective(st); G.mgrBoard.goals(st); }
  G.mgrTeam.init(m); G.mgrSq.start(st); G.mgrDeal.start(st); G.mgrYouth.start(st); G.mgrTeam.xi(st);
  G.mgrLife.start(st);
  G.mgr.marketFloor(st);  // a small club can buy too (M9, fix after S2), with the heir already in the squad
  G.mgrPact.start(st, o.pact);  // the president and the pact of the offer (M9 S4)
  G.mgrTac.start(st, o.play);  // tactical familiarity, the levers of the interview (M9 S6)
};

// Leave the current club (sacked, resigned or retired): the club hires a new coach
/** @param {State} st */
G.mgr.leave = function (st) {
  var m = st.mgr, W = st.world;
  if (!m || m.club === null) return;
  var club = W.clubs[m.club];
  if (club.coach === m.co) { W.coaches[m.co].c = -1; club.coach = -1; G.coaches.hire(st, club, G.rng); }
  m.club = null;
};

// Board objective from the squad's strength rank in the league
/** @param {State} st */
G.mgr.objective = function (st) {
  var m = G.mgr.job(st), W = st.world, S = G.sure(st.S), club = W.clubs[m.club], ids = S.lg[club.lg].ids, L = G.leagueByKey(club.lg);
  var exp = ids.slice().sort(function (a, b) { return W.clubs[b].str - W.clubs[a].str; }).indexOf(club.id) + 1, n = ids.length;
  var tgt = exp === 1 ? 1 : Math.min(n - 1, exp + 1), P = G.CFG.PROMO_SLOTS;  // never 'finish last is fine'
  tgt = G.mgrPact.target(st, tgt, exp, n);  // the expectations and the pact (M9 S4)
  if (L.tier === 1 && G.NATIONS[club.nat].leagues.length > 1) tgt = Math.min(tgt, n - P);  // at least stay up
  var txt = tgt === 1 ? 'Vincere il campionato' : L.tier === 2 && tgt <= P ? 'Promozione' : tgt <= n / 4 ? 'Chiudere tra le prime ' + tgt :
    tgt <= n / 2 ? 'Parte sinistra della classifica' : tgt >= n - 5 ? 'Salvezza' : 'Metà classifica';
  m.obj = { year: S.year, tgt: tgt, n: n, txt: txt };
};

/** @param {State} st */
G.mgr.seasonStart = function (st) {
  if (!G.mgr.active(st)) return;
  G.mgr.job(st).buys = 0; G.mgr.job(st).tg = null; G.mgr.job(st).big = 0; G.mgr.job(st).soldOwn = 0; delete G.mgr.job(st).inv;
  G.mgrPact.seasonStart(st);  // the advance back, a new owner (M9 S4)
  G.mgr.objective(st);
  G.mgrBoard.goals(st);  // the board's goals (M8 phase F)
  G.mgrSq.sync(st);
  G.mgrDeal.window(st);  // the summer window opens (M8 phase D)
  var f = G.mgr.job(st).fin, b0 = st.world.clubs[G.mgr.job(st).club].bud;
  G.mgr.marketFloor(st);
  if (f) f.floor = G.mgrDeal.r1(st.world.clubs[G.mgr.job(st).club].bud - b0);
  G.mgrPact.summer(st);  // the pact, "Normale" until the manager chooses (M9 S4)
  G.mgrAsk.window(st);  // the board may ask something
  G.mgrYouth.seasonStart(st);  // the scouts are paid (phase E)
};

// Every match of the managed club: fitness, and a row for the dashboard (with our scorers)
/** @param {State} st @param {boolean} home @param {ClubId} opp @param {number[]} res @param {MatchComp} comp @param {MatchSide} side */
G.mgr.matchRow = function (st, home, opp, res, comp, side) {
  var W = st.world, m = G.mgr.job(st), club = W.clubs[m.club], S = st.S;
  G.mgrTeam.after(st, side);
  if (m.pact) m.pact.open = 0;  // the pact is fixed from the first match (M9 S4)
  if (!S || !S.cur) return;
  var /** @type {string[]} */ sc = [], rt = (side.rt || []).map(function (r) { return Math.round(r * 10) / 10; }), best = -1;
  (side.gl || []).forEach(function (n, k) { for (var i = 0; i < n; i++) sc.push(G.squads.sur(W.players[side.ids[k]].n)); });
  rt.forEach(function (r, k) { if (best < 0 || r > rt[best]) best = k; });
  var /** @type {MatchRow} */ row = { opp: opp, home: home, gf: home ? res[0] : res[1], ga: home ? res[1] : res[0], mins: 0, g: 0, a: 0, r: 0, comp: comp.name,
    derby: club.riv.indexOf(opp) >= 0, mgr: 1, sc: sc, form: m.form, tac: m.tactic, ck: comp.ck, rd: comp.rd, dt: S.today, rt: rt, xi: side.ids.slice() };
  if (best >= 0) row.mom = { n: W.players[side.ids[best]].n, r: rt[best] };  // our man of the match
  S.blockRows.push(row);
};

// After each block: board confidence follows the table, morale follows results
/** @param {State} st @param {number} b */
G.mgr.block = function (st, b) {
  var M = G.CFG.MGR, C = G.CFG, m = G.mgr.job(st), S = G.sure(st.S), p = st.player;
  if (!G.mgr.active(st) || b > 4) return;
  var club = st.world.clubs[m.club], pos = G.season.sortTable(S, club.lg).indexOf(club.id) + 1, gap = m.obj.tgt - pos;
  var w = M.BLOCK_CONF * C.BLOCK_SHARE[b] / 0.25 * (gap >= 0 ? 1 : (1 - G.mgrPact.pat(st) / 100) * G.mgrPact.loss(st));  // pact and president (M9 S4)
  m.conf = Math.round(G.clamp(m.conf + G.clamp(gap, -6, 6) * w, -10, 100));
  var rows = S.blockRows.filter(function (r) { return r.mgr; }), wins = rows.filter(function (r) { return r.gf > r.ga; }).length, loss = rows.filter(function (r) { return r.gf < r.ga; }).length;
  m.morale = Math.round(G.clamp(m.morale + (gap >= 0 ? 2 : -2) + (wins - loss) * M.MORALE_RES + (55 - m.morale) * 0.15, 0, 100));
  m.pos = pos;
  G.mgrSq.block(st, b, wins - loss);
  G.mgrYouth.block(st);
  G.mgrLife.block(st);
  G.mgrAw.block(st, b);
  p.money += Math.round(G.mgr.wage(st) * C.WEEKS_PER_BLOCK * (1 - C.TAX));
  G.mgrBoard.block(st);  // out of a cup before the goal: -4
  G.mgrAsk.block(st); G.mgrPact.block(st);  // the board's requests, the president (M9 S4)
  if (b === 1) { m.buys = 0; m.tg = null; G.mgrDeal.window(st); G.mgrAsk.window(st); }  // the winter window opens
  if (m.conf <= 0 && b < 4) G.mgr.sack(st, 'Esonerato a stagione in corso');
};

/** @param {State} st @returns {number} */
G.mgr.wage = function (st) {
  var m = G.mgr.job(st), club = st.world.clubs[m.club];
  return m.contract ? m.contract.wage : Math.round(G.squads.wage(m.rep + 8, club) * 0.7);  // saves from before M9 S2 have no contract
};

/** @param {State} st @param {string} [note] @returns {MgrSeason} */
G.mgr.record = function (st, note) {
  var m = G.mgr.job(st), W = st.world, club = W.clubs[m.club], S = st.S;
  var /** @type {MgrSeason} */ r = { year: S ? S.year : st.year, age: st.player.age, club: club.name, clubId: club.id, role: 'mgr', lg: G.leagueByKey(club.lg).name,
    pos: S ? G.season.sortTable(S, club.lg).indexOf(club.id) + 1 : null, tgt: m.obj ? m.obj.tgt : null, won: [], note: note || '' };
  m.hist.push(r);
  return r;
};

/** @param {State} st @param {string} note */
G.mgr.sack = function (st, note) {
  var m = G.mgr.job(st), club = st.world.clubs[m.club];
  G.mgr.record(st, note);
  m.sacked++; m.rep = Math.max(40, m.rep - 3); m.lastClub = club.id;
  G.life.fans(st, club.id, -5);
  G.news(st, '🔥 Il ' + club.name + ' ti esonera');
  G.mgrJobs.payout(st);
  G.mgr.leave(st);
  m.idle = 0; delete m.idleAt;
  G.mgr.offerSet(st, 'sacked', 4);
};

// End of season: objective, trophies, reputation, fans, young players, the board's verdict
/** @param {State} st @param {Dict<ClubId[]>} tables @param {[ClubId, string][]} honours */
G.mgr.seasonEnd = function (st, tables, honours) {
  var M = G.CFG.MGR, m = G.mgr.job(st), W = st.world, S = G.sure(st.S), p = st.player;
  if (!G.mgr.active(st)) return;
  var club = W.clubs[m.club], L = G.leagueByKey(club.lg), pos = tables[club.lg].indexOf(club.id) + 1, gap = m.obj.tgt - pos;
  var won = honours.filter(function (h) { return h[0] === club.id; }).map(function (h) { return h[1]; });
  var cups = won.length;
  if (L.tier === 2 && pos <= G.CFG.PROMO_SLOTS) won.push('Promozione');
  won.forEach(function (t) { if (t !== 'Promozione') m.trophies.push({ name: t, year: S.year, club: club.name }); });
  // the board judges all its goals (M8 phase F), no longer the league alone
  var score = m.goals ? G.mgrBoard.score(st) : 0.5;
  m.conf = Math.round(G.clamp(m.conf + (score - 0.5) * 2 * M.END_CONF + won.length * M.TROPHY_CONF, -20, 100));
  var down = L.tier === 1 && G.NATIONS[club.nat].leagues.length > 1 && pos > tables[club.lg].length - G.CFG.PROMO_SLOTS;
  G.mgrPact.seasonEnd(st, pos, cups, down);  // the pact's reward, the advance, the expectations (M9 S4)
  G.mgrId.seasonEnd(st);  // the club's identity: patience and fans (M9 S3)
  var rep0 = m.rep;
  // winning with a small club only goes so far: gains shrink once you are well above the club's level
  var dRep = G.clamp(gap * 0.6, -3, 3) + cups * 1.5 + (pos === 1 && L.tier === 1 ? 2 : 0);
  if (dRep > 0 && m.rep > club.rep + M.REP_SMALL) dRep *= 0.3;
  m.rep = Math.round(G.clamp(m.rep + dRep, 40, 97));
  W.coaches[m.co].rep = m.rep;
  var ntWon = G.mgrBoard.ntWon(st);  // a tournament won as ct (F2)
  if (ntWon) { m.trophies.push({ name: ntWon, year: S.year, club: G.nationInfo(/** @type {NationCode} */ (m.nt)).name }); won.push(ntWon); }
  G.life.fans(st, club.id, G.clamp(gap * 2, -8, 8) + won.length * 6);
  G.mgrTeam.seasonEnd(st);
  G.mgrYouth.seasonEnd(st);
  G.mgrSq.seasonEnd(m);
  m.seasons++;
  G.mgrAw.season(st, tables, honours);
  var rec = G.mgr.record(st, gap >= 0 ? 'Obiettivo raggiunto' : 'Obiettivo mancato');
  rec.pos = pos; rec.won = won;
  st.recap = { mgr: 1, year: S.year, rec: rec, club: club.id, pos: pos, n: tables[club.lg].length, tgt: m.obj.tgt, obj: m.obj.txt, won: won, rep: [rep0, m.rep], conf: m.conf,
    lg: L.name, champion: tables[club.lg][0], bdo: (st.roll[0] || { bdo: [] }).bdo.slice(0, 3), goals: (m.goals || []).map(function (g) { return { k: g.k, txt: g.txt, imp: g.imp, st: g.st }; }), score: score };
  if (m.conf <= 0) { st.recap.sacked = 1; m.hist.pop(); G.mgr.sack(st, 'Esonerato a fine stagione'); }
  else if (p.age + 1 >= M.MAX_AGE) st.recap.last = 1;
  else G.mgrBoard.ntCall(st);
  // the contract (M9 S2): a year less, a renewal, or its end; then the clubs that call, by their interest
  if (!st.recap.sacked && !st.recap.last && G.mgrJobs.seasonEnd(st, gap >= 0)) {
    st.recap.free = 1; m.lastClub = club.id; delete m.contract;
    G.news(st, '📄 Il contratto con il ' + club.name + ' è finito: sei libero');
    G.mgr.leave(st); m.idle = 0; delete m.idleAt;
    G.mgr.offerSet(st, 'free', 2);
  } else if (!st.recap.sacked && !st.recap.last) G.mgrJobs.calls(st, club);
};

// Hang up for good: the career ends and goes to the Hall of Fame
/** @param {State} st */
G.mgr.retire = function (st) {
  var m = G.mgr.job(st);
  if (G.mgr.active(st)) {
    var S = st.S, fresh = !S || (!S.cur && S.block === 0);
    if (fresh && m.hist.length) m.hist[m.hist.length - 1].note += ' · poi il ritiro';
    else G.mgr.record(st, 'Ritiro');
    G.mgr.leave(st);
  }
  m.done = 1; st.mgrOffers = null;
  st.over = true; st.retireReason = st.player.mgrOnly ? 'Fine della carriera da manager' : 'Fine della seconda carriera'; st.hofSaved = false;
  G.hof.add(st);
};

// Saves from before the merge: directors become managers who also sit on the bench; saves from before M8 phase B
// get the squad roles, morale and captain, from before phases D-F the market's state, the academy and the board's goals
/** @param {State} st */
G.mgr.migrate = function (st) {
  var m = st.mgr, W = st.world;
  if (!m) return;
  G.mgrLive.migrate(st);
  if (st.mgrOffers && !st.mgrOffers.list) {
    var /** @type {Dict<number>} */ seen = {}, /** @type {MgrOffer[]} */ list = [];
    (st.mgrOffers.coach || []).concat(st.mgrOffers.ds || []).forEach(function (o) { if (!seen[o.club]) { seen[o.club] = 1; list.push(o); } });
    st.mgrOffers = { why: st.mgrOffers.why, list: list };
  }
  if (m.role !== 'mgr') {
    m.role = 'mgr'; m.tactic = m.tactic || 'bal'; m.form = m.form || '4-4-2'; m.mode = 'auto';
    if (G.mgr.active(st)) {
      var club = W.clubs[G.mgr.job(st).club], co = m.co >= 0 ? W.coaches[m.co] : G.coaches.add(W, { n: st.player.name, nt: st.player.nat, a: st.player.age, rep: m.rep, sty: 'motivatore', me: 1 });
      var old = G.coaches.of(W, club);
      if (old && old !== co) old.c = -1;
      m.co = co.i; co.c = club.id; club.coach = co.i; co.rep = m.rep;
    }
  }
  if (G.mgr.active(st) && !m.sr) G.mgrSq.start(st);  // M8 phase B: roles, morale, captain (js/mgr-squad.js)
  G.mgrDeal.migrate(st);  // M8 phase D: the market's state and the assistant
  G.mgrYouth.migrate(st);  // phase E: the academy and the training
  G.mgrBoard.migrate(st);  // phase F: the board's goals
};
