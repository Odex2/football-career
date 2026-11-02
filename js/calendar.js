// @ts-check
// The match calendar (M8 phase J J1-J4): every match of the season gets a date when the
// season starts. Dates are days counted from day 0, the first Saturday from 13 August. The cups and the European
// competitions have fixed dates; a league match that clashes with one of them moves (G.cal.resolve).

G.cal = {};
G.cal.DAY = 864e5;
G.cal.DOW = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
G.cal.DOWL = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
G.cal.MON = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
G.cal.MONL = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

// ---------- dates ----------
/** @param {number} d @returns {number} day of the week, Monday 0 ... Sunday 6 (day 0 is a Saturday) */
G.cal.dow = function (d) { return ((d + 5) % 7 + 7) % 7; };
/** @param {number} d @returns {number} the Monday of that week */
G.cal.monday = function (d) { return d - G.cal.dow(d); };
/** @param {SeasonCal} cal @param {number} d @returns {Date} */
G.cal.date = function (cal, d) { var p = cal.d0.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]) + d * G.cal.DAY); };
/** @param {SeasonCal} cal @param {number} d @returns {string} 'sab 17 ott' */
G.cal.label = function (cal, d) { var t = G.cal.date(cal, d); return G.cal.DOW[G.cal.dow(d)] + ' ' + t.getUTCDate() + ' ' + G.cal.MON[t.getUTCMonth()]; };
/** @param {SeasonCal} cal @param {number} d @returns {string} 'mercoledì 20 gennaio' */
G.cal.longLabel = function (cal, d) { var t = G.cal.date(cal, d); return G.cal.DOWL[G.cal.dow(d)] + ' ' + t.getUTCDate() + ' ' + G.cal.MONL[t.getUTCMonth()]; };
/** @param {SeasonCal} cal @param {number} d @returns {boolean} */
G.cal.inBreak = function (cal, d) { return cal.nt.some(function (n) { return d >= n && d <= n + 8; }); };
/** @param {SeasonCal} cal @param {number} d @returns {number} the block of a date, -1 outside the blocks */
G.cal.blockOf = function (cal, d) { for (var b = 0; b < cal.bl.length; b++) if (d >= cal.bl[b][0] && d <= cal.bl[b][1]) return b; return -1; };

// The last day already played: everything after it is still to play
/** @param {State} st @returns {number} */
G.cal.now = function (st) {
  var S = G.sure(st.S), cal = G.sure(S.cal), b = S.cur ? S.cur.b : S.block;
  return Math.max(S.today === undefined ? -1 : S.today, b <= 4 ? cal.bl[b][0] - 1 : cal.bl[4][1]);
};

// The Mondays of the block's weeks whose days from+..to+ (1 Tuesday ... 3 Thursday) are in the block and out of the breaks
/** @param {SeasonCal} cal @param {number} b @param {number} from @param {number} to @returns {number[]} */
G.cal.weeks = function (cal, b, from, to) {
  var out = [], lo = cal.bl[b][0], hi = cal.bl[b][1];
  for (var m = G.cal.monday(lo); m <= hi; m += 7) {
    var ok = m + from >= lo && m + to <= hi;
    for (var d = m + from; d <= m + to && ok; d++) if (G.cal.inBreak(cal, d)) ok = false;
    if (ok) out.push(m);
  }
  return out;
};

/** @param {number[]} list @param {number} k @returns {number[]} k items spread evenly over the list */
G.cal.spread = function (list, k) { var out = []; for (var i = 0; i < k && list.length; i++) out.push(list[Math.floor((i + 0.5) * list.length / k)]); return out; };

