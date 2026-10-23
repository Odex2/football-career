// @ts-check
// A club's season in the calendar (M8 phase J): the matches it has played and those still to play, with their
// dates; the next one; why a match counts (G.season.importance); the postponed matches of a league table.

/** @param {State} st @returns {MatchRow[]} the season's matches of the user's club so far, the block in progress included */
G.cal.rows = function (st) { var S = st.S; return (S.rows || []).concat(S.cur ? S.blockRows || [] : []); };

/** @param {Season} S @param {LeagueKey} key @param {ClubId} h @param {ClubId} a @returns {number[]|null} [matchday, index] of a league match */
G.cal.find2 = function (S, key, h, a) {
  var fx = G.season.fixtures(S, key);
  for (var md = 0; md < fx.length; md++) for (var i = 0; i < fx[md].length; i++) if (fx[md][i][0] === h && fx[md][i][1] === a) return [md, i];
  return null;
};

// The club's matches still to play, by date: league, the cup (later rounds while the club is in, opponent to draw),
// Europe (the same for the knockout rounds)
/** @param {State} st @param {ClubId} clubId @returns {CalEntry[]} */
G.cal.upcoming = function (st, clubId) {
  var S = st.S, cal = S.cal, club = st.world.clubs[clubId], /** @type {CalEntry[]} */ out = [];
  if (!cal || !club || !S.lg[club.lg]) return out;
  var now = G.cal.now(st), key = club.lg, name = G.leagueByKey(key).name;
  G.season.fixtures(S, key).forEach(function (ms, md) {
    ms.forEach(function (m, i) {
      if (m[0] !== clubId && m[1] !== clubId) return;
      var d = G.cal.when(S, key, md, i), b = G.cal.base(S, key, md, i), /** @type {CalEntry} */ e = { d: d, ck: 'lg', opp: m[0] === clubId ? m[1] : m[0], home: m[0] === clubId, name: name, md: md };
      if (d !== b) e.moved = b;
      out.push(e);
    });
  });
  var cup = S.cups[club.nat], cd = cal.cup[club.nat];
  if (cup && cd && cup.winner === null && cup.ties) {
    var real = cup.ties.filter(function (t) { return t[1] >= 0; }).length, mine = -1;
    cup.ties.forEach(function (t, i) { if (t[0] === clubId || t[1] === clubId) mine = i; });
    var t = mine >= 0 ? cup.ties[mine] : null;
    if (t && t[1] >= 0 && t[2] === undefined) out.push({ d: G.cal.half(cd[cup.r], mine, real, 1), ck: club.nat, opp: t[0] === clubId ? t[1] : t[0], home: t[0] === clubId, name: cup.name, rd: G.season.cupRound(cup) });
    if (t && (t[2] === undefined || t[2] === clubId)) for (var r = cup.r + 1, n = cup.alive.length; r < cup.R; r++) {
      n = Math.ceil(n / 2);
      out.push({ d: cd[r], ck: club.nat, opp: null, home: null, name: cup.name, rd: G.tour.ROUND[n] || (r + 1) + 'º turno' });
    }
  }
  G.europe.compsOf(st, clubId).forEach(function (k) {
    var comp = S.eu[k], c = cal.eu[k], ORDER = ['po', 'r16', 'qf', 'sf', 'f'];
    if (comp.stage === 'lp') {
      for (var md = comp.md; md < comp.fx.length; md++) comp.fx[md].forEach(function (m, i, all) {
        if (m[0] === clubId || m[1] === clubId) out.push({ d: G.cal.half(c.lp[md], i, all.length, 1), ck: k, opp: m[0] === clubId ? m[1] : m[0], home: m[0] === clubId, name: comp.name, rd: 'Fase campionato', md: md });
      });
      return;
    }
    if (comp.stage === 'done') return;
    var at = -1;
    comp.ties.forEach(function (t, j) { if (t[0] === clubId || t[1] === clubId) at = j; });
    var tie = at >= 0 ? comp.ties[at] : null, f = comp.stage === 'f';
    if (tie && tie[2] === undefined) G.cal.koDates(comp, c).forEach(function (d, leg) {
      if (leg === 0 && !f && comp.leg && comp.leg[at]) return;
      out.push({ d: G.cal.half(d, at, comp.ties.length, 1), ck: k, opp: tie[0] === clubId ? tie[1] : tie[0], home: f ? tie[0] === clubId : (leg === 0) === (tie[0] === clubId),
        name: comp.name, rd: G.europe.STAGES[comp.stage], leg: f ? undefined : leg + 1 });
    });
    // the later rounds while the club is still in (in the top 8, it waits for the playoff to end)
    if ((tie && (tie[2] === undefined || tie[2] === clubId)) || (comp.stage === 'po' && G.europe.sortTable(comp).indexOf(clubId) < 8))
      ORDER.slice(ORDER.indexOf(comp.stage) + 1).forEach(function (s) {
        var ds = s === 'f' ? [c.f] : /** @type {Dict<number[]>} */ ({ po: c.po, r16: c.r16, qf: c.qf, sf: c.sf })[s];
        ds.forEach(function (d, leg) { out.push({ d: d, ck: k, opp: null, home: null, name: comp.name, rd: G.europe.STAGES[s], leg: s === 'f' ? undefined : leg + 1 }); });
      });
  });
  return out.filter(function (e) { return e.d > now; }).sort(function (a, b) { return a.d - b.d; });
};

