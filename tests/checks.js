// The rules tests/run.js checks. Each function returns a list of problems (empty = fine).
//   files(root)            index.html lists every script, every script starts with // @ts-check, only config.js declares G
//   data(G)                event cards, press cards, manager cards and decisive moments are well formed
//   watch(G)               records what happens during a career (season goals, moments, news) without changing it
//   career(G, st, seen)    a played career keeps its rules: numbers in range, squads consistent, save round trip
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cal = require('./checks-cal'), mgr = require('./checks-mgr');

// ---------- files ----------

function files(root) {
  const out = [], html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const listed = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
  const onDisk = fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f);
  listed.filter(f => !fs.existsSync(path.join(root, f))).forEach(f => out.push('index.html loads ' + f + ', which does not exist'));
  onDisk.filter(f => listed.indexOf(f) < 0).forEach(f => out.push(f + ' is not loaded by index.html'));
  if (listed[0] !== 'js/config.js') out.push('js/config.js must load first: it creates G');
  onDisk.forEach(f => {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    if (!src.startsWith('// @ts-check')) out.push(f + ': first line must be // @ts-check');
    if (f !== 'js/config.js' && /^var G\b/m.test(src)) out.push(f + ': only js/config.js declares var G');
    if (/@ts-ignore|@ts-nocheck/.test(src)) out.push(f + ': uses @ts-ignore or @ts-nocheck');
  });
  return out;
}

// ---------- data ----------

// The keys a function reads from one of its parameters: fx.mo, fx.$ ... in an effects function
function readKeys(fns, name) {
  const keys = new Set(), re = new RegExp('\\b' + name + '\\.(\\$|\\w+)', 'g');
  fns.forEach(fn => { for (const m of fn.toString().matchAll(re)) keys.add(m[1]); });
  return keys;
}

