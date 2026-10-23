// M8 phase J (J11): the match calendar.
//   watch(G, seen)   called by checks.watch for every career: per season, every league match played once and every
//                    club with all its matches (J11.1), no club twice on a date and under 1% of short rests (J11.2),
//                    the last two matchdays on one date each and never moved (J11.3), every cup round drawn before
//                    its date (J11.4), no stop inside a simulated block (J11.7). Problems go to seen.cal.
//   CHECKS           quick checks for tests/checks-m8.js: one club match per "Prossima partita" (J11.5), the ⏭ button
//                    stops on the eve of an important match and never plays a decisive moment by itself (J11.6)
'use strict';

function watch(G, seen) {
  const out = seen.cal = [];
  let cur = null;
  const hook = (obj, k, before, after) => { const f = obj[k]; obj[k] = function () { if (before) before(arguments); const r = f.apply(this, arguments); if (after) after(r, arguments); return r; }; };
  hook(G.season, 'start', null, (r, a) => { cur = { pairs: {}, dates: {} }; lastTwo(G, a[0], out); });
  hook(G.match, 'play', null, (r, a) => {
    const S = a[0].S, comp = a[3];
    if (!cur || !S || !S.cal || !S.cur || S.cur.b > 4) return;
    if (comp.lg) { const k = a[1] + '-' + a[2]; cur.pairs[k] = (cur.pairs[k] || 0) + 1; }
    [a[1], a[2]].forEach(id => (cur.dates[id] = cur.dates[id] || []).push(S.today));
  });
  hook(G.season, 'drawCup', null, (r, a) => {
    const st = a[0], S = st.S, cup = S.cups[a[1]], d = S.cal && S.cal.cup[a[1]][cup.r];
    if (S.cal && !(d > G.cal.now(st))) out.push(S.year + ' ' + cup.name + ': round ' + (cup.r + 1) + ' drawn on day ' + G.cal.now(st) + ', played on day ' + d);
  });
  hook(G.season, 'end', a => { if (cur) season(G, a[0], cur, out); cur = null; });
  hook(G.game, 'next', null, (r, a) => { if (a[1] === true && r && r.partial) out.push(a[0].year + ': a simulated block stopped before its end'); });
}

// At the end of a season: the league matches, then (with a calendar) the dates of every club
function season(G, st, cur, out) {
  const S = st.S, y = S.year, REST = G.CFG2.CAL.REST;
  G.LEAGUES.forEach(L => {
    const fx = G.season.fixtures(S, L.key), tab = S.lg[L.key].tab, n = {};
    fx.forEach(ms => ms.forEach(m => {
      n[m[0]] = (n[m[0]] || 0) + 1; n[m[1]] = (n[m[1]] || 0) + 1;
      const k = m[0] + '-' + m[1];
      if (S.cal && cur.pairs[k] !== 1 && out.length < 20) out.push(y + ' ' + L.name + ': ' + k + ' played ' + (cur.pairs[k] || 0) + ' times');
    }));
    Object.keys(n).forEach(id => { if (tab[id][0] !== n[id]) out.push(y + ' ' + L.name + ': club ' + id + ' played ' + tab[id][0] + ' of its ' + n[id] + ' matches'); });
  });
  if (!S.cal) return;
  let same = 0, short = 0, pairs = 0;
  Object.keys(cur.dates).forEach(id => {
    const d = cur.dates[id].slice().sort((p, q) => p - q);
    for (let i = 1; i < d.length; i++) { pairs++; if (d[i] === d[i - 1]) same++; else if (d[i] - d[i - 1] <= REST) short++; }
  });
  if (same) out.push(y + ': ' + same + ' times a club plays twice on the same date');
  if (short > pairs * 0.01) out.push(y + ': ' + short + ' of ' + pairs + ' rests with fewer than ' + REST + ' free days');
  lastTwo(G, st, out);
}