/** @param {State} st @param {ClubId} clubId @returns {CalEntry|null} the club's next match */
G.cal.next = function (st, clubId) { return G.cal.upcoming(st, clubId)[0] || null; };

/** @param {State} st @param {ClubId} clubId @param {number} x @returns {CalEntry|null} the club's match on a date */
G.cal.matchOn = function (st, clubId, x) { return G.cal.upcoming(st, clubId).filter(function (e) { return e.d === x; })[0] || null; };

// The whole season of the user's club: the matches played (from the match rows), those to play, the national breaks
/** @param {State} st @returns {CalEntry[]} */
G.cal.entries = function (st) {
  var S = st.S, W = st.world, id = G.season.myClub(st), /** @type {CalEntry[]} */ out = [];
  if (!S.cal || id < 0) return out;
  var key = W.clubs[id].lg;
  G.cal.rows(st).forEach(function (r) {
    if (r.dt === undefined) return;
    var /** @type {CalEntry} */ e = { d: r.dt, ck: r.nt ? 'nt' : r.ck || 'lg', opp: r.opp, home: r.home, name: r.comp, rd: r.rd, res: [r.gf, r.ga], row: r };
    var at = e.ck === 'lg' && typeof r.opp === 'number' ? G.cal.find2(S, key, r.home ? id : r.opp, r.home ? r.opp : id) : null;
    if (at) { e.md = at[0]; var b = G.cal.base(S, key, at[0], at[1]); if (b !== r.dt) e.moved = b; }
    out.push(e);
  });
  out = out.concat(G.cal.upcoming(st, id));
  if (!st.mgr && G.NT[st.player.nat]) S.cal.nt.forEach(function (d) { out.push({ d: d, ck: 'brk', opp: null, home: null, name: 'Pausa per le nazionali' }); });
  return out.sort(function (a, b) { return a.d - b.d || (a.ck === 'brk' ? -1 : b.ck === 'brk' ? 1 : 0); });
};

// Per club of a league table: matches postponed past today that the others have already played
/** @param {State} st @param {LeagueKey} key @returns {Dict<number>} */
G.cal.behind = function (st, key) {
  var S = st.S, /** @type {Dict<number>} */ out = {}, mv = S.cal && S.cal.mv[key];
  if (!mv) return out;
  var now = G.cal.now(st), fx = G.season.fixtures(S, key);
  Object.keys(mv).forEach(function (k) {
    var p = k.split(':'), md = +p[0], i = fx[md].map(function (m) { return m[0]; }).indexOf(+p[1]);
    if (i >= 0 && G.cal.base(S, key, md, i) <= now && mv[k] > now) fx[md][i].forEach(function (id) { out[id] = (out[id] || 0) + 1; });
  });
  return out;
};

// The next match of the user's club that counts (J8): the entry, why, and how many of the club's matches come first.
// A round not drawn yet does not count: its opponent is not known.
/** @param {State} st @returns {{ e: CalEntry, imp: Importance, n: number }|null} */
G.cal.important = function (st) {
  var id = G.season.myClub(st);
  if (!st.S || !st.S.cal || id < 0) return null;
  var list = G.cal.upcoming(st, id);
  for (var i = 0; i < list.length; i++) { var imp = list[i].opp === null ? null : G.season.importance(st, id, list[i]); if (imp) return { e: list[i], imp: imp, n: i }; }
  return null;
};

// ---------- why a match counts (J5) ----------
/** @type {Dict<string>} */
G.cal.SHORT = { UCL: 'Champions', UEL: 'Europa League', UECL: 'Conference League' };

