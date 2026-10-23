// @ts-check
// UI tab: career charts (overall curve, goals and assists per season), records and the rival.

/** @type {Dict<string>} */
G.ui.CH = { me: '#19a97a', riv: '#c4862a' };  // validated pair on the dark panel (dataviz validator)

// Line chart: series [{ name, color, pts: [[label, y]] , dash }] sharing the same x labels
/** @param {string[]} labels @param {ChartSeries[]} series @returns {string} */
G.ui.lineChart = function (labels, series) {
  var W = 640, H = 230, L = 34, R = 70, T = 12, B = 26, /** @type {number[]} */ all = [];
  series.forEach(function (s) { s.pts.forEach(function (q) { all.push(q[1]); }); });
  if (!all.length) return '<p class="muted">Ancora nessuna stagione conclusa.</p>';
  var lo = Math.floor((Math.min.apply(null, all) - 2) / 5) * 5, hi = Math.ceil((Math.max.apply(null, all) + 1) / 5) * 5;
  var x = /** @param {number} i */ function (i) { return L + (labels.length < 2 ? 0 : i * (W - L - R) / (labels.length - 1)); };
  var y = /** @param {number} v */ function (v) { return T + (hi - v) * (H - T - B) / Math.max(1, hi - lo); };
  var g = '', step = Math.max(5, Math.round((hi - lo) / 4 / 5) * 5);
  for (var v = lo; v <= hi; v += step) g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="ch-grid"/><text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" class="ch-ax" text-anchor="end">' + v + '</text>';
  var every = Math.ceil(labels.length / 8);
  labels.forEach(function (l, i) { if (i % every === 0 || i === labels.length - 1) g += '<text x="' + x(i) + '" y="' + (H - 6) + '" class="ch-ax" text-anchor="middle">' + l + '</text>'; });
  series.forEach(function (s) {
    var idx = /** @param {string} lab */ function (lab) { return labels.indexOf(lab); };
    var d = s.pts.map(function (q, k) { return (k ? 'L' : 'M') + x(idx(q[0])).toFixed(1) + ' ' + y(q[1]).toFixed(1); }).join(' ');
    g += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2"' + (s.dash ? ' stroke-dasharray="5 4"' : '') + ' stroke-linejoin="round"/>';
    s.pts.forEach(function (q) {
      g += '<circle cx="' + x(idx(q[0])) + '" cy="' + y(q[1]) + '" r="4" fill="' + s.color + '" stroke="#152033" stroke-width="2"><title>' + s.name + ' · ' + q[0] + ': ' + q[1] + '</title></circle>';
    });
    var last = s.pts[s.pts.length - 1];
    if (last) g += '<text x="' + (x(idx(last[0])) + 8) + '" y="' + (y(last[1]) + 4) + '" class="ch-lab">' + s.name + ' ' + last[1] + '</text>';
  });
  var legend = series.length > 1 ? '<div class="ch-legend">' + series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + s.name + '</span>'; }).join('') + '</div>' : '';
  return legend + '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img">' + g + '</svg>';
};

// Grouped bars per season: goals and assists
/** @param {BarRow[]} rows @returns {string} */
G.ui.barChart = function (rows) {
  if (!rows.length) return '<p class="muted">Ancora nessuna stagione conclusa.</p>';
  var W = 640, H = 220, L = 30, R = 8, T = 10, B = 26, max = 5;
  rows.forEach(function (r) { max = Math.max(max, r.g, r.a); });
  max = Math.ceil(max / 10) * 10;
  var bw = (W - L - R) / rows.length, w = Math.max(3, Math.min(14, bw / 2 - 3)), y = /** @param {number} v */ function (v) { return T + (max - v) * (H - T - B) / max; }, g = '';
  for (var v = 0; v <= max; v += max / 2) g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="ch-grid"/><text x="' + (L - 5) + '" y="' + (y(v) + 4) + '" class="ch-ax" text-anchor="end">' + v + '</text>';
  var every = Math.ceil(rows.length / 10);
  rows.forEach(function (r, i) {
    var cx = L + bw * i + bw / 2;
    /** @type {['g'|'a', string, string, number][]} */ ([['g', G.ui.CH.me, 'gol', -1], ['a', G.ui.CH.riv, 'assist', 1]]).forEach(function (k) {
      var v = r[k[0]], top = y(v), x0 = k[3] < 0 ? cx - w - 1 : cx + 1;
      if (v > 0) g += '<rect x="' + x0 + '" y="' + top + '" width="' + w + '" height="' + (y(0) - top) + '" rx="2" fill="' + k[1] + '"><title>' + r.label + ': ' + v + ' ' + k[2] + '</title></rect>';
    });
    if (i % every === 0) g += '<text x="' + cx + '" y="' + (H - 6) + '" class="ch-ax" text-anchor="middle">' + r.label + '</text>';
  });
  return '<div class="ch-legend"><span><i style="background:' + G.ui.CH.me + '"></i>Gol</span><span><i style="background:' + G.ui.CH.riv + '"></i>Assist</span></div>' +
    '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img">' + g + '</svg>';
};

