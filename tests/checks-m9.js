// Quick checks for M9, for tests/checks-m8.js. S1, the formation tab (js/ui-pitch-edit.js):
//   strWith   G.mgrTeam.strWith on today's XI is G.mgrTeam.str, in every formation, automatic or manual
//   undo      ↩ Annulla brings back exactly the formation before each change, the last UNDO of them
//   ask       a question only for the first manual change, the goalkeeper out of goal, more than BAD points lost
//   first     the first substitutes picked by the manager come on first, the automatic XI forgets them
//   tab       the tab draws the 11, the bench in rows, the panel and the 🔁 Sostituisci list, with nothing undefined
'use strict';

const { bologna } = require('./checks-deal');

// The formation as ↩ Annulla keeps it, as text to compare
const form = (G, st) => { const m = st.mgr; G.mgrTeam.xi(st); return JSON.stringify({ xi: m.xi, xiForm: m.xiForm, form: m.form, mode: m.mode, bench: m.bench }); };
const act = (G, st, a, v) => G.ui.pitchAct(st, a, v === undefined ? '' : String(v));

function strWith(load) {
  const G = load(), out = [], st = bologna(G, 111), m = st.mgr, T = G.mgrTeam;
  Object.keys(T.FORMS).forEach(f => {
    T.setForm(st, f);
    const a = T.strWith(st, T.xi(st), f), b = T.str(st);
    if (Math.abs(a - b) > 1e-9) out.push(f + ' automatic: strWith ' + a + ', str ' + b);
    if (JSON.stringify(T.autoFor(st, f)) !== JSON.stringify(T.xi(st))) out.push(f + ': the vice\'s XI is not the automatic one');
  });
  T.setSlot(st, 9, T.xi(st)[1].id);  // a defender up front: manual, out of position
  const a = T.strWith(st, T.xi(st), m.form), b = T.str(st);
  if (m.mode !== 'manual' || Math.abs(a - b) > 1e-9) out.push('manual: strWith ' + a + ', str ' + b);
  if (T.xi(st).length !== 11) out.push('the XI has ' + T.xi(st).length + ' players');
  return out;
}

function undo(load) {
  const G = load(), out = [], st = bologna(G, 112), m = st.mgr, T = G.mgrTeam, W = st.world, club = W.clubs[m.club];
  m.askManual = 1;  // no questions: every step goes through
  const bench = () => club.sq.filter(id => !T.xi(st).some(x => x.id === id) && !G.mgrSq.inj(m, id) && W.players[id].r !== 'POR');
  const steps = [
    ['swap slots 9 and 10', () => { act(G, st, 'mxsel', 's:9'); act(G, st, 'pemode', 'move'); act(G, st, 'mxsel', 's:10'); }],
    ['a bench player in slot 5', () => { act(G, st, 'mxsel', 's:5'); act(G, st, 'pemode', 'sub'); act(G, st, 'pesub', bench()[0]); }],
    ['formation 4-3-3', () => act(G, st, 'peform', '4-3-3')],
    ['a first substitute', () => act(G, st, 'pefirst', bench()[2])],
    ['back to the automatic XI', () => act(G, st, 'peauto', 'auto')],
    ['the vice\'s XI', () => { act(G, st, 'peauto', 'manual'); act(G, st, 'pevice'); }]
  ];
  const before = [];
  steps.forEach(([t, f]) => {
    const b = form(G, st);
    f();
    if (form(G, st) === b && t !== 'the vice\'s XI') out.push(t + ': nothing changed');
    if (G.ui.sel.ask) out.push(t + ': a question was asked');
    before.push([t, b]);
  });
  // the last step was two changes (manual, then the vice's XI): 7 in all, the last UNDO kept
  const n = G.CFG2.PITCH_EDIT.UNDO;
  if (G.ui.sel.undo.length !== n) out.push(G.ui.sel.undo.length + ' formations kept instead of ' + n);
  act(G, st, 'peundo'); act(G, st, 'peundo');
  if (form(G, st) !== before[before.length - 1][1]) out.push('two undos do not bring back the XI before the vice\'s');
  for (let i = before.length - 2; i >= 0 && i >= before.length - n + 1; i--) {
    act(G, st, 'peundo');
    if (form(G, st) !== before[i][1]) { out.push('undo of "' + before[i][0] + '": ' + form(G, st).slice(0, 160) + ' instead of ' + before[i][1].slice(0, 160)); break; }
  }
  return out;
}