// ---------- building the season (J1, J2) ----------
/** @param {State} st @returns {SeasonCal} */
G.cal.build = function (st) {
  var S = G.sure(st.S), Y = S.year, C = G.CFG, DAY = G.cal.DAY, CAL = G.CFG2.CAL, a13 = Date.UTC(Y, 7, 13), ms0 = a13 + ((6 - new Date(a13).getUTCDay() + 7) % 7) * DAY;
  var off = /** @param {number} y @param {number} m @param {number} d */ function (y, m, d) { return Math.round((Date.UTC(y, m, d) - ms0) / DAY); };
  var may31 = off(Y + 1, 4, 31), L = may31 - (G.cal.dow(may31) + 2) % 7;  // L: the last Saturday of May
  var nov1 = off(Y, 10, 1), mar31 = off(Y + 1, 2, 31);
  /** @type {SeasonCal} */
  var cal = { d0: new Date(ms0).toISOString().slice(0, 10), lg: {}, mv: {}, cup: {}, eu: {},
    bl: [[0, off(Y, 8, 30)], [off(Y, 9, 1), off(Y, 11, 21)], [off(Y + 1, 0, 2), off(Y + 1, 2, 1) - 1], [off(Y + 1, 2, 1), L - 13], [L - 12, may31]],
    // national team breaks: the Monday of the second full week of November and of the last full week of March
    nt: [nov1 + (7 - G.cal.dow(nov1)) % 7 + 7, mar31 - (G.cal.dow(mar31) + 1) % 7 - 6] };
  // European weeks: the same for the three competitions (Champions League Tuesday and Wednesday, the others Thursday)
  var wk = /** @param {number} b */ function (b) { return G.cal.weeks(cal, b, 1, 3); };
  var feb = wk(2).filter(function (m) { return G.cal.date(cal, m + 2).getUTCMonth() === 1; }), po = feb.slice(Math.floor((feb.length - 2) / 2)).slice(0, 2);
  var autumn = G.cal.spread(wk(1), 5), winter = G.cal.spread(wk(2).filter(function (m) { return m < po[0]; }), 3);
  var two = /** @param {number} d */ function (d) { var m = G.cal.monday(d); return [m, m + 7]; };
  var ko = { po: po, r16: two(off(Y + 1, 2, 10)), qf: two(off(Y + 1, 3, 8)), sf: two(off(Y + 1, 3, 29)) }, /** @type {Dict<number>} */ euroW = {};
  autumn.concat(winter, ko.po, ko.r16, ko.qf, ko.sf).forEach(function (m) { euroW[m] = 1; });
  G.EU_KEYS.forEach(function (k) {
    var day = k === 'UCL' ? 1 : 3, md = C.UEFA[k].md, nA = Math.ceil(md * 0.6), at = /** @param {number} m */ function (m) { return m + day; };
    cal.eu[k] = { lp: autumn.slice(0, nA).concat(winter.slice(0, md - nA)).map(at), po: ko.po.map(at), r16: ko.r16.map(at), qf: ko.qf.map(at), sf: ko.sf.map(at),
      f: k === 'UCL' ? L : k === 'UECL' ? L - 3 : L - 10 };
  });
  // national cups: Tuesday (half the ties on Wednesday) in the weeks without Europe, the final on Saturday L - 7
  var lastWeek = G.cal.monday(L - 19);  // between the last two league Sundays: no cup there
  G.DATA.nations.forEach(function (n) {
    var cup = S.cups[n.id], R = cup.R, /** @type {number[][]} */ per = [[], [], [], []], dates = [];
    for (var r = 0; r < R - 1; r++) per[Math.floor(r * 4 / Math.max(1, R - 1))].push(r);
    per.forEach(function (rs, b) {
      var all = G.cal.weeks(cal, b, 1, 2), free = all.filter(function (m) { return !euroW[m] && m !== lastWeek; });
      if (!free.length) free = all;
      G.cal.spread(free, rs.length).forEach(function (m, j) { dates[rs[j]] = m + 1; });
    });
    dates[R - 1] = L - 7;
    cal.cup[n.id] = dates;
  });
  // leagues: the same matchdays per block as always, on the block's weekends; the extra ones on Wednesday
  G.LEAGUES.forEach(function (Lg) {
    var N = G.season.fixtures(S, Lg.key).length, /** @type {number[]} */ dates = [], prev = 0, cum = 0, cups = cal.cup[Lg.nat] || [], eu = !!C.UEFA_ACCESS[Lg.nat];
    for (var b = 0; b < 4; b++) {
      cum += C.BLOCK_SHARE[b];
      var T = Math.round(N * Math.min(1, cum + 1e-9)), n = T - prev, lo = cal.bl[b][0], hi = cal.bl[b][1], /** @type {number[]} */ ends = [], /** @type {number[]} */ brk = [];
      prev = T;
      for (var s = lo + (5 - G.cal.dow(lo) + 7) % 7; s + 1 <= hi; s += 7) (G.cal.inBreak(cal, s) || G.cal.inBreak(cal, s + 1) ? brk : ends).push(s);
      var slots = [];
      if (n <= ends.length) for (var i = 0; i < n; i++) slots.push(ends[b === 3 ? (n === 1 ? ends.length - 1 : Math.floor(i * (ends.length - 1) / (n - 1))) : Math.floor(i * ends.length / n)]);
      else {
        // Wednesdays: first the weeks with no European and no cup match, then those with the cup, then the European ones,
        // then (only the MLS needs it) the national team breaks
        var weds = G.cal.weeks(cal, b, 2, 2).map(function (m) { return m + 2; }), extra = n - ends.length, /** @type {number[]} */ picked = [];
        var tiers = [weds.filter(function (w) { return (!eu || !euroW[w - 2]) && cups.indexOf(w - 1) < 0; }), weds.filter(function (w) { return (!eu || !euroW[w - 2]) && cups.indexOf(w - 1) >= 0; }),
          weds.filter(function (w) { return eu && euroW[w - 2]; }), brk.concat(cal.nt.map(function (x) { return x + 2; }).filter(function (w) { return w >= lo && w <= hi; }))];
        tiers.forEach(function (t) { var k = Math.min(t.length, extra - picked.length); picked = picked.concat(G.cal.spread(t, k)); });
        slots = ends.concat(picked).sort(function (x, y) { return x - y; });
      }
      slots.forEach(function (d) { dates.push(dates.length >= N - CAL.LAST_FIXED && G.cal.dow(d) === 5 ? d + 1 : d); });
    }
    cal.lg[Lg.key] = dates;
  });
  return cal;
};

