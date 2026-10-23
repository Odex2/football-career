// @ts-check
// Live matches of the manager (M8 phase C): "Gioca in diretta" plays up to the managed club's
// next match and stops at half time. The first half is played before that day (st.mgrHT), a modal asks what to say
// in the dressing room, then G.match.play adds the second half with the choice. A block or a season played whole
// never stops. With the calendar every opponent is known on the day, so every match can be played live (cups and
// European knockouts too); a season begun without a calendar plays them all simulated.

G.mgrLive = {};

/** @param {State} st @returns {string} the key of the day about to be played: year:block:day */
G.mgrLive.now = function (st) { var S = st.S; return S && S.cur ? S.year + ':' + S.cur.b + ':' + S.cur.d : ''; };

// The managed club's match on the next day of the block, with a club as opponent
/** @param {State} st @returns {{ opp: ClubId, home: boolean, neutral: boolean, key: string }|null} */
G.mgrLive.ahead = function (st) {
  var S = st.S, cur = S.cur, x = cur && cur.days ? cur.days[cur.d] : undefined;
  if (x === undefined || cur.b > 4) return null;
  var e = G.cal.matchOn(st, st.mgr.club, x);
  if (!e || typeof e.opp !== 'number') return null;
  return { opp: e.opp, home: !!e.home, neutral: e.rd === 'Finale', key: G.mgrLive.now(st) };
};

// [ours, theirs] in a part of the match (part = share of the goals expected) with our modifiers and extra strength
/** @param {HalfTime} H @param {number[]} mods @param {number} dstr @param {number} part @param {Rng} rng @returns {[number, number]} */
G.mgrLive.goals = function (H, mods, dstr, part, rng) {
  var me = H.my + dstr, adv = H.neutral ? G.CFG.HOME_ADV : 0;
  var r = H.home ? G.mgrTeam.sim(me - adv, H.op, mods, null, rng, part) : G.mgrTeam.sim(H.op - adv, me, null, mods, rng, part);
  return H.home ? [r[0], r[1]] : [r[1], r[0]];
};

// Before the day of our match, when the user asked for it: the first half, then the half-time modal
/** @param {State} st @returns {boolean} true = stop here */
G.mgrLive.stop = function (st) {
  var S = st.S;
  if (!st.mgr || !G.mgr.active(st) || !st.live || !st.mgrLiveReq || st.event || !S.cur || S.cur.b > 4) return false;
  var A = G.mgrLive.ahead(st);
  if (!A || (st.mgrHT && st.mgrHT.key === A.key)) return false;
  var Lc = G.CFG2.MGR_LIVE, W = st.world, m = st.mgr, club = W.clubs[m.club], opp = W.clubs[A.opp];
  // the opponent as G.match.play fields it: its XI with the usual rotation (club.str already holds the coach)
  var /** @type {HalfTime} */ H = { key: A.key, opp: A.opp, home: A.home, ht: [0, 0], my: G.mgrTeam.side(st, club).str, op: G.match.side(W, opp, null, st.player, G.rng).str, pick: null };
  if (A.neutral) H.neutral = true;
  H.ht = G.mgrLive.goals(H, G.mgrTeam.mods(m), 0, Lc.HALF1, G.rng);
  st.mgrHT = H;
  var names = A.home ? [club.name, opp.name] : [opp.name, club.name], sc = A.home ? H.ht : [H.ht[1], H.ht[0]];
  var how = H.ht[0] < H.ht[1] ? 'Primo tempo difficile: siete sotto.' : H.ht[0] > H.ht[1] ? 'Primo tempo buono: siete in vantaggio.' : 'Primo tempo in equilibrio.';
  st.event = { id: 'mgrht', mgrht: 1, moment: 0, t: '⏱️ Intervallo: ' + names[0] + ' ' + sc[0] + '-' + sc[1] + ' ' + names[1],
    d: how + ' Modulo ' + m.form + ', tattica ' + (G.mgr.TACTIC[m.tactic] || '').toLowerCase() + '. Cosa dici nello spogliatoio?',
    o: G.mgrLive.options(st, H).map(function (o) { return o.label; }) };
  return true;
};

/** @param {number} x @returns {string} '+0,4' */
G.mgrLive.num = function (x) { var r = Math.round(x * 10) / 10; return (r >= 0 ? '+' : '−') + Math.abs(r).toFixed(1).replace('.', ','); };

