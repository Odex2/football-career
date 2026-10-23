// The other improvements (M8 phase G G1-G4), for tests/checks-m8.js:
//   assistant  with the market switch on, the vice buys before the window closes: for a starter 5 or more under the
//              club's strength, a better player of the same role; with it off (the default) he tries no one
//   preview    the season preview at block 0: the forecast by strength, the summer's moves read from the news
//   hof        a manager-only career goes in the managers' Hall of Fame, an old entry by the career it was, the
//              best 50 of each kept
//   slots      two careers saved side by side, slot 1 on the key of the saves made before the slots
'use strict';

const { bologna } = require('./checks-deal');

// G1: Bologna's goalkeepers all 8 under the club's strength, room in budget and wages
function assistant(load) {
  const out = [];
  [1, 0].forEach(on => {
    let buys = 0, tries = 0;
    for (let seed = 901; seed <= 905; seed++) {
      const G = load(), st = bologna(G, seed), m = st.mgr, W = st.world, club = W.clubs[m.club], weak = club.str - 8;
      club.sq.forEach(id => { if (W.players[id].r === 'POR') W.players[id].o = weak; });
      m.tg = null; club.bud = 60; m.wageRoom = 50; m.assist.market = on;
      const quick = G.mgrDeal.quick;
      G.mgrDeal.quick = function (s, id) {
        const pl = W.players[id], r = quick.apply(this, arguments);
        tries++;
        if (pl.r !== 'POR' || pl.o <= weak) out.push('seed ' + seed + ': the vice tried ' + pl.n + ' (' + pl.r + ', ' + pl.o + ')');
        if (r === 'ok') { buys++; if (pl.c !== club.id) out.push('seed ' + seed + ': ' + pl.n + ' bought but not at Bologna'); }
        return r;
      };
      G.game.next(st, true);
      const said = (st.news || []).filter(x => /^🤖 Il vice compra/.test(x.t)).length;
      if (said > 1) out.push('seed ' + seed + ': ' + said + ' goalkeepers bought for one place');
    }
    if (on && buys < 4) out.push('market on: ' + buys + ' goalkeepers bought in 5 summers');
    if (!on && tries) out.push('market off: the vice tried ' + tries + ' deals');
  });
  return out;
}

// G2
function preview(load) {
  const G = load(), out = [], st = bologna(G, 92), W = st.world, club = W.clubs[st.mgr.club], y = st.S.year;
  const lg = W.clubs.filter(c => c.lg === club.lg).sort((a, b) => b.str - a.str || a.id - b.id);
  st.news = [
    { y: y, b: 0, t: '💰 Aldo Uno (70) dal Bologna al Milan per 10 M€' }, { y: y, b: 0, t: '💰 Bruno Due (72) dal Milan al Bologna per 12 M€' },
    { y: y, b: 0, t: '💰 Carlo Tre (60) svincolato al Bologna' }, { y: y - 1, b: 3, t: '💰 Dario Vecchio (65) dal Lecce al Bologna per 3 M€' },
    { y: y, b: 0, t: '💰 Ezio Altro (75) dal Milan al Bologna B per 5 M€' }];
  const h = G.ui.mgrPreview(st), ins = (h.match(/Arrivi: ([^<]*)/) || [])[1] || '', outs = (h.match(/Partenze: ([^<]*)/) || [])[1] || '';
  if (h.indexOf('<b>' + (lg.indexOf(club) + 1) + 'º</b> su ' + lg.length) < 0) out.push('forecast: ' + h.replace(/<[^>]+>/g, ' ').slice(0, 300));
  if (ins !== 'Bruno Due (72) dal Milan per 12 M€ · Carlo Tre (60) svincolato') out.push('arrivals: ' + ins);
  if (outs !== 'Aldo Uno (70) al Milan per 10 M€') out.push('departures: ' + outs);
  if ((h.match(/🎯/g) || []).length !== st.mgr.goals.length) out.push('the preview does not show the ' + st.mgr.goals.length + ' goals');
  G.game.next(st, true);
  if (G.ui.mgrPreview(st)) out.push('preview still there after block 0');
  return out;
}

/** @returns {object} an entry saved before phase G: no t */
function oldEntry(id, name, mgr, score) {
  return { id: id, name: name, nat: 'ITA', role: 'ATT', from: 2025, to: 2040, seasons: 15, clubs: ['Lecce'], apps: 400, goals: 100, assists: 50, caps: 0, trophies: 2, big: [], bdo: 0,
    score: score, grade: 'Big', mgr: mgr, icon: '⭐', goat: 0, peak: 80, date: 0 };
}