// ---------- league dates ----------
/** @param {Season} S @param {LeagueKey} key @param {number} md @param {number} i @returns {number} the date before any move */
G.cal.base = function (S, key, md, i) {
  var d = G.sure(S.cal).lg[key][md];
  return G.cal.dow(d) === 5 && i >= Math.ceil(G.season.fixtures(S, key)[md].length / 2) ? d + 1 : d;
};
/** @param {Season} S @param {LeagueKey} key @param {number} md @param {number} i @returns {number} */
G.cal.when = function (S, key, md, i) {
  var mv = G.sure(S.cal).mv[key], k = md + ':' + G.season.fixtures(S, key)[md][i][0];
  return mv && mv[k] !== undefined ? mv[k] : G.cal.base(S, key, md, i);
};

// The dates of a block on which something is played, in order
/** @param {State} st @param {number} b @returns {number[]} */
G.cal.days = function (st, b) {
  var S = G.sure(st.S), cal = G.sure(S.cal), lo = cal.bl[b][0], hi = cal.bl[b][1], /** @type {Dict<number>} */ set = {};
  var add = /** @param {number} d @param {boolean} [two] */ function (d, two) { if (d >= lo && d <= hi) set[d] = 1; if (two && d + 1 >= lo && d + 1 <= hi) set[d + 1] = 1; };
  G.LEAGUES.forEach(function (L) {
    cal.lg[L.key].forEach(function (d) { add(d, G.cal.dow(d) === 5); });
    var mv = cal.mv[L.key] || {};
    Object.keys(mv).forEach(function (k) { add(mv[k]); });
  });
  Object.keys(cal.cup).forEach(function (k) { var cup = S.cups[k]; cal.cup[k].forEach(function (d, r) { if (r >= cup.r && cup.winner === null) add(d, G.cal.dow(d) === 1); }); });
  G.EU_KEYS.forEach(function (k) {
    var c = cal.eu[k], ucl = k === 'UCL';
    c.lp.concat(c.po, c.r16, c.qf, c.sf).forEach(function (d) { add(d, ucl); });
    add(c.f);
  });
  cal.nt.forEach(function (d) { add(d); });
  return Object.keys(set).map(Number).sort(function (x, y) { return x - y; });
};

/** @param {number} d @param {number} i @param {number} n @param {number} dw @returns {number} the i-th of n matches on a split date (dw: the first day, 5 Saturday or 1 Tuesday) */
G.cal.half = function (d, i, n, dw) { return G.cal.dow(d) === dw && i >= Math.ceil(n / 2) ? d + 1 : d; };
/** @param {EuroComp} comp @param {EuroCal} c @returns {number[]} the dates of the knockout round being played */
G.cal.koDates = function (comp, c) { return comp.stage === 'f' ? [c.f] : ({ po: c.po, r16: c.r16, qf: c.qf, sf: c.sf })[comp.stage] || []; };