// The {placeholders} a fill function replaces: the keys of its object literal ("key: value", no space before the colon)
function fillKeys(fn) {
  return new Set([...fn.toString().matchAll(/[{,]\s*(\w+):\s/g)].map(m => m[1]));
}

function holes(txt) { return [...String(txt).matchAll(/\{(\w+)\}/g)].map(m => m[1]); }

// One deck of cards: ids unique, a condition, title, text, options with known effects and placeholders
function deck(G, label, cards, fxKeys, phKeys, needOkKo) {
  const out = [], ids = {};
  cards.forEach((c, n) => {
    const at = label + ' ' + (c.id || '#' + n);
    if (!c.id) out.push(at + ': no id');
    else if (ids[c.id]) out.push(at + ': id used twice'); else ids[c.id] = 1;
    if (c.c !== undefined && typeof c.c !== 'function') out.push(at + ': condition is not a function');
    if (typeof c.t !== 'string' || typeof c.d !== 'string') out.push(at + ': title or text missing');
    if (!Array.isArray(c.o) || !c.o.length) { out.push(at + ': no options'); return; }
    const texts = [c.t, c.d];
    c.o.forEach((o, i) => {
      const fx = o[1] || {};
      if (typeof o[0] !== 'string' || typeof o[2] !== 'string') out.push(at + ' option ' + i + ': label or outcome text missing');
      texts.push(o[0], o[2], o[3]);
      [fx, fx.ok, fx.ko].filter(Boolean).forEach(f => Object.keys(f).forEach(k => {
        if (k !== 'ok' && k !== 'ko' && !fxKeys.has(k)) out.push(at + ' option ' + i + ': unknown effect "' + k + '"');
      }));
      [fx, fx.ok, fx.ko].filter(Boolean).forEach(f => f.at && Object.keys(f.at).forEach(k => {
        if (k !== 'any' && G.ATTRS.indexOf(k) < 0) out.push(at + ' option ' + i + ': unknown attribute "' + k + '"');
      }));
      if (fx.p !== undefined && !(fx.p > 0 && fx.p < 1)) out.push(at + ' option ' + i + ': probability ' + fx.p + ' not between 0 and 1');
      if (needOkKo && fx.p !== undefined && (!fx.ok || !fx.ko)) out.push(at + ' option ' + i + ': a probability needs both ok and ko');
    });
    texts.filter(t => t !== undefined).forEach(t => holes(t).forEach(h => {
      if (!phKeys.has(h)) out.push(at + ': placeholder {' + h + '} is never filled');
    }));
  });
  return out;
}

function data(G) {
  const out = [], E = G.events;
  const evFx = readKeys([E.effects, E.apply], 'fx'), evPh = fillKeys(E.fill);
  out.push(...deck(G, 'event', E.cards, evFx, evPh, false));
  out.push(...deck(G, 'press', G.press.cards, evFx, evPh, false));
  out.push(...deck(G, 'manager event', G.mgrEv.cards, readKeys([G.mgrEv.effects, G.mgrEv.apply], 'fx'), fillKeys(G.mgrEv.fill), true));
  const both = G.events.cards.concat(G.press.cards).map(c => c.id).filter(id => G.mgrEv.cards.some(c => c.id === id));
  if (both.length) out.push('ids shared by player and manager cards: ' + both.join(', '));
  // decisive moments: valid roles, attributes and kinds, and enough situations per role not to feel the same
  const roles = Object.keys(G.ROLES), ids = {};
  G.moments.SCEN.forEach(s => {
    if (ids[s.id]) out.push('moment ' + s.id + ': id used twice'); ids[s.id] = 1;
    s.r.filter(r => roles.indexOf(r) < 0).forEach(r => out.push('moment ' + s.id + ': unknown role ' + r));
    holes(s.d).filter(h => h !== 'opp').forEach(h => out.push('moment ' + s.id + ': placeholder {' + h + '} is never filled'));
    s.o.forEach((o, i) => {
      o[1].filter(k => G.ATTRS.indexOf(k) < 0).forEach(k => out.push('moment ' + s.id + ' option ' + i + ': unknown attribute ' + k));
      if (['goal', 'assist', 'stop'].indexOf(o[3]) < 0) out.push('moment ' + s.id + ' option ' + i + ': unknown kind ' + o[3]);
      if (typeof o[4] !== 'string' || typeof o[5] !== 'string') out.push('moment ' + s.id + ' option ' + i + ': outcome text missing');
    });
  });
  roles.forEach(r => {
    const n = G.moments.SCEN.filter(s => s.r.indexOf(r) >= 0).length;
    if (n < 3) out.push('decisive moments: only ' + n + ' situations for ' + r);
  });
  return out;
}

// ---------- during a career ----------

// Wraps a few functions to record what they produce; the game behaves exactly the same
function watch(G) {
  const seen = { goals: [], moments: [], texts: [] };
  const wrap = (obj, k, after) => { const f = obj[k]; obj[k] = function () { const r = f.apply(this, arguments); after(r, arguments); return r; }; };
  wrap(G.goals, 'make', (out, a) => {
    const st = a[0], p = st.player, last = p.history[p.history.length - 1];
    const same = last && last.clubId === p.clubId && last.matches && last.apps / last.matches >= 0.5;
    out.forEach(g => seen.goals.push({ year: st.year, k: g.k, n: g.n, role: p.role, prevG: same ? last.lgG : null, prevA: same ? last.lgA : null }));
  });
  wrap(G.moments, 'draw', (s, a) => seen.moments.push({ id: s.id, role: a[0].player.role }));
  wrap(G, 'news', (r, a) => seen.texts.push(String(a[1])));
  seen.cards = []; seen.nt = { me: 0, team: 0 };
  const ev = (r, a) => { const e = a[0].event; if (e) { seen.texts.push(e.t, e.d, ...e.o); seen.cards.push({ id: e.id, nat: a[0].player.nat }); } };
  // M8 A2: the player's share of his national team's goals in the matches he played
  wrap(G.national, 'record', (r, a) => { const mp = a[4], ga = a[5]; if (mp.mins > 0) { seen.nt.me += ga.g; seen.nt.team += a[3][0]; } });
  wrap(G.events, 'roll', ev); wrap(G.mgrEv, 'roll', ev); wrap(G.press, 'roll', ev);
  // M8 §1.1: in the AI windows nobody trades for the managed club (filling a squad below the minimum is allowed)
  seen.aiMgr = [];
  const win = G.transfers.window, move = G.transfers.move;
  G.transfers.window = function (st) { const m = st.mgr; seen.mgrClub = G.mgr.active(st) ? m.club : null; try { return win.apply(this, arguments); } finally { seen.mgrClub = null; } };
  G.transfers.move = function (st, pl, to) {
    const c = seen.mgrClub, W = st.world;
    if (c !== null && c !== undefined && (to.id === c || pl.c === c) && W.clubs[c].sq.length >= G.CFG.SQUAD_MIN) seen.aiMgr.push(st.year + ': the AI moved ' + pl.n + (to.id === c ? ' to ' : ' away from ') + 'the managed club');
    return move.apply(this, arguments);
  };
  // M8 I7.1: the start chance made of startParts is the old formula to the last digit, at every block
  seen.chance = [];
  wrap(G.season, 'beginBlock', (r, a) => {
    const st = a[0];
    if (st.mgr) return;
    const now = G.season.startParts(st).chance, old = oldChance(G, st);
    if (now !== old || G.season.startChance(st) !== now) seen.chance.push(st.year + ' block ' + st.S.block + ': start chance ' + now + ', the old formula gives ' + old);
  });
  cal.watch(G, seen);  // M8 J11: the calendar (tests/checks-cal.js)
  mgr.watch(G, seen);  // M8 B-G: the manager (tests/checks-mgr.js)
  return seen;
}

// G.season.startChance as it was before M8 (js/season.js), to compare with startParts
function oldChance(G, st) {
  const C = G.CFG, p = st.player, W = st.world, club = W.clubs[p.clubId];
  const list = G.squads.roleList(W, club, p.role), n = C.FORMATION[p.role];
  const level = list[n - 1] !== undefined ? W.players[list[n - 1]].o : 45;
  const co = G.coaches.of(W, club);
  const bonus = p.form * C.FORM_WEIGHT + (p.morale - 50) / 25 + (co ? (p.rel[co.i] || 0) / C.REL_DIV : 0) +
    (p.age <= 19 ? C.YOUTH_BONUS : 0) + (co && co.sty === 'giovani' && p.age <= 22 ? 2 : 0) + G.life.staff(p, 'analyst');
  const floor = (C.ROLE_FLOOR[p.contract.role] || 0) * (p.form < C.FLOOR_BAD_FORM ? C.FLOOR_CUT : 1);
  return Math.max(floor, G.sigmoid((p.ovr + bonus - level) / C.MIN_K));
}

// Every number in the state must be finite (a NaN would turn into null in the save and break later)
function nonFinite(obj, where, out, depth) {
  if (out.length >= 5 || depth > 12 || obj === null || typeof obj !== 'object') return;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'number' && !isFinite(v)) out.push(where + '.' + k + ' = ' + v);
    else if (v && typeof v === 'object') nonFinite(v, where + '.' + k, out, depth + 1);
  }
}