function ask(load) {
  const G = load(), out = [], st = bologna(G, 113), m = st.mgr, T = G.mgrTeam, W = st.world;
  // the first change of the automatic XI asks; Annulla changes nothing; with "non chiederlo più" it asks no more
  const b0 = form(G, st);
  act(G, st, 'mxsel', 's:9'); act(G, st, 'pemode', 'move'); act(G, st, 'mxsel', 's:10');
  if (!G.ui.sel.ask || !/Passi al manuale/.test(G.ui.sel.ask.t)) out.push('no question before the first manual change');
  act(G, st, 'peno');
  if (form(G, st) !== b0 || G.ui.sel.ask) out.push('Annulla on the question changed the XI');
  act(G, st, 'mxcancel');
  act(G, st, 'mxsel', 's:9'); act(G, st, 'pemode', 'move'); act(G, st, 'mxsel', 's:10'); act(G, st, 'peaskno'); act(G, st, 'peok');
  if (m.mode !== 'manual' || m.askManual !== 1) out.push('Ok with "non chiederlo più": mode ' + m.mode + ', askManual ' + m.askManual);
  // the goalkeeper in midfield asks, with both strengths; a cheap move does not
  const xi = T.xi(st), now = T.str(st), cc = xi.findIndex(x => x.r === 'CC');
  act(G, st, 'mxsel', 's:0'); act(G, st, 'pemode', 'move'); act(G, st, 'mxsel', 's:' + cc);
  const q = G.ui.sel.ask;
  if (!q || !/esce dalla porta/.test(q.t) || q.t.indexOf(G.pe.n1(now)) < 0) out.push('goalkeeper to midfield: ' + (q ? q.t : 'no question'));
  act(G, st, 'peok');
  if (T.xi(st)[cc].id !== xi[0].id) out.push('the goalkeeper did not move after Ok');
  act(G, st, 'peundo');
  // an outfield swap that costs a little goes through; a bench player 40 points weaker asks (more than BAD lost)
  const lost = [];
  T.xi(st).forEach((x, i) => T.xi(st).forEach((y, j) => { if (i < j && x.r !== 'POR' && y.r !== 'POR') lost.push([i, j, T.str(st) - T.strWith(st, G.pe.moved(T.xi(st), 'swap', i, j), m.form)]); }));
  const cheap = lost.find(l => l[2] > 0.1 && l[2] <= G.CFG2.PITCH_EDIT.BAD);
  if (!cheap) out.push('no outfield swap costs between 0.1 and ' + G.CFG2.PITCH_EDIT.BAD + ' points');
  else {
    const b2 = form(G, st);
    act(G, st, 'mxsel', 's:' + cheap[0]); act(G, st, 'pemode', 'move'); act(G, st, 'mxsel', 's:' + cheap[1]);
    if (G.ui.sel.ask || form(G, st) === b2) out.push('a swap that costs ' + cheap[2].toFixed(2) + ' asked or did not happen');
    act(G, st, 'peundo');
  }
  const k = T.xi(st).findIndex(x => x.r === 'ATT'), weak = st.world.clubs[m.club].sq.find(id => !T.xi(st).some(x => x.id === id) && W.players[id].r === 'ATT');
  if (weak === undefined) out.push('no attacker on the bench');
  else {
    W.players[weak].o = W.players[T.xi(st)[k].id].o - 40;
    act(G, st, 'mxsel', 's:' + k); act(G, st, 'pemode', 'sub'); act(G, st, 'pesub', weak);
    const q2 = G.ui.sel.ask;
    if (!q2 || !/La Forza XI scende da/.test(q2.t)) out.push('a sub 40 points weaker: ' + (q2 ? q2.t : 'no question'));
    act(G, st, 'peno'); act(G, st, 'mxcancel');
  }
  // an injured player cannot come in
  const W2 = W, club = W2.clubs[m.club], hurt = club.sq.find(id => !T.xi(st).some(x => x.id === id));
  m.inj[hurt] = 3;
  const b1 = form(G, st);
  act(G, st, 'mxsel', 's:5'); act(G, st, 'pemode', 'sub'); act(G, st, 'pesub', hurt);
  if (form(G, st) !== b1) out.push('an injured player came in');
  return out;
}