// ---------- clashes (J3) ----------
// Every league match still to play after today: the matchdays from lg.md on, and those moved past today from before
/** @param {Season} S @param {LeagueKey} key @param {number} now @param {(md: number, i: number, m: number[], d: number) => void} fn */
G.cal.pending = function (S, key, now, fn) {
  var fx = G.season.fixtures(S, key), lo = S.lg[key].md, mv = G.sure(S.cal).mv[key] || {};
  Object.keys(mv).forEach(function (k) {
    if (mv[k] <= now) return;
    var p = k.split(':'), md = +p[0], h = +p[1];
    if (md < lo) fx[md].forEach(function (m, i) { if (m[0] === h) fn(md, i, m, mv[k]); });
  });
  for (var md = lo; md < fx.length; md++) fx[md].forEach(function (m, i) { var d = G.cal.when(S, key, md, i); if (d > now) fn(md, i, m, d); });
};

// Every match still to play of the clubs of some leagues: their league, the cup round drawn, Europe
/** @param {State} st @param {Dict<number>} keys @returns {Dict<CalBusy[]>} */
G.cal.busy = function (st, keys) {
  var S = G.sure(st.S), cal = G.sure(S.cal), now = G.cal.now(st), /** @type {Dict<CalBusy[]>} */ out = {};
  var put = /** @param {number} id @param {number} d @param {string} lab @param {string} k */ function (id, d, lab, k) { if (d > now && out[id]) out[id].push({ d: d, lab: lab, k: k }); };
  Object.keys(keys).forEach(function (key) { S.lg[key].ids.forEach(function (id) { out[id] = []; }); });
  Object.keys(keys).forEach(function (key) {
    var name = G.leagueByKey(key).name;
    G.cal.pending(S, key, now, function (md, i, m, d) { var k = key + ':' + md + ':' + m[0]; put(m[0], d, name, k); put(m[1], d, name, k); });
  });
  Object.keys(S.cups).forEach(function (n) {
    var cup = S.cups[n], d = cal.cup[n][cup.r];
    if (cup.winner !== null || !cup.ties || d === undefined) return;
    var real = cup.ties.filter(function (t) { return t[1] >= 0; }).length;
    cup.ties.forEach(function (t, i) { if (t[1] >= 0 && t[2] === undefined) { var x = G.cal.half(d, i, real, 1); put(t[0], x, cup.name, 'c'); put(t[1], x, cup.name, 'c'); } });
  });
  G.EU_KEYS.forEach(function (k) {
    var comp = S.eu[k], c = cal.eu[k];
    if (comp.stage === 'lp') {
      for (var md = comp.md; md < comp.fx.length; md++) comp.fx[md].forEach(function (m, i, all) { var x = G.cal.half(c.lp[md], i, all.length, 1); put(m[0], x, comp.name, 'e'); put(m[1], x, comp.name, 'e'); });
      return;
    }
    var ds = G.cal.koDates(comp, c);
    comp.ties.forEach(function (t, i) {
      if (t[2] !== undefined) return;
      ds.forEach(function (d, leg) { if (leg || !(comp.leg && comp.leg[i])) { var x = G.cal.half(d, i, comp.ties.length, 1); put(t[0], x, comp.name, 'e'); put(t[1], x, comp.name, 'e'); } });
    });
  });
  return out;
};

/** @param {Dict<CalBusy[]>} busy @param {number[]} m @param {number} x @param {number} r @param {string} self @returns {CalBusy|null} a match of either club less than r + 1 days from x */
G.cal.clash = function (busy, m, x, r, self) {
  for (var j = 0; j < m.length; j++) {
    var list = busy[m[j]] || [];
    for (var i = 0; i < list.length; i++) if (list[i].k !== self && Math.abs(list[i].d - x) <= r) return list[i];
  }
  return null;
};