function range(out, what, v, lo, hi) { if (!(v >= lo && v <= hi)) out.push(what + ' = ' + v + ', outside ' + lo + '..' + hi); }

function career(G, st, seen) {
  const out = [], p = st.player, W = st.world, m = st.mgr, C = G.CFG;
  const bad = []; nonFinite(st, 'st', bad, 0); bad.forEach(b => out.push('not a finite number: ' + b));
  // save and load gives back the same career
  const json = G.save.json(st), back = G.save.json(G.save.restore(G.save.parse(json)));
  if (back !== json) out.push('save round trip changes the career');
  // news: every entry is { y, b, t } with a text, the only shape the screens can show
  (st.news || []).forEach((n, i) => { if (!n || typeof n !== 'object' || typeof n.t !== 'string' || !n.t) out.push('news ' + i + ' is not a news item: ' + JSON.stringify(n).slice(0, 80)); });
  // the player (a manager-only career has an empty playing career)
  if (!p.mgrOnly) {
    range(out, 'overall', p.ovr, 1, 99);
    G.ATTRS.forEach(k => range(out, 'attribute ' + k, p.attrs[k], 1, 99));
    range(out, 'morale', p.morale, 0, 100); range(out, 'form', p.form, -2, 2);
    if (p.history.length !== p.seasons) out.push(p.history.length + ' seasons in the history, ' + p.seasons + ' counted');
    p.history.forEach(h => {
      const y = 'season ' + h.year;
      if (h.apps > h.matches) out.push(y + ': ' + h.apps + ' appearances in ' + h.matches + ' matches');
      if (h.lgG > h.goals || h.lgA > h.assists) out.push(y + ': more league goals or assists than in all competitions');
      if (h.goals < 0 || h.assists < 0 || h.cs < 0) out.push(y + ': negative goals, assists or clean sheets');
      if (h.apps) range(out, y + ' average rating', h.avg, 3, 10);
    });
    const sum = k => p.history.reduce((t, h) => t + h[k], 0);
    if (p.tot.apps !== sum('apps') || p.tot.goals !== sum('goals') || p.tot.assists !== sum('assists')) out.push('career totals differ from the sum of the seasons');
  }
  // the world: every squad player belongs to that club and to no other squad
  const owner = {};
  W.clubs.forEach(c => c.sq.forEach(id => {
    const x = W.players[id];
    if (!x) out.push(c.name + ' has a missing player ' + id);
    else if (x.c !== c.id) out.push(x.n + ' is in the squad of ' + c.name + ' but belongs to club ' + x.c);
    if (owner[id] !== undefined) out.push('player ' + id + ' is in two squads'); owner[id] = c.id;
  }));
  W.clubs.forEach(c => { if (c.sq.length < C.SQUAD_MIN - 2 || c.sq.length > C.SQUAD_MAX + 3) out.push(c.name + ' has ' + c.sq.length + ' players'); });
  // the manager
  if (m) {
    range(out, 'manager reputation', m.rep, 40, 97);
    if (m.conf !== undefined) range(out, 'board confidence', m.conf, -20, 100);
    if (m.morale !== undefined) range(out, 'squad morale', m.morale, 0, 100);
    if (m.hist.length < m.seasons) out.push('manager history shorter than the seasons counted');
    Object.keys(m.cond || {}).forEach(id => range(out, 'fitness of ' + id, m.cond[id], 0, 100));
    if (G.mgr.active(st)) {
      const club = W.clubs[m.club], xi = G.mgrTeam.xi(st), ids = xi.map(x => x.id);
      if (xi.length !== 11) out.push('the XI has ' + xi.length + ' players');
      if (new Set(ids).size !== ids.length) out.push('a player is twice in the XI');
      ids.filter(id => club.sq.indexOf(id) < 0).forEach(id => out.push('player ' + id + ' is in the XI but not in the squad'));
    }
  }
  if (seen) { seen.player = p; out.push(...watched(G, seen)); }
  return out;
}