function first(load) {
  const G = load(), out = [], st = bologna(G, 114), m = st.mgr, T = G.mgrTeam, club = st.world.clubs[m.club];
  const engine = T.side(st, club).cameOn.slice();
  m.askManual = 1;
  const pick = club.sq.filter(id => !T.xi(st).some(x => x.id === id) && !G.mgrSq.inj(m, id) && engine.indexOf(id) < 0)[0];
  act(G, st, 'pefirst', pick);
  const now = T.side(st, club).cameOn;
  if (m.mode !== 'manual' || now[0] !== pick || now.length !== G.CFG.SUBS || JSON.stringify(m.bench) !== JSON.stringify(now)) out.push('first subs ' + JSON.stringify(now) + ', bench ' + JSON.stringify(m.bench) + ' after picking ' + pick);
  act(G, st, 'pefirst', pick);
  if (T.side(st, club).cameOn.indexOf(pick) >= 0) out.push('taken out of the first subs, still there');
  act(G, st, 'pefirst', pick); act(G, st, 'peauto', 'auto');
  if (m.bench !== undefined || JSON.stringify(T.side(st, club).cameOn) !== JSON.stringify(engine)) out.push('the automatic XI kept the manager\'s subs: ' + JSON.stringify(T.side(st, club).cameOn));
  return out;
}

// B: a first substitute is tappable: 🔁 gives his place to another bench player, or puts him in for a starter
function firstTap(load) {
  const G = load(), out = [], st = bologna(G, 116), m = st.mgr, T = G.mgrTeam, club = st.world.clubs[m.club];
  m.askManual = 1;
  const subs = () => T.side(st, club).cameOn, free = () => club.sq.filter(id => !T.xi(st).some(x => x.id === id) && !G.mgrSq.inj(m, id) && subs().indexOf(id) < 0 && st.world.players[id].r === 'CC');
  const f = subs()[0], other = free()[0];
  act(G, st, 'mxsel', 'b:' + f);
  let h = G.pe.panel(st);
  if (h.indexOf('Togli dai primi cambi') < 0 || h.indexOf('data-v="sub"') < 0) out.push('the panel of a first substitute: ' + h.replace(/<[^>]+>/g, ' ').slice(0, 200));
  act(G, st, 'pemode', 'sub'); act(G, st, 'mxsel', 'b:' + other);
  if (subs().indexOf(other) < 0 || subs().indexOf(f) >= 0 || m.mode !== 'manual') out.push('🔁 on a first substitute: ' + JSON.stringify(subs()) + ' after ' + other + ' for ' + f);
  act(G, st, 'mxsel', 'b:' + other); act(G, st, 'pemode', 'sub'); act(G, st, 'mxsel', 's:5');
  if (T.xi(st)[5].id !== other) out.push('a first substitute did not come in for a starter');
  const plain = free()[0];
  act(G, st, 'mxsel', 'b:' + plain); h = G.pe.panel(st);
  if (h.indexOf('Metti tra i primi cambi') < 0) out.push('the panel of a bench player has no "Metti tra i primi cambi"');
  return out;
}

// C: the turnover over one season at Bologna: more starters than without it, the best XI in big matches, the limits
function rotate(load) {
  const out = [];
  const season = on => {
    const G = load(), st = bologna(G, 121), m = st.mgr, T = G.mgrTeam, R = G.CFG2.ROTATE, seen = {}, w = { big: 0, easy: 0, normal: 0 }, side = T.side;
    if (on) m.assist.rotate = 1;
    T.side = function (s, club, opp, comp) {
      const best = T.xi(s).map(x => ({ r: x.r, id: x.id })), r = side.apply(this, arguments);
      if (opp === undefined || !comp) return r;
      r.ids.forEach(id => { seen[id] = 1; });
      if (!on) return r;
      const L = r.rw === 'easy' ? R.EASY : R.NORMAL, ch = best.filter((x, k) => r.ids[k] !== x.id).length;
      const drop = T.strWith(s, best, m.form) - T.strWith(s, best.map((x, k) => ({ r: x.r, id: r.ids[k] })), m.form);
      w[r.rw]++;
      if (r.rw === 'big' && ch) out.push('a big match (' + comp.name + ' ' + (comp.rd || '') + ') with ' + ch + ' changes');
      if (r.rw !== 'big' && (ch > L.MAX || drop > L.DROP + 1e-9)) out.push(r.rw + ' match: ' + ch + ' changes, ' + drop.toFixed(2) + ' points lost');
      if (r.ids[0] !== best[0].id && comp.ck !== club.nat) out.push('the goalkeeper changed in ' + comp.name);
      return r;
    };
    const h0 = m.hist.length;
    for (let k = 0; k < 8 && m.hist.length === h0 && G.mgr.active(st); k++) { st.event = null; st.recap = null; st.mgrOffers = null; m.conf = Math.max(m.conf, 40); G.game.next(st, true); }
    return { n: Object.keys(seen).length, w: w };
  };
  const off = season(false), on = season(true);
  if (on.n <= off.n) out.push(on.n + ' different starters with the turnover, ' + off.n + ' without');
  if (!on.w.big || !on.w.easy || !on.w.normal) out.push('matches by weight: ' + JSON.stringify(on.w));
  return out.slice(0, 10);
}