// The 4 answers at half time, each saying what it changes (same order on the modal and in pick)
/** @param {State} st @param {HalfTime} H @returns {{ label: string, pick: LivePick, p?: number }[]} */
G.mgrLive.options = function (st, H) {
  var Lc = G.CFG2.MGR_LIVE, m = st.mgr, W = st.world, club = W.clubs[m.club], T = G.mgrTeam, base = T.mods(m);
  var mk = /** @param {number[]} d @param {number} dstr @param {[PlayerId, PlayerId]} sub @param {string} txt @returns {LivePick} */ function (d, dstr, sub, txt) {
    return { mods: [base[0] + d[0], base[1] + d[1]], dstr: dstr, sub: sub, talk: null, txt: txt };
  };
  var pct = /** @param {number} x */ function (x) { return Math.round(Math.abs(x) * 100) + '%'; };
  var behind = H.ht[0] <= H.ht[1], tac = behind ? Lc.PUSH : Lc.PARK;
  var /** @type {{ label: string, pick: LivePick, p?: number }[]} */ out = [{ label: '🙂 Nessun cambio · si continua così', pick: mk([0, 0], 0, null, 'nessun cambio') },
    behind ? { label: '⚔️ Tutti all’attacco · più gol fatti (+' + pct(tac[0]) + ') e più gol presi (+' + pct(tac[1]) + ')', pick: mk(tac, 0, null, 'tutti all’attacco') } :
      { label: '🛡️ Chiudiamoci · meno gol presi (−' + pct(tac[1]) + ') e meno gol fatti (−' + pct(tac[0]) + ')', pick: mk(tac, 0, null, 'chiusi in difesa') }];
  // the substitution: the tiredest outfield starter (the weakest at equal fitness) for the best healthy reserve in his slot
  var xi = T.xi(st), /** @type {Dict<number>} */ inXi = {}, /** @type {XiSlot} */ y = null;
  xi.forEach(function (x) { inXi[x.id] = 1; });
  var key = /** @param {XiSlot} x */ function (x) { return T.cond(m, x.id) * 1000 + T.eff(m, W.players[x.id], x.r); };
  xi.forEach(function (x) { if (x.r !== 'POR' && (!y || key(x) < key(y))) y = x; });
  var /** @type {Npc} */ on = null, best = -1e9;
  if (y) club.sq.forEach(function (id) {
    if (inXi[id] || G.mgrSq.inj(m, id)) return;
    var v = T.eff(m, W.players[id], y.r);
    if (v > best) { best = v; on = W.players[id]; }
  });
  if (on) {
    var off = W.players[y.id], d = (best - T.eff(m, off, y.r)) / 11;
    out.push({ label: '🔄 Cambio: dentro ' + on.n + ' per ' + off.n + ' (condizione ' + T.cond(m, off.i) + '%) · ' + G.mgrLive.num(d) + ' di forza', pick: mk([0, 0], d, [on.i, off.i], 'dentro ' + on.n + ' per ' + off.n) });
  } else out.push({ label: '🔄 Nessuna riserva disponibile per un cambio', pick: mk([0, 0], 0, null, 'nessun cambio') });
  var p = G.clamp(Lc.TALK[0] + m.morale / Lc.TALK[1], 0, 1);
  out.push({ label: '📣 Scuoti lo spogliatoio · riuscita ' + Math.round(p * 100) + '% · se va bene ' + G.mgrLive.num(Lc.TALK_OK) + ' di forza, se no ' + G.mgrLive.num(Lc.TALK_KO), pick: mk([0, 0], 0, null, ''), p: p });
  return out;
};

// The answer: the talk is settled now, the rest when the second half is played
/** @param {State} st @param {number|string} i */
G.mgrLive.pick = function (st, i) {
  var Lc = G.CFG2.MGR_LIVE, H = st.mgrHT, m = st.mgr;
  st.event = null;
  if (!H || !G.mgr.active(st)) return;
  var opts = G.mgrLive.options(st, H), o = opts[+i || 0] || opts[0], P = o.pick;
  if (o.p !== undefined) {
    var ok = G.rng.chance(o.p);
    P.talk = ok; P.dstr = ok ? Lc.TALK_OK : Lc.TALK_KO; P.txt = ok ? 'la scossa nello spogliatoio' : 'una scossa che non arriva';
    m.morale = G.clamp(m.morale + Lc.TALK_MO[ok ? 0 : 1], 0, 100);
  }
  H.pick = P;
};

// In G.match.play: our match of today, when its first half was played at the stop (or null)
/** @param {State} st @param {ClubId} mg @param {ClubId} h @param {ClubId} a @returns {HalfTime|null} */
G.mgrLive.today = function (st, mg, h, a) {
  var H = st.mgrHT;
  return H && mg >= 0 && (h === mg || a === mg) && H.key === G.mgrLive.now(st) ? H : null;
};

// The result: the first half plus the second with the choice; [home, away]. A substitute comes on first
/** @param {State} st @param {HalfTime} H @param {boolean} home @param {MatchSide} side @returns {number[]} */
G.mgrLive.result = function (st, H, home, side) {
  var P = H.pick || { mods: /** @type {[number, number]} */ (G.mgrTeam.mods(st.mgr)), dstr: 0, sub: null, talk: null };
  var r2 = G.mgrLive.goals(H, P.mods, P.dstr, 1 - G.CFG2.MGR_LIVE.HALF1, G.rng), ours = H.ht[0] + r2[0], theirs = H.ht[1] + r2[1];
  if (P.sub) { side.sub = P.sub; side.cameOn = [P.sub[0]].concat(side.cameOn.filter(function (id) { return id !== P.sub[0]; })).slice(0, G.CFG.SUBS); }
  return home ? [ours, theirs] : [theirs, ours];
};

// After the match: the row and the news say how it went
/** @param {State} st @param {HalfTime} H @param {number[]} res @param {boolean} home */
G.mgrLive.done = function (st, H, res, home) {
  var S = st.S, row = S.blockRows[S.blockRows.length - 1], txt = H.pick && H.pick.txt ? H.pick.txt : 'nessun cambio', f = home ? res : [res[1], res[0]];
  if (row && row.mgr && row.opp === H.opp) { row.live = 1; row.ht = H.ht.slice(); row.lv = txt; }
  G.news(st, '⏱️ In diretta contro ' + st.world.clubs[H.opp].name + ': ' + H.ht[0] + '-' + H.ht[1] + ' all’intervallo, poi ' + txt + ', finisce ' + f[0] + '-' + f[1]);
  st.mgrHT = null;
};

// Saves: a half time left behind with a day that is gone is dropped (and its modal with it)
/** @param {State} st */
G.mgrLive.migrate = function (st) {
  if (st.mgrHT && st.mgrHT.key !== G.mgrLive.now(st)) st.mgrHT = null;
  if (st.event && st.event.mgrht && !st.mgrHT) st.event = null;
  if (st.mgrLiveReq && !(st.event && st.event.mgrht)) delete st.mgrLiveReq;
};
