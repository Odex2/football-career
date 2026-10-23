// The academy (M8 phase E E5), for tests/checks-m8.js:
//   scouts     2 scouts of level 3 for 3 seasons find 10 to 20 boys, the true potential always in the range shown
//   retrain    a DC learning to play TS, always in the XI, has the new role after 4 blocks
//   training   intense training: about 30% more injuries over 8 seasons
'use strict';

const { bologna } = require('./checks-deal');

// E5.1
function scouts(load) {
  const G = load(), out = [], st = bologna(G, 61), m = st.mgr, y0 = st.S.year;
  [0, 1].forEach(i => { G.mgrYouth.hire(st); G.mgrYouth.setScout(st, i, 'lvl', '3'); G.mgrYouth.setScout(st, i, 'nat', i ? 'ARG' : 'BRA'); });
  if (m.ys.length !== 2 || m.ys.some(s => s.lvl !== 3)) return ['the scouts were not hired: ' + JSON.stringify(m.ys)];
  let n = 0;
  for (let k = 0; k < 40 && st.S.year < y0 + 3; k++) {
    st.event = null; G.game.next(st, true);
    if (!G.mgr.active(st)) return ['the manager lost his job in ' + st.S.year];
    m.yth.forEach(x => {
      const r = G.mgrYouth.pot(x);
      if ((x.p < r[0] || x.p > r[1]) && out.length < 3) out.push(x.n + ': potential ' + x.p + ' shown as ' + r.join('-'));
    });
    n += m.yth.length; m.yth = [];  // counted and let go, so the youth squad never fills up
  }
  if (n < 10 || n > 20) out.push(n + ' boys in 3 seasons');
  return out;
}

// E5.2
function retrain(load) {
  const G = load(), out = [], st = bologna(G, 62), m = st.mgr, W = st.world;
  G.mgrSq.injX = () => 0;  // nobody gets injured: he plays every match he can
  const xi = G.mgrTeam.xi(st).map(x => x.id), pl = xi.map(id => W.players[id]).find(p => p.r === 'DC');
  if (!pl) return ['no DC in the XI'];
  G.mgrYouth.setDev(st, pl.i, 'TS');
  if (!m.dev[pl.i]) return ['the plan for ' + pl.n + ' did not start'];
  for (let b = 0; b < 4; b++) {
    if (pl.r !== 'DC') out.push(pl.n + ' is a TS after ' + b + ' blocks');
    st.event = null; G.game.next(st, true);
  }
  if (pl.r !== 'TS' || m.dev[pl.i]) out.push(pl.n + ' is ' + pl.r + ' after 4 blocks' + (m.dev[pl.i] ? ', at ' + m.dev[pl.i].pr : ''));
  return out;
}

// E5.3: the same 8 seasons with normal and with intense training. A sacking ends a career early, so what is
// compared is the chance of an injury at every start, averaged over all of them (it holds the lower fitness too)
function training(load) {
  const rate = ['normale', 'intenso'].map(t => {
    const G = load(), st = bologna(G, 63), m = st.mgr, Q = G.CFG2.MGR_SQ, after = G.mgrSq.after;
    let sum = 0, n = 0;
    G.mgrSq.after = function (s, side) {
      side.ids.forEach(id => { sum += (Q.INJ_BASE + Math.max(0, 75 - G.mgrTeam.cond(m, id)) * Q.INJ_COND) * G.mgrSq.injX(m); n++; });
      return after.apply(this, arguments);
    };
    m.train = t;
    for (let i = 0; i < 40; i++) { st.event = null; st.mgrOffers = null; G.game.next(st, true); if (!G.mgr.active(st)) break; }
    return sum / Math.max(1, n);
  });
  const up = rate[1] / rate[0] - 1;
  return up < 0.2 || up > 0.5 ? ['an injury every ' + rate.map(r => Math.round(1 / r)).join(' starts with normal, ') + ' with intense training: ' + Math.round(up * 100) + '% more'] : [];
}

const CHECKS = [
  { t: 'M8 E: two scouts of level 3 find 10 to 20 boys in 3 seasons, the potential inside the range', f: scouts },
  { t: 'M8 E: a DC who always plays learns to play TS in 4 blocks', f: retrain },
  { t: 'M8 E: intense training brings about 30% more injuries', f: training }
];

module.exports = { CHECKS };