// What was recorded while playing
function watched(G, seen) {
  const out = [], C = G.CFG.GOALS;
  // season goals stretch last season's league numbers by a little (the 16 -> 40 goals bug)
  seen.goals.forEach(g => {
    const prev = g.k === 'goals' ? g.prevG : g.k === 'assists' ? g.prevA : null;
    if (prev !== null && prev !== undefined && g.n > Math.max(g.role === 'ATT' ? 6 : 3, prev + C.STRETCH))
      out.push(g.year + ': target of ' + g.n + ' ' + g.k + ' after ' + prev + ' last season');
    if ((g.k === 'goals' || g.k === 'assists') && g.n < 1) out.push(g.year + ': target of ' + g.n + ' ' + g.k);
  });
  // the same decisive moment never twice in a row for a role that has others
  for (let i = 1; i < seen.moments.length; i++) {
    const a = seen.moments[i - 1], b = seen.moments[i];
    if (a.id === b.id && a.role === b.role && G.moments.SCEN.filter(s => s.r.indexOf(b.role) >= 0).length > 1) out.push('decisive moment ' + b.id + ' twice in a row');
  }
  (seen.aiMgr || []).slice(0, 5).forEach(t => out.push(t));
  (seen.chance || []).slice(0, 3).forEach(t => out.push(t));
  (seen.cal || []).slice(0, 5).forEach(t => out.push(t));
  mgr.watched(seen).forEach(t => out.push(t));
  // M8 A6: no "move back home" card for a nation whose league is not in the game
  seen.cards.filter(c => (c.id === 'homecall' || c.id === 'homesickvet') && !G.NATIONS[c.nat]).slice(0, 3).forEach(c => out.push('card ' + c.id + ' for a player from ' + c.nat + ', which has no league'));
  // M8 A2: a nation with no league has enough players, so the main player is not its only scorer
  if (seen.player && !G.NATIONS[seen.player.nat] && seen.nt.team >= 15 && seen.nt.me / seen.nt.team >= 0.6) out.push('the player scored ' + seen.nt.me + ' of the ' + seen.nt.team + ' national team goals in his matches');
  // no text shown to the player keeps a {placeholder} or prints undefined / NaN
  const shown = new Set();
  seen.texts.forEach(t => {
    const h = holes(t), u = /\bundefined\b|\bNaN\b|\[object Object\]/.test(t);
    if ((h.length || u) && !shown.has(t) && shown.size < 5) { shown.add(t); out.push('text shown with a gap: ' + t.slice(0, 140)); }
  });
  return out;
}

// What tests/golden.json keeps of a career: a few numbers and the fingerprint of the whole save
function summary(G, st) {
  const p = st.player, m = st.mgr;
  return { year: st.year, age: p.age, ovr: p.ovr, apps: p.tot ? p.tot.apps : 0, goals: p.tot ? p.tot.goals : 0, trophies: p.trophies.length,
    mgr: m ? { seasons: m.seasons, jobs: m.jobs, sacked: m.sacked, rep: m.rep, trophies: m.trophies.length } : null,
    hash: crypto.createHash('sha1').update(G.save.json(st)).digest('hex').slice(0, 16) };
}

module.exports = { files, data, watch, career, summary };