// G3
function hof(load) {
  const G = load(), out = [];
  const old = [oldEntry('o1', 'Vecchio Mister', { only: 1, role: 'mgr', seasons: 3, trophies: 1 }, 300), oldEntry('o2', 'Vecchio Bomber', null, 400)], store = G.sandbox.localStorage;
  store.setItem(G.hof.KEY, JSON.stringify(old));
  const b = G.game.newCareer({ name: 'Calciatore Due', nat: 'ITA', role: 'ATT', foot: 'D', start: 'random', seed: 94 });
  G.hof.add(b);
  if (!G.hof.read().some(x => x.id === b.hofId && x.t === 'pl')) out.push('the player career has no t = pl');
  // 55 players better than everyone: the managers keep their places
  store.setItem(G.hof.KEY, JSON.stringify(G.hof.read().concat(Array.from({ length: 55 }, (x, i) => oldEntry('p' + i, 'Riempitivo ' + i, null, 5000 + i)))));
  const a = bologna(G, 93);
  for (let i = 0; i < 6 && !(a.mgr.hist.length); i++) { a.event = null; a.recap = null; a.mgrOffers = null; G.game.next(a, true); }
  G.hof.add(a);
  const list = G.hof.read(), e = list.find(x => x.id === a.hofId), mg = G.hof.table('', 10, 'mgr'), pl = G.hof.table('', 99, 'pl');
  if (!e || e.t !== 'mgr' || !e.mgr || e.mgr.clubs.join() !== 'Bologna' || !(e.mgr.games > 30) || e.mgr.games !== a.mgr.games) out.push('manager entry ' + JSON.stringify(e && e.mgr));
  if (mg.indexOf('Test Manager') < 0 || mg.indexOf('Vecchio Mister') < 0 || /Calciatore|Bomber|Riempitivo/.test(mg) || mg.indexOf('Panchine') < 0) out.push('managers table: ' + mg.replace(/<[^>]+>/g, ' ').slice(0, 300));
  if (mg.indexOf('>' + a.mgr.games + '<') < 0) out.push('managers table without the ' + a.mgr.games + ' matches');
  if (/Test Manager|Vecchio Mister/.test(pl) || list.filter(x => G.hof.type(x) === 'pl').length !== 50) out.push('players: ' + list.filter(x => G.hof.type(x) === 'pl').length + ' kept');
  return out;
}

// G4
function slots(load) {
  const G = load(), out = [], a = bologna(G, 95);
  a.player.name = 'Primo';
  G.save.slot = 0; G.save.write(a);
  const b = G.game.newCareer({ name: 'Secondo', nat: 'ESP', role: 'DC', foot: 'S', start: 'random', seed: 96 });
  G.save.slot = 1; G.save.write(b);
  const i0 = G.save.info(0), i1 = G.save.info(1);
  if (G.save.key(0) !== 'pc_career_v2' || G.save.key(1) !== 'pc_career_v2_s2' || !G.sandbox.localStorage.getItem('pc_career_v2')) out.push('slot keys ' + G.save.KEYS);
  if (!i0 || i0.name !== 'Primo' || !i0.mgr || i0.club !== 'Bologna' || i0.year !== a.S.year) out.push('slot 1: ' + JSON.stringify(i0));
  if (!i1 || i1.name !== 'Secondo' || i1.mgr || i1.club !== b.world.clubs[b.player.clubId].name) out.push('slot 2: ' + JSON.stringify(i1));
  const r0 = G.save.read(0), r1 = G.save.read();
  if (!r0 || r0.player.name !== 'Primo' || G.save.json(G.save.restore(r0)) !== G.save.json(a)) out.push('slot 1 does not read back the same career');
  if (!r1 || r1.player.name !== 'Secondo') out.push('the current slot does not read slot 2');
  G.save.wipe(1);
  if (G.save.info(1) !== null || !G.save.info(0)) out.push('wiping slot 2 left ' + JSON.stringify([G.save.info(0), G.save.info(1)]));
  G.save.slot = 0;
  return out;
}

const CHECKS = [
  { t: 'M8 G: the vice buys for a weak starter only with the market switch on', f: assistant },
  { t: 'M8 G: the season preview shows the forecast and the summer moves, until block 0 is played', f: preview },
  { t: 'M8 G: two Halls of Fame, players and managers, 50 each', f: hof },
  { t: 'M8 G: two save slots, slot 1 on the old key', f: slots }
];

module.exports = { CHECKS };
