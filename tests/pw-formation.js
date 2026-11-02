// Browser check of the manager's formation tab (M9 S1), at 390 and 1366 px: the pitch starts in the top 60% of the
// first screen, the panel of a selected player shows without scrolling (on a phone also with the 🔁 Sostituisci
// list, in at most half of the screen), no name on a card is cut, no script error; the bench, the 🧭 Panchine tab and
// the screen without a job (M9 S2). Not part of tests/run.js:
//   node tests/pw-formation.js            needs playwright (or playwright-core) and a Chrome
//   PW=/path/to/playwright-core CHROME=/path/to/chrome node tests/pw-formation.js
'use strict';
const path = require('path'), os = require('os'), fs = require('fs');

function pw() {
  const tries = [process.env.PW, 'playwright', 'playwright-core', path.join(os.homedir(), 'Library/Caches/ms-playwright-go/1.50.1/package')].filter(Boolean);
  for (const t of tries) { try { return require(t); } catch (e) {} }
  return null;
}
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/opt/pw-browsers/chromium'].find(p => fs.existsSync(p));

(async () => {
  const P = pw();
  if (!P) { console.log('- skipped: Playwright is not installed'); return; }
  const browser = await P.chromium.launch(CHROME ? { executablePath: CHROME, headless: true } : { headless: true });
  const url = 'file://' + path.join(__dirname, '..', 'index.html');
  let failed = 0;
  for (const [w, h] of [[390, 844], [1366, 768]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: w < 900 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    await page.evaluate(() => {
      const st = G.game.newManager({ name: 'Prova Manager', nat: 'ESP', bg: 'prov', age: 40, seed: 7 });
      G.mgr.start(st, { club: st.world.clubs.find(c => c.name === 'Real Sociedad B' || c.name === 'Bologna').id, fans: 0, perks: null, bandiera: 0 });
      G.state = st; G.ui.tab = 'rosa'; G.ui.render();
    });
    const out = [];
    const pitchTop = await page.evaluate(() => document.querySelector('.pitch').getBoundingClientRect().top);
    if (pitchTop >= h * 0.6) out.push('the pitch starts at ' + Math.round(pitchTop) + ' px, too low on a screen of ' + h);
    const cut = await page.evaluate(() => [...document.querySelectorAll('.pc .name')].filter(n => n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1).map(n => n.textContent));
    if (cut.length) out.push('names cut: ' + cut.slice(0, 5).join(', '));
    await page.click('.pitch .pc >> nth=5');
    const panel = await page.evaluate(() => { const r = document.querySelector('.pepanel').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: r.height }; });
    if (!(panel.h > 0 && panel.top >= 0 && panel.top < h)) out.push('the panel is not on screen after a tap: ' + JSON.stringify(panel));
    await page.click('.pepanel button[data-v="sub"]');
    const box = await page.evaluate(() => { const r = document.querySelector('.pside').getBoundingClientRect(); return { top: r.top, h: r.height, subs: document.querySelectorAll('[data-act="pesub"]').length }; });
    if (!box.subs || box.top < 0 || box.top >= h || (w < 900 && box.h > h * 0.5)) out.push('🔁 Sostituisci: ' + JSON.stringify(box));
    if (errors.length) out.push('errors: ' + errors.join(' | '));
    console.log((out.length ? '✗ ' : '✓ ') + w + ' px · pitch at ' + Math.round(pitchTop) + ' px, panel at ' + Math.round(panel.top) + '-' + Math.round(panel.bottom));
    out.forEach(x => console.log('    ' + x));
    if (out.length) failed++;
    await page.screenshot({ path: path.join(os.tmpdir(), 'pc-formation-' + w + '.png') });
    await page.close();
  }
  // the bench: compact cards (at most 60% of the old ones, as tall as 1.2 times their width), 5-6 a row on a computer and 2-3 on a phone, every
  // name whole and longer than 2 letters; a tap on a first substitute opens his panel with "Togli dai primi cambi"
  for (const [w, h] of [[390, 844], [1366, 900], [1560, 900]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: w < 900 });
    await page.goto(url);
    const bad = await page.evaluate(w => {
      const st = G.game.newManager({ name: 'Prova Manager', nat: 'ESP', bg: 'prov', age: 40, seed: 7 });
      G.mgr.start(st, { club: st.world.clubs.find(c => c.name === 'Real Sociedad B' || c.name === 'Bologna').id, fans: 0, perks: null, bandiera: 0 });
      const club = st.world.clubs[st.mgr.club], hakim = st.world.players.find(p => p && / El$/.test(p.n));
      if (hakim) { const id = club.sq[club.sq.length - 1]; st.world.players[id].n = hakim.n; }  // a name with a particle, as in the report
      G.state = st; G.ui.tab = 'rosa'; G.ui.render();
      const out = [];
      document.querySelectorAll('.bgrp .bench').forEach(g => {
        const cards = [...g.querySelectorAll('.pb')], cols = new Set(cards.map(c => Math.round(c.getBoundingClientRect().left))).size, want = w < 900 ? [2, 3] : [5, 6];
        if (cards.length >= want[1] && (cols < want[0] || cols > want[1])) out.push(cards.length + ' cards on ' + cols + ' columns');
        cards.forEach(c => { const r = c.getBoundingClientRect(); if (r.height > r.width * 1.2 * 0.6) out.push('a bench card ' + Math.round(r.height) + ' px tall and ' + Math.round(r.width) + ' wide'); });
      });
      document.querySelectorAll('.pc .name, .pb .nm').forEach(n => { const t = n.textContent.replace(/[©🌱💤🚑0-9 ]/gu, ''); if (t.length <= 2 || n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1) out.push('name "' + n.textContent + '"'); });
      return [...new Set(out)];
    }, w);
    await page.click('.bg-first .pb >> nth=0');
    const panel = await page.evaluate(() => { const p = document.querySelector('.pepanel'), r = p.getBoundingClientRect(); return { top: r.top, h: r.height, off: p.textContent.indexOf('Togli dai primi cambi') >= 0 }; });
    if (!panel.off || panel.top < 0 || panel.top >= h) bad.push('the panel of a first substitute: ' + JSON.stringify(panel));
    console.log((bad.length ? '✗ ' : '✓ ') + w + ' px · bench' + (bad.length ? ': ' + bad.slice(0, 5).join(', ') : ''));
    if (bad.length) failed++;
    await page.screenshot({ path: path.join(os.tmpdir(), 'pc-bench-' + w + '.png'), fullPage: true });
    await page.close();
  }
  // 🔄 Turnover: the switch of 🤖 Assistente, visible and working
  for (const [w, h] of [[390, 844], [1366, 768]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: w < 900 });
    await page.goto(url);
    await page.evaluate(() => {
      const st = G.game.newManager({ name: 'Prova Manager', nat: 'ESP', bg: 'prov', age: 40, seed: 7 });
      G.mgr.start(st, st.mgrOffers.list[0]); G.state = st; st.mgr.assist.rotate = 1;
    });
    const out = [], seen = sel => page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { on: r.width > 0 && r.top >= -1 && r.bottom <= innerHeight + 1, t: e.textContent }; }, sel);
    let b;
    await page.evaluate(() => { G.ui.tab = 'panchina'; G.ui.sel.assist = false; G.ui.render(); });
    await page.click('[data-act="massist"]');
    await page.locator('[data-act="mast"][data-v="rotate"]').scrollIntoViewIfNeeded();
    b = await seen('[data-act="mast"][data-v="rotate"]');
    if (!b || !b.on || !/Turnover · acceso/.test(b.t)) out.push('the switch in 🤖 Assistente: ' + JSON.stringify(b));
    await page.click('[data-act="mast"][data-v="rotate"]');
    if (await page.evaluate(() => G.state.mgr.assist.rotate) !== 0) out.push('the switch in 🤖 Assistente did not switch off');
    console.log((out.length ? '✗ ' : '✓ ') + w + ' px · 🔄 Turnover' + (out.length ? ': ' + out.join(', ') : ''));
    if (out.length) failed++;
    await page.close();
  }
  // M9 S2: the 🧭 Panchine tab (an open bench, the contract with a renewal) and the screen without a job with
  // "⏩ Aspetta offerte": no script error, no undefined or NaN, nothing wider than the screen
  for (const [w, h] of [[390, 844], [1366, 768]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: w < 900 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    const look = () => page.evaluate(() => ({ text: document.body.innerText, wide: document.documentElement.scrollWidth > innerWidth + 1 }));
    await page.evaluate(() => {
      const st = G.game.newManager({ name: 'Prova Manager', nat: 'ITA', bg: 'naz', age: 40, seed: 7 });
      G.mgr.start(st, st.mgrOffers.list[0]); G.state = st;
      st.mgr.renew = { years: 2, wage: 9 };
      G.coaches.sack(st, st.world.clubs.filter(c => c.id !== st.mgr.club).sort((a, b) => a.rep - b.rep)[0], G.rng, 'prova');
      st.mgr.rep = 80;  // followed by the clubs around: the interview comes (M9 S3)
      G.ui.tab = 'panchine'; G.ui.render();
    });
    const out = [], tab = await look();
    if (!/Panchine aperte/i.test(tab.text) || !/Candidati/i.test(tab.text) || !/rinnovo/i.test(tab.text) || !/Chi ti segue/i.test(tab.text)) out.push('🧭 Panchine: a part is missing');
    if (!/Identità/.test(tab.text)) out.push('no identity on the open bench');
    // M9 S3: the club is interested, so an interview comes first; one answer per question, then the application
    await page.click('[data-act="mjapply"]');
    const talk = await look();
    if (!/colloquio/.test(talk.text) || !/Che calcio vuoi fare/.test(talk.text)) out.push('no interview');
    for (const q of await page.evaluate(() => G.mgrId.questions(G.state.world, G.state.world.clubs[G.ui.iv.club]).map(q => q.k + ':' + q.o[0][0]))) await page.click('[data-act="mjans"][data-v="' + q + '"]');
    await page.click('[data-act="mjsend"]');
    if (!/Candidatura inviata.*colloquio/.test((await look()).text)) out.push('the application did not show');
    if (talk.wide) out.push('the interview is wider than the screen');
    await page.evaluate(() => { G.mgrJobs.resign(G.state); G.ui.render(); });
    const idle = await look();
    if (!/Manager senza squadra/i.test(idle.text) || !/Aspetta offerte/i.test(idle.text)) out.push('the screen without a job is missing');
    if (!/Identità/.test(idle.text)) out.push('no identity in the offers');
    await page.click('[data-act="mjwait"]');
    const after = await look();
    if (!/senza squadra da [1-9]/.test(after.text)) out.push('⏩ Aspetta offerte did not move the days');
    [tab, idle, after].forEach(x => { if (/undefined|NaN/.test(x.text)) out.push('undefined or NaN on the page'); if (x.wide) out.push('the page is wider than the screen'); });
    if (errors.length) out.push('errors: ' + errors.join(' | '));
    console.log((out.length ? '✗ ' : '✓ ') + w + ' px · 🧭 Panchine and without a job' + (out.length ? ': ' + [...new Set(out)].join(', ') : ''));
    if (out.length) failed++;
    await page.close();
  }
  // M9 S4: the 🏛️ Società tab in the summer: the pact open (on a phone it opens first), a level chosen, the board's
  // request answered, a request to the board; no script error, no undefined or NaN, nothing wider than the screen
  for (const [w, h] of [[390, 844], [1366, 768]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: w < 900 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    const look = () => page.evaluate(() => ({ text: document.body.innerText, wide: document.documentElement.scrollWidth > innerWidth + 1, open: [...document.querySelectorAll('.soc details')].map(d => d.open ? 1 : 0).join('') }));
    await page.evaluate(() => {
      const st = G.game.newManager({ name: 'Prova Manager', nat: 'ITA', bg: 'naz', age: 40, seed: 9 });
      G.mgr.start(st, st.mgrOffers.list[0]); G.state = st;
      const m = st.mgr; m.conf = 60;
      m.breq = { k: 'play', id: st.world.clubs[m.club].sq[0], due: 2, y: st.S.year, base: 0 };
      G.ui.tab = 'panchina'; G.ui.render();
    });
    const out = [], bench = await look();
    if (!/Scegli il patto/.test(bench.text) || !/Obiettivi ✅/.test(bench.text)) out.push('the bench has no line of the board');
    await page.click('[data-act="tab"][data-v="societa"]');
    const tab = await look();
    ['Il presidente e la fiducia', 'Il patto di questa stagione', 'Gli obiettivi', 'Le aspettative', 'I soldi', 'Le richieste'].forEach(t => { if (tab.text.toLowerCase().indexOf(t.toLowerCase()) < 0) out.push('no section ' + t); });
    if (w < 900 && tab.open !== '010001') out.push('on a phone the sections open are ' + tab.open + ', the pact (and the request waiting) expected');
    if (w >= 900 && tab.open !== '111111') out.push('on a computer the sections open are ' + tab.open);
    await page.click('[data-act="mpact"][data-v="amb"]');
    const amb = await look();
    if (!/Patto 📈 Ambizioso/.test(amb.text) || !/Anticipo da restituire/.test(amb.text)) out.push('Ambizioso not chosen');
    await page.click('[data-act="mbreq"][data-v="1"]');
    if (!/Hai detto sì/.test((await look()).text)) out.push('the board\'s request not answered');
    if (w < 900) await page.click('[data-act="socopen"][data-v="5:1"]');  // on a phone the requests fold once answered
    await page.click('[data-act="mask"][data-v="bud"]');
    const ask = await look();
    if (!/Budget d’emergenza: (\+|la società dice di no)/.test(ask.text) || !/Le richieste fatte/.test(ask.text)) out.push('the request to the board did not show');
    [bench, tab, amb, ask].forEach(x => { if (/undefined|NaN/.test(x.text)) out.push('undefined or NaN on the page'); if (x.wide) out.push('the page is wider than the screen'); });
    if (errors.length) out.push('errors: ' + errors.join(' | '));
    console.log((out.length ? '✗ ' : '✓ ') + w + ' px · 🏛️ Società' + (out.length ? ': ' + [...new Set(out)].join(', ') : ''));
    if (out.length) failed++;
    await page.close();
  }
  // M9 S5: a new career chosen as Trequartista on the creation screen, the header, the 🧭 Posizioni card of the Profile
  // and a request to the coach; no script error, no undefined or NaN, nothing wider than the screen
  for (const [w, h] of [[390, 844], [1366, 768]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: w < 900 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept());
    await page.goto(url);
    const look = () => page.evaluate(() => ({ text: document.body.innerText, wide: document.documentElement.scrollWidth > innerWidth + 1 }));
    await page.evaluate(() => { G.ui.ctype = 'pl'; G.ui.renderCreate(); });
    const out = [], form = await look();
    if (!/Posizione/i.test(form.text)) out.push('no position on the creation screen');
    await page.selectOption('#c-role', 'TRQ');
    await page.fill('#c-name', 'Prova Trequartista');
    await page.click('[data-act="create"]');
    const home = await look();
    if (!/TRQ · Trequartista/.test(home.text)) out.push('the header does not show the position');
    // an event card of the first block would cover the page; the coach says yes, so the change of position shows
    await page.evaluate(() => { G.state.event = null; G.CFG2.POS.ASK.P = [1, 1]; G.ui.tab = 'profilo'; G.ui.render(); });
    const prof = await look();
    if (!/Posizioni/i.test(prof.text) || !/Familiarità/i.test(prof.text) || !/Imparare la posizione/i.test(prof.text)) out.push('no positions card or focus');
    await page.click('[data-act="posask"]');
    const asked = await look();
    if (!/Il mister dice sì/.test(asked.text)) out.push('the request to the coach did not show');
    if (/TRQ · Trequartista/.test(asked.text) || !/ci giochi/.test(asked.text)) out.push('the new position does not show');
    if (w < 900) await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'shots', 's5-posizioni-390.png'), fullPage: true });
    [form, home, prof, asked].forEach(x => { if (/undefined|NaN/.test(x.text)) out.push('undefined or NaN on the page'); if (x.wide) out.push('the page is wider than the screen'); });
    if (errors.length) out.push('errors: ' + errors.join(' | '));
    console.log((out.length ? '✗ ' : '✓ ') + w + ' px · 🧭 Posizioni' + (out.length ? ': ' + [...new Set(out)].join(', ') : ''));
    if (out.length) failed++;
    await page.close();
  }
  // M9 S6: the tactic's levers on the formation tab: three selectors with their effect in %, "Intesa tattica", the next
  // opponent's generic style (also on the pre-match card); a tap on Pressing alto shows its cost; nothing wider than the screen
  for (const [w, h] of [[390, 844], [1366, 768]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: w < 900 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    await page.evaluate(() => {
      const st = G.game.newManager({ name: 'Prova Manager', nat: 'ITA', bg: 'prov', age: 40, seed: 7 });
      G.mgr.start(st, { club: st.world.clubs.find(c => c.name === 'Bologna').id, fans: 0, perks: null, bandiera: 0 });
      G.state = st; G.ui.tab = 'rosa'; G.ui.render();
    });
    const look = () => page.evaluate(() => ({ text: document.body.innerText, wide: document.documentElement.scrollWidth > innerWidth + 1, on: [...document.querySelectorAll('[data-act="mlev"].on')].filter(b => b.offsetParent).map(b => b.dataset.v) }));
    const out = [], a = await look();
    ['Pressing', 'Costruzione', 'Linea difensiva', 'Intesa tattica', 'Di solito gioca con'].forEach(t => { if (!new RegExp(t, 'i').test(a.text)) out.push('no "' + t + '"'); });
    if (a.on.join() !== 'press:1,build:1,line:1') out.push('the vice\'s levers: ' + a.on.join());
    await page.locator('[data-act="mlev"][data-v="press:2"]:visible').first().click();
    const b = await look();
    if (b.on.indexOf('press:2') < 0 || !/\+4% gol fatti/.test(b.text) || !/Condizione persa a partita \+40%/.test(b.text)) out.push('Pressing alto does not show its effect');
    if (w < 900) await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'shots', 's6-tattica-390.png'), fullPage: true });
    await page.evaluate(() => { G.ui.tab = 'carriera'; G.ui.render(); });
    const c = await look();
    if (!/Stile: /.test(c.text)) out.push('no style on the pre-match card');
    [a, b, c].forEach(x => { if (/undefined|NaN/.test(x.text)) out.push('undefined or NaN on the page'); if (x.wide) out.push('the page is wider than the screen'); });
    if (errors.length) out.push('errors: ' + errors.join(' | '));
    console.log((out.length ? '✗ ' : '✓ ') + w + ' px · 🧠 Tattica' + (out.length ? ': ' + [...new Set(out)].join(', ') : ''));
    if (out.length) failed++;
    await page.close();
  }
  await browser.close();
  process.exitCode = failed ? 1 : 0;
})();
