// @ts-check
// The FIFA-style market (M8 phase D), buying: the search with filters, the scouts' fog on the
// potential and their full reports, and the negotiation in two steps, first with the club (the fee), then with the
// player (wage, promised role, years). Selling, bids, renewals, loans and the budget split are in js/mgr-deal-out.js.
// The state of a window is reset when a window opens (G.mgrDeal.window): m.rep2 the reports, m.neg the failed
// talks, m.bids the offers for our players, m.deal the open negotiation.

G.mgrDeal = {};
/** @type {Dict<string>} why a deal cannot go on */
G.mgrDeal.WHY = { chiuso: 'Mercato chiuso.', ko: 'Per questa finestra non se ne parla più.', max: 'Hai finito gli acquisti per questa finestra.', piena: 'La rosa è piena: vendi qualcuno prima.',
  soldi: 'Budget insufficiente.', ingaggi: 'Il monte ingaggi non lo permette.', nessuno: 'Il giocatore non è più sul mercato.' };

/** @param {string} s @returns {number} FNV-1a, the seed of a search */
G.mgrDeal.hash = function (s) {
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
/** @param {number} x @returns {number} M€ with one decimal */
G.mgrDeal.r1 = function (x) { return Math.round(x * 10) / 10; };

// A new club (or an old save): the budget split starts again, offers for players of another club go; the
// assistant renews contracts and looks after the academy, the market is left to you (G1)
/** @param {State} st */
G.mgrDeal.start = function (st) {
  var m = st.mgr, sq = st.world.clubs[m.club].sq;
  m.rep2 = m.rep2 || {}; m.neg = m.neg || {}; m.deal = null; m.split = 0; m.wageRoom = 0; m.loans = m.loans || {};
  m.bids = (m.bids || []).filter(function (b) { return sq.indexOf(b.id) >= 0; });
  m.assist = m.assist || { contracts: 1, market: 0, youth: 1 };
};

// ---------- D1 · the search ----------
// The weakest starter of role r in our XI: the yardstick of the scouts (as in G.mgr.targets)
/** @param {State} st @param {RoleKey} r @returns {number} */
G.mgrDeal.weak = function (st, r) {
  var m = st.mgr, W = st.world, list = G.squads.roleList(W, W.clubs[m.club], r), n = Math.max(1, G.mgrTeam.FORMS[m.form || '4-4-2'].s[r] || 1);
  return list[n - 1] !== undefined ? W.players[list[n - 1]].o : 40;
};

// RESULTS players for filter f, best first; the same filter in the same window gives the same players
/** @param {State} st @param {DealFilter} f @returns {Npc[]} */
G.mgrDeal.search = function (st, f) {
  var m = st.mgr, W = st.world, S = st.S, club = W.clubs[m.club], bud = Math.max(0, club.bud), bk = G.transfers.buckets(W);
  var rng = G.makeRng(G.mgrDeal.hash(st.seed + ':' + S.year + ':' + S.block + ':' + JSON.stringify(f))), /** @type {{ pl: Npc, sc: number }[]} */ out = [];
  (f.r ? [f.r] : G.ROLE_KEYS).forEach(function (r) {
    var weak = G.mgrDeal.weak(st, r);
    var ok = bk[r].filter(function (pl) {
      if (pl.c === club.id || pl.ln !== undefined || pl.a > 35 || (f.age && pl.a > f.age) || (f.pot && pl.p - pl.o < 8) || (f.exp && pl.y > 1)) return false;
      if (f.nat && (pl.c < 0 || W.clubs[pl.c].nat !== f.nat)) return false;
      return !f.price || G.mgr.price(st, pl) <= bud * f.price / 100;
    });
    // the scouts watch a part of the market: a sample, always the same in this window
    rng.sample(ok, 120).forEach(function (pl) {
      var price = G.mgr.price(st, pl);
      out.push({ pl: pl, sc: pl.o - weak + (pl.a <= 24 ? 2 : 0) + (pl.p - pl.o) / 4 - price / Math.max(5, bud) * 3 });
    });
  });
  return out.sort(function (a, b) { return b.sc - a.sc || a.pl.i - b.pl.i; }).slice(0, G.CFG2.MGR_DEAL.RESULTS).map(function (x) { return x.pl; });
};

// The potential as the scouts see it: a range around a fixed offset, narrower after a full report (and still
// holding the true value); our own players' is exact
/** @param {State} st @param {Npc} pl @returns {[number, number]} */
G.mgrDeal.pot = function (st, pl) {
  var D = G.CFG2.MGR_DEAL, m = st.mgr;
  if (pl.c === m.club) return [Math.round(pl.p), Math.round(pl.p)];
  var w = m.rep2 && m.rep2[pl.i] ? D.POT_SCOUTED : D.POT_FOG, off = Math.round(((pl.i * 7919) % 7 - 3) * w / D.POT_FOG);
  return [Math.max(Math.round(pl.o), Math.round(pl.p + off - w)), Math.min(99, Math.round(pl.p + off + w))];
};

// "📋 Relazione completa": at most REPORTS a window
/** @param {State} st @param {PlayerId} id @returns {string} */
G.mgrDeal.report = function (st, id) {
  var m = st.mgr, pl = st.world.players[id];
  if (!pl || !G.mgr.open(st) || m.rep2[id]) return '';
  if (Object.keys(m.rep2).length >= G.CFG2.MGR_DEAL.REPORTS) return 'Gli osservatori hanno finito le relazioni per questa finestra.';
  m.rep2[id] = 1;
  return '📋 Relazione su ' + pl.n + ': potenziale ' + G.mgrDeal.pot(st, pl).join('-') + '.';
};
/** @param {Npc} pl @returns {string[]} the character the report finds */
G.mgrDeal.traits = function (pl) {
  return [pl.p - pl.o > 10 ? 'ambizioso' : '', pl.y >= 3 ? 'leale' : '', pl.y <= 1 ? 'in scadenza' : ''].filter(Boolean);
};

// ---------- D2 · the negotiation ----------
// The squad role he would get with us (B1): the roles with him in the squad
/** @param {State} st @param {Npc} pl @returns {SquadRole} */
G.mgrDeal.deserve = function (st, pl) {
  var m = st.mgr, club = st.world.clubs[m.club];
  if (pl.c === club.id) return m.sr[pl.i] || 'ris';
  club.sq.push(pl.i);
  var r = G.mgrSq.roles(st)[pl.i];
  club.sq.pop();
  return r || 'ris';
};

// The chance his club takes an offer at FEE[k] of the price (k = 3: the loan, judged like the full price)
/** @param {State} st @param {Npc} pl @param {number} k @returns {number} */
G.mgrDeal.clubP = function (st, pl, k) {
  var D = G.CFG2.MGR_DEAL, W = st.world, club = W.clubs[st.mgr.club], s = pl.c >= 0 ? W.clubs[pl.c] : null;
  if (!s) return 1;
  var top3 = s.sq.slice().sort(function (a, b) { return W.players[b].o - W.players[a].o; }).slice(0, 3).indexOf(pl.i) >= 0;
  return G.clamp(D.FEE_P[k === 3 ? 1 : k] - (s.rep > club.rep + 6 ? 0.25 : 0) + (pl.y <= 1 ? 0.2 : 0) - (club.riv.indexOf(s.id) >= 0 ? 0.3 : 0) - (top3 ? 0.2 : 0), 0.05, 0.95);
};
/** @param {State} st @param {Npc} pl @returns {boolean} a loan with an option to buy: only for who is not a key player there */
G.mgrDeal.loanable = function (st, pl) { return pl.c >= 0 && pl.o < st.world.clubs[pl.c].str + 2; };

// The chance the player signs: wage choice wk, the role promised against the one he would get
/** @param {State} st @param {Npc} pl @param {Deal} d @returns {number} */
G.mgrDeal.playerP = function (st, pl, d) {
  var D = G.CFG2.MGR_DEAL, W = st.world, club = W.clubs[st.mgr.club], from = pl.c >= 0 ? W.clubs[pl.c] : null, O = G.mgrSq.ORDER;
  var up = O.indexOf(d.sr) - O.indexOf(d.want || G.mgrDeal.deserve(st, pl)), role = up < 0 ? D.ROLE_UP : up > 0 ? D.ROLE_DOWN : 0;
  return G.clamp(D.BASE_P + D.WAGE_P[d.wk] + role + (from ? (club.rep - from.rep) / 40 : 0) - (pl.o > club.str + 6 ? G.CFG.MGR.STAR_NO : 0), 0.05, 0.95);
};
/** @param {State} st @param {Npc} pl @param {number} wk @returns {number} the wage of choice wk, k€ a week */
G.mgrDeal.wage = function (st, pl, wk) { return Math.round(G.mgr.wageFor(st, pl) * G.CFG2.MGR_DEAL.WAGE[wk]); };

// What stops a signing for fee and wage ('' when nothing does); a wage below 0 is not checked yet (the talks with
// the club come before the wage)
/** @param {State} st @param {Npc} pl @param {number} fee @param {number} wage @returns {string} */
G.mgrDeal.can = function (st, pl, fee, wage) {
  var m = st.mgr, W = st.world, club = W.clubs[m.club];
  if (!G.mgr.open(st)) return 'chiuso';
  if (!pl || pl.c === club.id || pl.ln !== undefined) return 'nessuno';
  if (m.neg[pl.i]) return 'ko';
  if ((m.buys || 0) >= G.CFG.MGR.BUYS[st.S.block === 0 ? 0 : 1]) return 'max';
  if (club.sq.length >= G.CFG.SQUAD_MAX) return 'piena';
  if (fee > club.bud) return 'soldi';
  if (wage >= 0 && G.world.wageBill(W, club) + wage * 52 / 1000 > G.world.wageCap(club) * 1.3 + (m.wageRoom || 0)) return 'ingaggi';
  return '';
};

// Opens a negotiation (a free agent goes straight to the player). A counter-offer left open is turned down
/** @param {State} st @param {PlayerId} id @returns {string} */
G.mgrDeal.open = function (st, id) {
  var m = st.mgr, pl = st.world.players[id], why = G.mgrDeal.can(st, pl, 0, -1);
  if (why) return G.mgrDeal.WHY[why];
  if (m.deal && m.deal.step === 'counter' && m.deal.id !== id) m.neg[m.deal.id] = 'ko';
  m.deal = { id: id, step: pl.c >= 0 ? 'club' : 'player', fee: 0 };
  if (pl.c < 0) G.mgrDeal.toPlayer(st, m.deal);
  return '';
};

/** @param {State} st @param {Deal} d */
G.mgrDeal.toPlayer = function (st, d) {
  var pl = st.world.players[d.id];
  d.step = 'player'; d.wk = 1; d.want = G.mgrDeal.deserve(st, pl); d.sr = d.want === 'ris' ? 'rot' : d.want; d.yrs = pl.a >= 31 ? 2 : 3;
};

// Step 1: an offer at FEE[k] of the price, or k = 3 a loan with an option to buy
/** @param {State} st @param {number} k @returns {string} */
G.mgrDeal.offer = function (st, k) {
  var D = G.CFG2.MGR_DEAL, m = st.mgr, d = m.deal, W = st.world;
  if (!d || d.step !== 'club') return '';
  var pl = W.players[d.id], s = W.clubs[pl.c], price = G.mgr.price(st, pl), loan = k === 3, fee = G.mgrDeal.r1(price * (loan ? D.LOAN_FEE : D.FEE[k]));
  if (loan && !G.mgrDeal.loanable(st, pl)) return '';
  var why = G.mgrDeal.can(st, pl, fee, -1);
  if (why) return G.mgrDeal.WHY[why];
  if (G.rng.chance(G.mgrDeal.clubP(st, pl, k))) {
    d.fee = fee; d.loan = loan ? 1 : 0; G.mgrDeal.toPlayer(st, d);
    return '✅ Il ' + s.name + (loan ? ' lo presta: ' : ' accetta ' + fee + ' M€: ') + 'ora tratti con ' + pl.n + '.';
  }
  if (!loan && G.rng.chance(D.COUNTER_P)) { d.step = 'counter'; d.fee = G.mgrDeal.r1(fee * (1 + D.COUNTER_UP)); return '↩️ Il ' + s.name + ' rifiuta, ma per ' + d.fee + ' M€ lo lascia partire.'; }
  m.neg[d.id] = 'ko'; m.deal = null;
  return '✋ Il ' + s.name + ' non vende ' + pl.n + ': per questa finestra non se ne parla più.';
};

// The club's counter-offer: yes moves on to the player, no closes the talks for this window
/** @param {State} st @param {boolean} yes @returns {string} */
G.mgrDeal.counter = function (st, yes) {
  var m = st.mgr, d = m.deal;
  if (!d || d.step !== 'counter') return '';
  var pl = st.world.players[d.id];
  if (!yes) { m.neg[d.id] = 'ko'; m.deal = null; return 'Trattativa chiusa.'; }
  var why = G.mgrDeal.can(st, pl, d.fee, -1);
  if (why) return G.mgrDeal.WHY[why];
  G.mgrDeal.toPlayer(st, d);
  return '✅ Accordo con il club a ' + d.fee + ' M€: ora tratti con ' + pl.n + '.';
};

// Step 2: the contract offered to the player (wage, role, years). If he signs he arrives with the promised role
/** @param {State} st @returns {string} */
G.mgrDeal.sign = function (st) {
  var m = st.mgr, d = m.deal, W = st.world, S = st.S;
  if (!d || d.step !== 'player') return '';
  var pl = W.players[d.id], wage = G.mgrDeal.wage(st, pl, d.wk || 0), why = G.mgrDeal.can(st, pl, d.fee, wage);
  if (why) return G.mgrDeal.WHY[why];
  if (!G.rng.chance(G.mgrDeal.playerP(st, pl, d))) { m.neg[d.id] = 'ko'; m.deal = null; return '🙅 ' + pl.n + ' preferisce restare dov’è.'; }
  var from = pl.c >= 0 ? W.clubs[pl.c].name : '';
  if (d.loan) G.mgrDeal.loanIn(st, pl, d.fee, wage); else G.mgr.buy(st, pl, d.fee, wage, d.yrs || 3);
  m.buys = (m.buys || 0) + 1; m.morale = Math.min(100, m.morale + 2);
  m.sr[pl.i] = d.sr || 'rot'; m.pm[pl.i] = 70;
  m.promise[pl.i] = { to: m.sr[pl.i], y: S.year, b: S.cur ? S.cur.b + 1 : S.block };
  m.deal = null;
  return '✍️ ' + pl.n + (d.loan ? ' arriva in prestito dal ' + from + ' (riscatto a fine stagione).' : ' firma per ' + d.yrs + (d.yrs === 1 ? ' anno' : ' anni') + ': lo trovi nella Rosa come ' + G.mgrSq.LABEL[m.sr[pl.i]].toLowerCase() + '.');
};

// The plain deal: 100% of the price (a counter-offer accepted), the wage he asks, the role he would get
// (the scenarios, and the assistant of phase G); 'ok' or why not
/** @param {State} st @param {PlayerId} id @returns {string} */
G.mgrDeal.quick = function (st, id) {
  var m = st.mgr;
  if (G.mgrDeal.open(st, id)) return 'no';
  if (m.deal.step === 'club') G.mgrDeal.offer(st, 1);
  if (m.deal && m.deal.step === 'counter') G.mgrDeal.counter(st, true);
  if (!m.deal || m.deal.step !== 'player') { if (m.deal) m.deal = null; return 'no'; }
  m.deal.wk = 1;
  var out = G.mgrDeal.sign(st);
  if (m.deal) m.deal = null;
  return /^✍️/.test(out) ? 'ok' : 'no';
};