// S2: the interest, an application, a mid-season offer the club does not let go, the contract and its payout
function jobs(load) {
  const G = load(), out = [], st = bologna(G, 131), m = st.mgr, W = st.world, J = G.CFG2.MGR_JOBS, club = W.clubs[m.club];
  m.rep = 75;  // a manager clubs follow
  const big = W.clubs.slice().sort((a, b) => b.rep - a.rep)[0], small = W.clubs.filter(c => c.rep <= 66 && c.rep >= 60)[0];
  if (!(G.mgrJobs.interest(st, small) > G.mgrJobs.interest(st, big))) out.push('a small club is not more interested than a big one');
  const i0 = G.mgrJobs.interest(st, small); st.player.traitor[small.id] = 1;
  if (G.mgrJobs.interest(st, small) !== Math.max(0, i0 - J.TRAITOR)) out.push('a traitor: interest ' + G.mgrJobs.interest(st, small) + ' from ' + i0);
  delete st.player.traitor[small.id];
  if (!m.contract || m.contract.years < J.YEARS || G.mgr.wage(st) !== m.contract.wage) out.push('the contract ' + JSON.stringify(m.contract));
  // a sacking at a small club: the bench stays open, the manager applies, the club answers when it closes
  const co = W.coaches[small.coach];
  G.coaches.sack(st, small, G.rng, 'prova');
  const v = G.mgrJobs.vacancy(st, small.id);
  if (!v || small.coach < 0 || W.coaches[small.coach].c !== small.id) out.push('no open bench, or the club has no coach: ' + JSON.stringify(v));
  if (co.c === small.id) out.push('the sacked coach is still there');
  G.mgrJobs.apply(st, small.id);
  if (!v || !(v.app > 0)) out.push('the application has no chance');
  // a mid-season offer the club does not let go: no without resigning, yes with it
  st.mgrOffers = { why: 'mid', list: [Object.assign(G.mgrJobs.offer(st, small.id, G.mgrJobs.now(st) + 3), { rel: 'no' })] };
  const money = st.player.money;
  if (!G.mgrJobs.take(st, 0) || m.club !== club.id) out.push('the club let him go without resigning');
  G.mgrJobs.take(st, 0, true);
  if (m.club !== small.id || m.hist[m.hist.length - 1].note !== 'Dimissioni' || W.coaches[small.coach].me !== 1) out.push('resign and take: at ' + m.club + ', last note ' + (m.hist[m.hist.length - 1] || {}).note);
  // sacked: half of the contract left
  const left = m.contract.wage * J.WEEKS * m.contract.years * J.PAYOUT;
  G.mgr.sack(st, 'prova');
  if (Math.abs(st.player.money - money - left) > 1) out.push('payout ' + (st.player.money - money) + ' instead of ' + left);
  if (!st.mgrOffers || !st.mgrOffers.list.length) out.push('no offers after the sacking');
  return out;
}

// The colour of a card is the distance of roles only: in every formation a player in his own role has the green
// border, and the number never takes the orange of "adattato" (it once did when he was worth less than his overall)
function colours(load) {
  const G = load(), out = [], st = bologna(G, 141), m = st.mgr, T = G.mgrTeam, W = st.world;
  Object.keys(T.FORMS).forEach(f => {
    T.setForm(st, f);
    m.mode = 'auto';
    const xi = T.xi(st), o = G.ui.mgrPitchOpts(st);
    xi.forEach((x, k) => {
      const pl = W.players[x.id], c = o.slots[k], h = G.ui.pitchCard(c, [50, 50, '']);
      if (pl.r === x.r && (c.fit !== 'g' || h.indexOf(' fg') < 0)) out.push(f + ' slot ' + k + ' (' + x.r + '): ' + pl.n + ' in his role has fit ' + c.fit);
      if (pl.r !== x.r && c.fit !== G.ui.fitCls(T.fit(pl, x.r))) out.push(f + ' slot ' + k + ': fit ' + c.fit + ' for ' + pl.r + ' as ' + x.r);
      if (/class="ovr [^"]/.test(h)) out.push(f + ' slot ' + k + ': the number has a colour class');
    });
  });
  // 🔄 Turnover is a switch of 🤖 Assistente, with the other three
  G.ui.sel.assist = true;
  const a = G.ui.mgrAssist(st);
  G.ui.sel.assist = false;
  if ((a.match(/data-act="mast"/g) || []).length !== 4 || a.indexOf('data-v="rotate"') < 0) out.push('🤖 Assistente has ' + (a.match(/data-act="mast"/g) || []).length + ' switches, the turnover ' + (a.indexOf('data-v="rotate"') < 0 ? 'missing' : 'there'));
  return out;
}