// A new date for a league match: the same weekend, then a Tuesday-Thursday of the block, then of the next block,
// always before the last matchdays (with no rest asked, any free day will do); [date, step] or null
/** @param {State} st @param {Dict<CalBusy[]>} busy @param {LeagueKey} key @param {number[]} m @param {number} x @param {number} r @param {string} self @returns {number[]|null} */
G.cal.find = function (st, busy, key, m, x, r, self) {
  var S = G.sure(st.S), cal = G.sure(S.cal), now = G.cal.now(st), N = cal.lg[key].length, limit = cal.lg[key][N - G.CFG2.CAL.LAST_FIXED], b = G.cal.blockOf(cal, x), dw = G.cal.dow(x);
  var ok = /** @param {number} y */ function (y) { var by = G.cal.blockOf(cal, y); return y !== x && y > now && y < limit && by >= 0 && by <= 3 && !G.cal.inBreak(cal, y) && !G.cal.clash(busy, m, y, r, self); };
  var mid = /** @param {number} y */ function (y) { var w = G.cal.dow(y); return w >= 1 && w <= 3; };
  if (dw >= 5) { var s = x - dw + 5, same = [s, s + 1, s + 2, s - 1]; for (var j = 0; j < 4; j++) if (ok(same[j])) return [same[j], 1]; }
  for (var y = x + 1; y <= cal.bl[b][1]; y++) if (mid(y) && ok(y)) return [y, 2];
  if (b < 3) for (y = cal.bl[b + 1][0]; y <= cal.bl[b + 1][1]; y++) if (mid(y) && ok(y)) return [y, 3];
  // last resort (no rest asked): the nearest free day of any kind, before the last matchdays
  if (!r) for (var k = 1; k < 60; k++) { if (ok(x + k)) return [x + k, 2]; if (ok(x - k)) return [x - k, 1]; }
  return null;
};

// Moves the league matches that clash with a cup or European match of the same club (all clubs, or ids after a draw).
// The last matchdays never move; with no date that leaves 2 free days, one free day will do, then any other day.
/** @param {State} st @param {ClubId[]|null} ids */
G.cal.resolve = function (st, ids) {
  var S = G.sure(st.S), cal = G.sure(S.cal), W = st.world, CAL = G.CFG2.CAL, now = G.cal.now(st), my = G.season.myClub(st), /** @type {Dict<number>} */ keys = {}, /** @type {Dict<number>} */ set = {};
  (ids || W.clubs.map(function (c) { return c.id; })).forEach(function (id) { set[id] = 1; if (S.lg[W.clubs[id].lg]) keys[W.clubs[id].lg] = 1; });
  var busy = G.cal.busy(st, keys), /** @type {Dict<CalBusy[]>} */ fixed = {};
  Object.keys(busy).forEach(function (id) { fixed[id] = busy[id].filter(function (e) { return e.k === 'c' || e.k === 'e'; }); });  // cups and Europe
  Object.keys(keys).forEach(function (key) {
    var N = G.season.fixtures(S, key).length, mv = cal.mv[key] || (cal.mv[key] = {});
    G.cal.pending(S, key, now, function (md, i, m, x) {
      if (md >= N - CAL.LAST_FIXED || (!set[m[0]] && !set[m[1]])) return;
      var self = key + ':' + md + ':' + m[0], hit = G.cal.clash(fixed, m, x, CAL.REST, self);
      if (!hit) return;
      // with no date that leaves REST free days, settle for fewer: one free day, then just another day
      for (var r = CAL.REST, /** @type {number[]|null} */ y = null; r >= 0 && !y && G.cal.clash(busy, m, x, r, self); r--) y = G.cal.find(st, busy, key, m, x, r, self);
      if (!y) return;
      var to = y;
      m.forEach(function (id) { busy[id].forEach(function (e) { if (e.k === self) e.d = to[0]; }); });
      if (y[0] === G.cal.base(S, key, md, i)) delete mv[md + ':' + m[0]]; else mv[md + ':' + m[0]] = y[0];
      var cur = S.cur;
      if (cur && cur.days && cur.days.indexOf(y[0]) < 0 && G.cal.blockOf(cal, y[0]) === cur.b) { cur.days.push(y[0]); cur.days.sort(function (p, q) { return p - q; }); cur.D = cur.days.length; }
      if (y[1] > 1 && (m[0] === my || m[1] === my)) G.news(st, '⟳ ' + W.clubs[m[0]].name + '–' + W.clubs[m[1]].name + ' rinviata a ' + G.cal.longLabel(cal, y[0]) + ' per ' + (/^[AEIOU]/.test(hit.lab) ? 'l’' : 'la ') + hit.lab);
    });
  });
};
