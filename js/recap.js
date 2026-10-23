// @ts-check
// End-of-season recap: a full-screen summary built when a season closes, shown until the player continues.

G.recap = {};

/** @param {State} st @param {SeasonRecord} rec @param {Dict<ClubId[]>} tables @returns {PlayerRecap} */
G.recap.build = function (st, rec, tables) {
  var S = st.S, p = st.player, W = st.world, R = st.roll[0], club = W.clubs[rec.clubId], key = club.lg, ids = tables[key];
  var tab = S.lg[key].tab, me = rec.pos - 1, L = G.leagueByKey(key), s0 = S.start0 || { ovr: p.ovr, fame: p.fame, money: p.money + p.invest };
  var table = ids.map(function (id, i) { return { pos: i + 1, id: id, pts: tab[id][6], gd: tab[id][4] - tab[id][5], me: i === me }; })
    .filter(function (x) { return x.pos <= 3 || Math.abs(x.pos - 1 - me) <= 1 || x.pos > ids.length - 2; });
  return { year: S.year, rec: rec, club: rec.clubId, lg: rec.lg, tier: L.tier, pos: rec.pos, n: ids.length, nat: club.nat,
    ovr: [s0.ovr, p.ovr], fame: [Math.round(s0.fame), Math.round(p.fame)], money: [s0.money, p.money + p.invest],
    table: table, champion: ids[0], scorer: R.lg[key].scorer, pots: R.lg[key].pots, bdo: R.bdo.slice(0, 3), myBdo: R.myBdo, boot: R.boot,
    lgG: S.ps.lg[1], eu: R.eu, tours: st.ntRoll.filter(function (r) { return r.year === S.year + 1; }), best: S.best || null, role: p.role };
};

/** @param {PlayerRecap} R @returns {string} */
G.recap.verdict = function (R) {
  var C = G.CFG, twoDiv = G.NATIONS[R.nat] && G.NATIONS[R.nat].leagues.length > 1;
  if (R.pos === 1) return '🏆 Campione di ' + R.lg;
  if (R.tier === 2 && R.pos <= C.PROMO_SLOTS) return '⬆️ Promosso: ' + R.pos + 'º in ' + R.lg;
  if (R.tier === 1 && twoDiv && R.pos > R.n - C.PROMO_SLOTS) return '⬇️ Retrocesso: ' + R.pos + 'º in ' + R.lg;
  return R.pos + 'º in ' + R.lg;
};

/** @param {number} a @param {number} b @param {(x: number) => string|number} [fmt] @returns {string} */
G.recap.delta = function (a, b, fmt) {
  var d = b - a, f = fmt || /** @param {number} x */ function (x) { return Math.round(x); };
  return '<span class="' + (d > 0 ? 'up' : d < 0 ? 'down' : 'muted') + '">' + (d > 0 ? '▲ ' : d < 0 ? '▼ ' : '') + f(Math.abs(d)) + '</span>';
};