// The last matchdays of every league: one date each (never a Saturday split with the Sunday), never moved
function lastTwo(G, st, out) {
  const S = st.S;
  if (!S || !S.cal) return;
  G.LEAGUES.forEach(L => {
    const d = S.cal.lg[L.key], N = d.length, mv = S.cal.mv[L.key] || {};
    for (let md = N - G.CFG2.CAL.LAST_FIXED; md < N; md++) {
      if (G.cal.dow(d[md]) === 5) out.push(S.year + ' ' + L.name + ': matchday ' + (md + 1) + ' split over the weekend');
      if (Object.keys(mv).some(k => +k.split(':')[0] === md)) out.push(S.year + ' ' + L.name + ': a match of matchday ' + (md + 1) + ' moved');
    }
  });
}

// Settles what the UI would ask before the next match: an event (a moment: its first option), the season goal, the recap
function settle(G, st) {
  if (st.event) G.events.apply(st, 0);
  if (st.goalOffer && !st.goal) G.goals.pick(st, 0);
  st.recap = null;
}

// J11.5: "Prossima partita" plays one match of the user's club; none only when the block ends, an event stops it
// or the national team plays
function nextMatch(load) {
  const G = load(), out = [], st = G.game.newCareer({ name: 'Test Player', nat: 'ITA', role: 'ATT', foot: 'D', start: 'random', seed: 31 });
  G.state = st;
  let id = -1, n = 0, calls = 0;
  const play = G.match.play;
  G.match.play = function (s, h, a) { if (h === id || a === id) n++; return play.apply(this, arguments); };
  for (let i = 0; i < 160 && !st.over && st.year === G.CFG.START_YEAR; i++) {
    settle(G, st);
    if (st.S.block > 4) { G.game.next(st, true); continue; }
    id = G.season.myClub(st); n = 0;
    const rows = st.S.cur ? st.S.blockRows.length : 0, sum = G.game.next(st, false, true);
    const nt = st.S && st.S.cur ? st.S.blockRows.slice(rows).some(r => r.nt) : false;
    calls++;
    if (n > 1) out.push('"Prossima partita" played ' + n + ' matches of the club (call ' + calls + ')');
    if (n === 0 && sum && sum.partial && !st.event && !nt) out.push('"Prossima partita" played no match of the club (call ' + calls + ')');
  }
  if (calls < 40) out.push('only ' + calls + ' matches played one by one');
  return out.slice(0, 8);
}

// J11.6: ⏭ stops on the eve of an important match (or where one match at a time would stop) and never plays a
// decisive moment by itself
function skipImportant(load) {
  const G = load(), out = [], st = G.game.newCareer({ name: 'Test Player', nat: 'ITA', role: 'ATT', foot: 'D', start: 'random', seed: 33 });
  G.state = st;
  let skipping = false, moments = 0, stops = 0;
  const stop = G.moments.stop;
  G.moments.stop = function () { const r = stop.apply(this, arguments); if (r && skipping) moments++; return r; };
  for (let i = 0; i < 60 && !st.over && st.year < G.CFG.START_YEAR + 2; i++) {
    settle(G, st);
    if (st.S.block > 4) { G.game.next(st, true); continue; }
    const x = G.cal.important(st);
    if (x && x.n > 0) {
      skipping = true; G.game.skip(st); skipping = false;
      const id = G.season.myClub(st), e = st.S && st.S.cal && id >= 0 ? G.cal.next(st, id) : null;
      if (!st.event && st.S && st.S.cur && e && !G.season.importance(st, id, e)) out.push('⏭ stopped before an ordinary match: ' + e.name + ' ' + G.cal.label(st.S.cal, e.d));
      if (!st.event && st.S && st.S.cur && e && G.season.importance(st, id, e)) stops++;
    }
    settle(G, st);
    if (st.S && st.S.block <= 4) G.game.next(st, false, true);  // the important match, played by the user
  }
  if (moments) out.push('⏭ ran into ' + moments + ' decisive moment(s)');
  if (stops < 3) out.push('⏭ stopped before an important match only ' + stops + ' times in two seasons');
  return out;
}

const CHECKS = [
  { t: 'M8 J: "Prossima partita" plays one match of the club', f: nextMatch },
  { t: 'M8 J: ⏭ stops before the important match, never on a decisive moment', f: skipImportant }
];

module.exports = { watch, CHECKS };
