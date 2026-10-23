// The board (M8 phase F F1-F2), for tests/checks-m8.js:
//   verdict   at the end of the season the job's security moves by (score - 0.5) x 2 x END_CONF (+ trophies), the
//             score being the weighted mean of the goals; every cup or European goal missed cost 4 during the season
//   ct        a national team's offer about one season in four, the ct's strength, the job lost without qualifying
'use strict';

const { bologna } = require('./checks-deal');

// F1, three seasons at Inter and at Bologna with the board never sacking
function verdict(load) {
  const out = [];
  ['Inter', 'Bologna'].forEach((name, n) => {
    const G = load(), st = G.game.newManager({ name: 'Test Manager', nat: 'ITA', bg: 'prov', age: 40, seed: 81 + n }), M = G.CFG.MGR, V = { ok: 1, mid: 0.5, ko: 0 };
    G.state = st;
    G.mgr.start(st, { club: st.world.clubs.find(c => c.name === name).id, fans: 0, perks: null, bandiera: 0 });
    const m = st.mgr, end = G.mgr.seasonEnd, say = G.news;
    let early = 0, missed = 0, judged = 0;  // judged: the -4 of the seasons already over
    G.news = function (s, t) { if (/prima dell’obiettivo/.test(t)) early++; return say.apply(this, arguments); };
    G.mgr.seasonEnd = function (s) {
      m.conf = 50;  // room both ways
      const r = end.apply(this, arguments), R = s.recap;
      if (!R || !R.goals) { out.push(name + ': no goals in the recap'); return r; }
      const w = { alta: 3, media: 2, bassa: 1 }, sw = R.goals.reduce((a, g) => a + w[g.imp], 0), sc = R.goals.reduce((a, g) => a + w[g.imp] * V[g.st], 0) / sw;
      const want = Math.round(Math.max(-20, Math.min(100, 50 + (sc - 0.5) * 2 * M.END_CONF + R.won.length * M.TROPHY_CONF)));
      if (Math.abs(sc - R.score) > 1e-9 || R.conf !== want) out.push(name + ' ' + R.year + ': score ' + R.score + ' (' + sc + '), security ' + R.conf + ' instead of ' + want);
      if (R.goals[0].k !== 'lg' || R.goals[0].imp !== 'alta' || R.goals.some(g => g.st !== 'ok' && g.st !== 'mid' && g.st !== 'ko')) out.push(name + ': goals ' + JSON.stringify(R.goals));
      missed += R.goals.filter(g => (g.k === 'cup' || g.k === 'eu') && g.st !== 'ok').length; judged = early;
      return r;
    };
    for (let i = 0; i < 15 && G.mgr.active(st); i++) { st.event = null; st.recap = null; st.mgrOffers = null; m.conf = Math.max(m.conf, 40); G.game.next(st, true); }
    if (judged !== missed) out.push(name + ': ' + missed + ' cup or European goals missed, ' + judged + ' times -4');
  });
  return out;
}

// F2
function ct(load) {
  const G = load(), out = [], st = bologna(G, 82), m = st.mgr, y0 = st.S.year;
  m.rep = 80;
  let offers = 0;
  for (let y = 0; y < 40; y++) { st.S.year = y0 + y; m.ntOffer = null; G.mgrBoard.ntCall(st); if (m.ntOffer) offers++; }
  st.S.year = y0;
  if (offers < 4 || offers > 18) out.push(offers + ' offers in 40 seasons, not about 10');
  m.rep = 69; m.ntOffer = null;
  for (let y = 0; y < 20; y++) { st.S.year = y0 + y; G.mgrBoard.ntCall(st); }
  if (m.ntOffer) out.push('an offer with reputation 69');
  st.S.year = y0; m.rep = 80; m.ntOffer = 'POR';
  const before = G.national.str(st, 'POR');
  G.mgrBoard.ntAnswer(st, true);
  const after = G.national.str(st, 'POR');
  if (m.nt !== 'POR' || Math.abs(after - before - 2) > 1e-9) out.push('ct of ' + m.nt + ': strength ' + before + ' -> ' + after);
  st.S.tours = { WC: { n: 'Mondiali', teams: ['ITA'], winner: 'ITA' } };
  if (G.mgrBoard.ntWon(st) !== null) out.push('a World Cup won by someone else counts');
  G.mgrBoard.ntQual(st);
  if (m.nt !== null || !(st.news || []).some(x => /non si qualifica .*incarico da ct finisce/.test(x.t))) out.push('Portugal out of the World Cup and still the ct');
  return out;
}

const CHECKS = [
  { t: 'M8 F: the board judges all its goals; an early exit costs 4', f: verdict },
  { t: 'M8 F: national teams call one season in four, the ct makes them stronger, no tournament ends the job', f: ct }
];

module.exports = { CHECKS };