// Fix after S2: a manager at the poorest club of the Segunda and of a small league has a budget and can buy someone
function floor(load) {
  const out = [];
  [c => c.lg === 'ESP2', c => ['ENG', 'ESP', 'ITA', 'GER', 'FRA', 'KSA', 'USA'].indexOf(c.nat) < 0].forEach((pick, n) => {
    const G = load(), st = G.game.newManager({ name: 'Test Manager', nat: 'ITA', bg: 'prov', age: 40, seed: 151 + n }), W = st.world;
    const club = W.clubs.filter(pick).sort((a, b) => a.bud - b.bud || a.rev - b.rev)[0], bud0 = club.bud;
    G.state = st;
    G.mgr.start(st, { club: club.id, fans: 0, perks: null, bandiera: 0 });
    const m = st.mgr, room = G.world.wageCap(club) * 1.3 - G.world.wageBill(W, club) + (m.wageRoom || 0);
    if (!(club.bud > 0) || !(room > 0)) out.push(club.name + ': budget ' + club.bud + ' (before ' + bud0 + '), wage room ' + room.toFixed(2));
    // players at the level of the squad (the scouts' targets are better, and a star refuses a small club): the money
    // reaches several of them; a negotiation may still fail by chance, so they are tried in turn
    const list = W.players.filter(pl => pl && pl.c >= 0 && pl.c !== club.id && pl.ln === undefined && pl.a <= 30 && pl.o >= club.str - 2 && pl.o <= club.str + 4).slice(0, 40);
    const can = list.filter(pl => !G.mgrDeal.can(st, pl, G.mgr.price(st, pl), G.mgrDeal.wage(st, pl, 1))).length;
    let ok = 0;
    list.forEach(pl => { if (!ok && G.mgrDeal.quick(st, pl.i) === 'ok') ok = 1; });
    if (can < 3 || !ok) out.push(club.name + ' (' + G.leagueByKey(club.lg).name + '): ' + can + ' targets within budget and wages, ' + (ok ? 'a' : 'no') + ' signing, ' + club.bud + ' M€');
  });
  return out;
}

// The turnover and fitness: a starter back at full fitness plays, unless a bigger match is close and he would not
// reach it fit; when this match is the biggest, nobody rests
function fitness(load) {
  const G = load(), out = [], st = bologna(G, 161), m = st.mgr, T = G.mgrTeam, W = st.world, club = W.clubs[m.club];
  m.assist.rotate = 1;
  const easyOpp = W.clubs.filter(c => c.id !== club.id && club.riv.indexOf(c.id) < 0 && c.str <= club.str - 8)[0].id, lg = { name: 'Serie A', lg: false, ck: 'XX' };
  const setAll = c => club.sq.forEach(id => { m.cond[id] = c; });
  const changes = P => { const best = T.xi(st); return best.filter((x, k) => P.xi[k].id !== x.id).length; };
  // 1. everyone at 95, all starters with 5 in a row, all reserves idle for 10, a boy's turn: no bigger match ahead
  setAll(95);
  m.rot = { run: {}, idle: {}, easy: 0 };
  T.xi(st).forEach(x => { m.rot.run[x.id] = 5; });
  club.sq.forEach(id => { if (!T.xi(st).some(x => x.id === id)) m.rot.idle[id] = 10; });
  G.mgrRot.ahead = () => [];
  let P = G.mgrRot.plan(st, easyOpp, lg);
  if (P.w !== 'easy' || changes(P)) out.push('starters at 95 in an ' + P.w + ' match: ' + changes(P) + ' changes (' + P.notes.join('; ') + ')');
  // 2. a final in 3 days, the next match: the starters at 85 would reach it tired, so some rest now
  setAll(85);
  G.mgrRot.ahead = () => [{ w: 'big', n: 0, why: 'la finale di mercoledì' }];
  P = G.mgrRot.plan(st, easyOpp, lg);
  if (!changes(P) || !P.notes.some(t => /\(condizione 85\) per la finale di mercoledì/.test(t))) out.push('a final next: ' + changes(P) + ' changes (' + P.notes.join('; ') + ')');
  // at COND_OK + COND_PLAY they still reach it fit after playing now: nobody rests (no starts in a row, no idle reserves)
  setAll(G.CFG.MGR_TEAM.COND_OK + G.CFG.MGR_TEAM.COND_PLAY);
  m.rot = { run: {}, idle: {}, easy: 1 };
  P = G.mgrRot.plan(st, easyOpp, lg);
  if (changes(P)) out.push('fit enough for the final, ' + changes(P) + ' rested anyway');
  // 3. this match is the biggest (a final): nobody rests, whatever comes next
  setAll(85);
  P = G.mgrRot.plan(st, easyOpp, { name: 'Coppa', lg: false, ck: club.nat, rd: 'Finale', final: 1 });
  if (P.w !== 'big' || changes(P)) out.push('a final now: ' + changes(P) + ' changes');
  return out;
}