/** @param {State} st @returns {string} */
G.ui.statsTab = function (st) {
  var p = st.player, R = G.rec.init(st), W = st.world, short = /** @param {number} y */ function (y) { return String(y).slice(2) + '/' + String(y + 1).slice(2); };
  var years = p.history.map(function (h) { return h.year; }), rlog = R.rivalLog;
  rlog.forEach(function (x) { if (years.indexOf(x.year) < 0) years.push(x.year); });
  years.sort(); var labels = years.map(short);
  var /** @type {ChartSeries[]} */ series = [{ name: 'Tu', color: G.ui.CH.me, pts: p.history.map(function (h) { return [short(h.year), h.ovr]; }) }];
  if (rlog.length) series.push({ name: R.rival.n.split(' ').pop(), color: G.ui.CH.riv, dash: 1, pts: rlog.map(function (x) { return [short(x.year), x.o]; }) });
  var bars = p.history.map(function (h) { return { label: short(h.year), g: h.goals, a: h.assists }; });
  var me = R.me, row = /** @param {string} l @param {string|number} v */ function (l, v) { return '<tr><td>' + l + '</td><td class="num"><b>' + v + '</b></td></tr>'; };
  var natName = /** @param {{ nt?: number, opp?: any }} m opp: a club id, or a nation code when nt */ function (m) { return m.nt ? G.national.name(m.opp) : W.clubs[m.opp] ? W.clubs[m.opp].name : ''; };
  var pers = '<table>' +
    row('Gol in una stagione', me.seasonG ? me.seasonG.v + ' <span class="muted small">' + G.season.label(me.seasonG.year) + '</span>' : '—') +
    row('Assist in una stagione', me.seasonA ? me.seasonA.v + ' <span class="muted small">' + G.season.label(me.seasonA.year) + '</span>' : '—') +
    row('Media voto in una stagione', me.avg ? me.avg.v.toFixed(2) + ' <span class="muted small">' + G.season.label(me.avg.year) + '</span>' : '—') +
    row('Gol in una partita', me.matchG ? me.matchG.v + ' <span class="muted small">contro ' + natName(me.matchG) + '</span>' : '—') +
    row('Overall più alto', Math.max(p.peak || 0, p.ovr)) +
    row('Palloni d’Oro', p.awards.filter(function (a) { return a.name === 'Pallone d’Oro'; }).length) + '</table>';
  var lgKeys = ['ENG1', 'ESP1', 'ITA1', 'GER1', 'FRA1'], cur = W.clubs[p.clubId].lg;
  if (lgKeys.indexOf(cur) < 0) lgKeys.push(cur);
  var lgs = '<table><tr><th>Campionato</th><th>Record di gol in una stagione</th><th class="num">Gol</th></tr>' + lgKeys.map(function (k) {
    var x = R.lg[k], L = G.leagueByKey(k);
    return '<tr class="' + (x.me ? 'me' : '') + '"><td>' + G.NATIONS[L.nat].flag + ' ' + L.name + '</td><td>' + (x.n ? x.n + ' <span class="muted small">' + (x.real ? x.year + '/' + String(x.year + 1).slice(2) : G.season.label(x.year)) + '</span>' : '<span class="muted">nessuno oltre ' + x.g + '</span>') + '</td><td class="num"><b>' + x.g + '</b></td></tr>';
  }).join('') + '</table><p class="muted small">Batti il record con i gol in campionato: entri nella storia e guadagni fama.</p>';
  var rv = R.rival, pl = G.rec.rivalPlayer(st), duel = rv ? G.rec.duel(st) : null;
  var rival = !rv ? '<p class="muted">Quando compi 19 anni i media ti trovano un rivale: il talento più forte della tua generazione.</p>' :
    '<div class="row"><div class="grow"><h2 style="margin:0">' + (pl ? G.ui.flag(pl.nt) + ' ' : '') + rv.n + '</h2><div class="muted">' +
      (pl ? G.ROLES[pl.r].label + ' · ' + pl.a + ' anni · ' + (pl.c >= 0 ? W.clubs[pl.c].name : 'svincolato') + ' · overall ' + Math.round(pl.o) : 'Ritirato nel ' + rv.ret) + '</div></div></div>' +
    '<table><tr><th></th><th class="num">Tu</th><th class="num">' + rv.n.split(' ').pop() + '</th></tr>' +
    '<tr><td>Gol (dal ' + rv.since + ')</td><td class="num"><b>' + duel.me.g + '</b></td><td class="num">' + duel.him.g + '</td></tr>' +
    '<tr><td>Assist</td><td class="num"><b>' + duel.me.a + '</b></td><td class="num">' + duel.him.a + '</td></tr>' +
    '<tr><td>Palloni d’Oro</td><td class="num"><b>' + duel.me.bdo + '</b></td><td class="num">' + duel.him.bdo + '</td></tr></table>' +
    '<p class="small">Davanti a lui nel Pallone d’Oro in <b>' + duel.aheadBdo + '</b> stagioni su ' + duel.seasons + '.</p>';
  var clubs = Object.keys(p.goalsAt || {}).map(/** @param {any} id a club id (an object key, so a string) */ function (id) {
    return '<tr><td>' + G.ui.club(+id, 16) + '</td><td class="num">' + (p.seasonsAt[id] || 0) + '</td><td class="num"><b>' + p.goalsAt[id] + '</b></td></tr>';
  }).join('');
  return '<div class="grid two">' + G.ui.card('Stagione per stagione', '<div class="scroll">' + G.ui.historyTable(p) + '</div>', 'span3') + G.ui.card('Andamento dell’overall', G.ui.lineChart(labels, series), 'span3') +
    G.ui.card('Gol e assist per stagione', G.ui.barChart(bars)) + G.ui.card('Il tuo rivale', rival) +
    G.ui.card('Record personali', pers) + G.ui.card('Record dei campionati', lgs) +
    G.ui.card('Gol per club', clubs ? '<table><tr><th>Club</th><th class="num">Stagioni</th><th class="num">Gol</th></tr>' + clubs + '</table>' : '<p class="muted">Ancora nessun gol.</p>') + '</div>';
};