// The reason a match matters, or null: the decisive-moment reasons first (so the skip never plays past a moment),
// then finals and semifinals, the European knockout, the last league-phase matchday, the big match, the last
// league matchdays with the club's target still open
/** @param {State} st @param {ClubId} clubId @param {CalEntry} e @returns {Importance|null} */
G.season.importance = function (st, clubId, e) {
  var W = st.world, S = st.S, club = W.clubs[clubId], CAL = G.CFG2.CAL, euro = !!G.CFG.UEFA[e.ck], opp = typeof e.opp === 'number' && e.opp >= 0 ? W.clubs[e.opp] : null;
  var cupFinal = !euro && e.ck !== 'lg' && e.rd === 'Finale' ? e.name : '';
  if (opp && (e.ck === 'lg' || cupFinal)) { var w = G.moments.why(st, club, opp, cupFinal); if (w) return { why: w, tag: cupFinal ? '🏆' : club.riv.indexOf(opp.id) >= 0 ? '🔥' : '⚔️' }; }
  if (opp && club.riv.indexOf(opp.id) >= 0) return { why: 'il derby con il ' + opp.name, tag: '🔥' };
  var comp = euro ? G.cal.SHORT[e.ck] : e.name, leg = e.leg === 1 ? 'l’andata ' : e.leg === 2 ? 'il ritorno ' : '', vs = opp ? ' con il ' + opp.name : '';
  if (e.rd === 'Finale') return { why: 'la finale di ' + comp + vs, tag: '🏆' };
  if (e.rd === 'Semifinali') return { why: (leg ? leg + 'della semifinale' : 'la semifinale') + ' di ' + comp + vs, tag: '🏆' };
  var of = /** @type {Dict<string>} */ ({ Playoff: 'dei playoff', Ottavi: 'degli ottavi', Quarti: 'dei quarti' })[e.rd || ''];
  if (euro && of) return { why: (leg || 'la sfida ') + of + ' di ' + comp + vs, tag: '⭐' };
  if (euro && e.rd === 'Fase campionato' && e.md === S.eu[e.ck].fx.length - 1) {
    var pos = G.europe.sortTable(S.eu[e.ck]).indexOf(clubId) + 1;
    if (pos >= 6 && pos <= 11) return { why: 'l’ultima giornata di ' + comp + ': in palio gli ottavi', tag: '🏁' };
    if (pos >= 21 && pos <= 27) return { why: 'l’ultima giornata di ' + comp + ': in palio i playoff', tag: '🏁' };
  }
  if (opp && opp.rep >= CAL.BIG_REP) return { why: 'il big match con il ' + opp.name, tag: '⚔️' };
  var N = S.lg[club.lg] ? G.season.fixtures(S, club.lg).length : 0;
  if (e.ck === 'lg' && e.md !== undefined && e.md >= N - CAL.LAST_MD) {
    var stake = G.cal.stake(st, club, N - e.md);
    if (stake) return { why: ['l’ultima giornata', 'la penultima giornata', 'la terzultima giornata'][N - 1 - e.md] + ': ' + stake, tag: '🏁' };
  }
  return null;
};

// The club's target still open with rem matchdays to go (at most 3 points a matchday from it): the title, Europe,
// promotion, survival, in this order; '' when nothing is at stake
/** @param {State} st @param {Club} club @param {number} rem @returns {string} */
G.cal.stake = function (st, club, rem) {
  var S = st.S, C = G.CFG, L = G.leagueByKey(club.lg), t = G.season.sortTable(S, club.lg), tab = S.lg[club.lg].tab, n = t.length, pc = t.indexOf(club.id), me = tab[club.id][6];
  var pts = /** @param {number} i */ function (i) { return tab[t[i]][6]; }, max = 3 * rem, acc = C.UEFA_ACCESS[L.nat], down = S.lg[L.nat + '2'] && L.tier === 1 ? C.PROMO_SLOTS : 0;
  var p = /** @param {number} x */ function (x) { return x + (x === 1 ? ' punto' : ' punti'); };
  // a zone of the top z places: inside, defend the margin on the first one out; outside, the gap to the last one in
  var top = /** @param {number} z @param {string} what */ function (z, what) {
    if (z <= 0 || z >= n) return '';
    if (pc < z) { var m = me - pts(z); return m <= max ? what + ' da difendere, ' + p(m) + ' di vantaggio' : ''; }
    var g = pts(z - 1) - me;
    return g <= max ? what + (g ? ' è a ' + p(g) : ' è a pari punti') : '';
  };
  var s = L.tier === 1 ? top(1, 'il titolo') || (acc ? top(acc[0] + acc[1] + acc[2], 'l’Europa') : '') : top(C.PROMO_SLOTS, 'la promozione');
  if (s || !down) return s;
  var safe = n - down - 1;
  if (pc <= safe) { var m = me - pts(safe + 1); return m <= max ? 'la salvezza da difendere, ' + p(m) + ' di vantaggio' : ''; }
  var g = pts(safe) - me;
  return g <= max ? 'la salvezza' + (g ? ' è a ' + p(g) : ' è a pari punti') : '';
};