/** @param {State} st @returns {string} */
G.recap.render = function (st) {
  var R = /** @type {PlayerRecap} */ (st.recap), rec = R.rec, p = st.player, W = st.world, club = W.clubs[R.club], U = G.ui, delay = 0;
  var sec = /** @param {string} title @param {string} body @param {string} [cls] */ function (title, body, cls) { delay += 0.12; return '<section class="rc-sec ' + (cls || '') + '" style="animation-delay:' + delay.toFixed(2) + 's">' + (title ? '<h4>' + title + '</h4>' : '') + body + '</section>'; };
  var big = /** @param {string|number} v @param {string} l @param {string} [sub] */ function (v, l, sub) { return '<div class="rc-kpi"><b>' + v + '</b><span>' + l + '</span>' + (sub ? '<i>' + sub + '</i>' : '') + '</div>'; };
  var gk = R.role === 'POR';
  var kpis = big(rec.apps + '<small>/' + (rec.matches || rec.apps) + '</small>', 'Presenze') + big(rec.goals, 'Gol', R.lgG !== undefined ? R.lgG + ' in campionato' : '') + big(rec.assists, 'Assist') +
    (gk ? big(rec.cs, 'Porta inviolata') : '') +
    '<div class="rc-kpi"><b class="' + U.rcls(rec.avg) + '">' + (rec.avg ? rec.avg.toFixed(2) : '-') + '</b><span>Voto medio</span></div>' +
    big(R.ovr[1], 'Overall', G.recap.delta(R.ovr[0], R.ovr[1])) + big(R.fame[1], 'Fama', G.recap.delta(R.fame[0], R.fame[1])) +
    big(U.money(R.money[1]), 'Patrimonio', G.recap.delta(R.money[0], R.money[1], U.money));
  var wins = rec.trophies.map(function (t) { return '<div class="rc-badge">' + G.tro.icon(t, 24) + ' ' + t + '</div>'; }).join('') +
    rec.awards.map(function (t) { return '<div class="rc-badge gold">' + G.tro.icon(t, 24) + ' ' + t + '</div>'; }).join('') +
    (rec.records || []).map(function (t) { return '<div class="rc-badge gold">📜 ' + t + '</div>'; }).join('') +
    (rec.captain ? '<div class="rc-badge">©️ Capitano del ' + rec.club + '</div>' : '') +
    (rec.goal ? '<div class="rc-badge' + (rec.goal.ok ? ' gold' : '') + '">🎯 Obiettivo ' + (rec.goal.ok ? 'raggiunto' : 'mancato') + ': ' + rec.goal.t + (rec.goal.up ? ' · potenziale +1' : '') + '</div>' : '') +
    (rec.bonus ? '<div class="rc-badge">💶 Bonus contrattuali: ' + U.money(rec.bonus) + '</div>' : '') +
    (rec.potUp ? '<div class="rc-badge">📈 Potenziale in crescita' + (rec.potUp > 1 ? ' (molto)' : '') + '</div>' : '');
  var bdo = R.myBdo ? (R.myBdo <= 3 ? '🥇🥈🥉'.substr((R.myBdo - 1) * 2, 2) + ' ' : '⚽ ') + R.myBdo + 'º al Pallone d’Oro' : '';
  var b = R.best;
  var best = b ? '<div class="rc-best">' + (b.nt ? U.nat(/** @type {NationCode} */ (b.opp)) : U.club(/** @type {ClubId} */ (b.opp), 22)) + ' <b>' + b.gf + '-' + b.ga + '</b> <span class="muted">' + b.comp + '</span>' +
    '<div><span class="' + U.rcls(b.r) + '"><b>' + b.r + '</b></span> ' + (b.g ? '⚽'.repeat(Math.min(b.g, 5)) : '') + (b.a ? '🅰️'.repeat(Math.min(b.a, 4)) : '') + '</div></div>' : '<p class="muted">Nessuna partita giocata.</p>';
  var table = '<table>' + R.table.map(function (x, i) {
    var gap = i > 0 && x.pos - R.table[i - 1].pos > 1 ? '<tr><td colspan="4" class="muted">…</td></tr>' : '';
    return gap + '<tr class="' + (x.me ? 'me' : '') + '"><td>' + x.pos + '</td><td>' + U.club(x.id, 16) + '</td><td class="num muted">' + (x.gd > 0 ? '+' : '') + x.gd + '</td><td class="num"><b>' + x.pts + '</b></td></tr>';
  }).join('') + '</table>';
  var who = /** @param {AwardShort} e @param {'g'|'avg'} [k] */ function (e, k) { return e ? (e.me ? '<b>' + e.n + '</b>' : e.n) + ' <span class="muted small">' + e.club + (k ? ' · ' + e[k] : '') + '</span>' : '—'; };
  var lg = '<div>🏆 ' + U.club(R.champion, 18) + '</div><div class="small">⚽ Capocannoniere: ' + who(R.scorer, 'g') + '</div><div class="small">🌟 Player of the Season: ' + who(R.pots, 'avg') + '</div>' + table;
  var world = R.bdo.map(function (e, i) { return '<div class="small">' + ['🥇', '🥈', '🥉'][i] + ' ' + who(e) + '</div>'; }).join('') +
    (R.boot ? '<div class="small">👢 Scarpa d’Oro: ' + who(R.boot, 'g') + ' <span class="muted">(contano solo i gol in campionato)</span></div>' : '') +
    G.EU_KEYS.map(function (k) { return R.eu[k] ? '<div class="small">🏆 ' + G.CFG.UEFA[k].name + ': ' + R.eu[k] + '</div>' : ''; }).join('') +
    R.tours.map(function (t) { return '<div class="small">🌍 ' + t.n + ' ' + t.year + ': ' + U.nat(t.winner) + (t.mine ? ' <span class="muted">(' + U.flag(p.nat) + ' ' + t.mine.toLowerCase() + ')</span>' : '') + '</div>'; }).join('');
  var ach = Object.keys(p.ach || {}).filter(function (id) { return p.ach[id] === R.year; }).map(function (id) {
    var a = G.ach.get(id); return '<div class="rc-badge">' + a[1] + ' ' + a[2] + '</div>';
  }).join('');
  return '<div class="recap"><button class="rc-skip" data-act="recap">Continua ▶</button><div class="recap-in">' +
    sec('', '<div class="rc-head">' + G.crest(club, 84) + '<div><div class="muted">Fine stagione ' + G.season.label(R.year) + ' · ' + rec.age + ' anni</div>' +
      '<h1>' + G.recap.verdict(R) + '</h1><div class="rc-club">' + club.name + (rec.loan ? ' <span class="chip">prestito</span>' : '') + (rec.nt ? ' · 🌍 ' + rec.nt : '') + (bdo ? ' · ' + bdo : '') + '</div></div></div>') +
    sec('La tua stagione', '<div class="rc-kpis">' + kpis + '</div>') +
    (wins ? sec('Trofei e premi', '<div class="rc-badges">' + wins + '</div>') : '') +
    '<div class="rc-cols">' + sec('Partita migliore', best) + sec(R.lg, lg) + sec('Il resto del calcio', world || '<p class="muted">—</p>') + '</div>' +
    (ach ? sec('Obiettivi sbloccati', '<div class="rc-badges">' + ach + '</div>') : '') +
    sec('', '<button class="big" data-act="recap">Continua ▶</button>', 'rc-end') + '</div></div>';
};