function tab(load) {
  const G = load(), out = [], st = bologna(G, 115), m = st.mgr, T = G.mgrTeam, club = st.world.clubs[m.club];
  G.ui.tab = 'rosa';
  const cards = h => (h.match(/class="p[cb][ "]/g) || []).length;
  let h = G.ui.mgrFormation(st);
  if (cards(h) !== club.sq.length) out.push(cards(h) + ' cards for ' + club.sq.length + ' players');
  if (h.indexOf('Primi cambi · ' + G.CFG.SUBS) < 0 || h.indexOf('data-act="peauto"') < 0 || h.indexOf('Forza XI <b>' + G.pe.n1(T.str(st))) < 0) out.push('bar or bench rows missing');
  if (/undefined|NaN/.test(h)) out.push('undefined or NaN on the tab');
  act(G, st, 'mxsel', 's:4'); act(G, st, 'pemode', 'sub');
  h = G.ui.mgrFormation(st);
  const avail = club.sq.filter(id => !T.xi(st).some(x => x.id === id) && !G.mgrSq.inj(m, id)).length;
  if ((h.match(/data-act="pesub"/g) || []).length !== avail || h.indexOf('class="card pside open"') < 0) out.push('the 🔁 Sostituisci list has ' + (h.match(/data-act="pesub"/g) || []).length + ' players for ' + avail);
  act(G, st, 'pemode', 'move'); act(G, st, 'peforms');
  h = G.ui.mgrFormation(st);
  if ((h.match(/class="hint /g) || []).length !== 10 || (h.match(/data-act="peform"/g) || []).length !== 5 || h.indexOf('⭐ consigliato dal vice') < 0) out.push('↔️ Sposta or the formations: ' + (h.match(/class="hint /g) || []).length + ' places with a number');
  if (/undefined|NaN/.test(h)) out.push('undefined or NaN while moving');
  return out;
}

const CHECKS = [
  { t: 'M9 S1: strWith on today\'s XI is the Forza XI, in every formation', f: strWith },
  { t: 'M9 S1: ↩ Annulla brings back exactly the last 5 formations', f: undo },
  { t: 'M9 S1: a question only for the first manual change, the goalkeeper and costly moves', f: ask },
  { t: 'M9 S1: the first substitutes picked by the manager, forgotten by the automatic XI', f: first },
  { t: 'M9 S1: the formation tab draws the bar, the bench rows, the panel and the moves', f: tab },
  { t: 'M9 S1: a first substitute is tappable: another bench player takes his place, or he comes in', f: firstTap },
  { t: 'M9 S1: 🔁 Turnover rotates more players, never in big matches, within its limits', f: rotate, slow: 1 },
  { t: 'M9 S2: interest, open benches, an application, a club that does not let go, the payout', f: jobs },
  { t: 'M9 S1: a player in his own role is green in every formation; 🔄 Turnover in 🤖 Assistente', f: colours },
  { t: 'M9 fix: the poorest clubs of the Segunda and of a small league can buy a player', f: floor },
  { t: 'M9 S1: the turnover plays the starters back at full fitness, rests them only before a bigger match', f: fitness }
];

module.exports = { CHECKS };
