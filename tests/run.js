// All the project's checks in one command (Node only, nothing to install):
//   node tests/run.js              files and data, types (when TypeScript is installed), every career
//   node tests/run.js --update     record the current careers as the reference in tests/golden.json
//   node tests/run.js --only=ID    one career of tests/scenarios.js
//   node tests/run.js --quick      files, data and types only
// Careers: the fixed-seed scenarios of tests/scenarios.js, each in its own process. Each must play without
// errors, keep the rules of tests/checks.js and match its fingerprint in tests/golden.json: same seeds, same
// results, so a change that only adds types or comments keeps every fingerprint.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { execFile, execFileSync } = require('child_process');
const harness = require('./harness'), checks = require('./checks'), m8 = require('./checks-m8');
const GOLDEN = path.join(__dirname, 'golden.json');

// Child process: play one career, check it, print the result
const child = process.argv.find(a => a.startsWith('--child='));
if (child) {
  const { LIST } = require('./scenarios');
  const sc = LIST.find(s => s.id === child.slice(8)), t0 = Date.now(), G = harness.load(), seen = checks.watch(G);
  const st = sc.run(G);
  process.stdout.write(JSON.stringify({ s: checks.summary(G, st), problems: checks.career(G, st, seen), ms: Date.now() - t0 }));
  return;
}

let failed = 0;
function report(title, problems, note) {
  console.log((problems.length ? '✗ ' : '✓ ') + title + (note ? '  (' + note + ')' : ''));
  problems.slice(0, 20).forEach(p => console.log('    ' + p));
  if (problems.length > 20) console.log('    ... and ' + (problems.length - 20) + ' more');
  if (problems.length) failed++;
}

// TypeScript as a checker only: tsc -p jsconfig.json, when tsc is installed
function types() {
  const local = path.join(harness.ROOT, 'node_modules', '.bin', 'tsc'), tsc = fs.existsSync(local) ? local : 'tsc', t0 = Date.now();
  try {
    execFileSync(tsc, ['-p', 'jsconfig.json'], { cwd: harness.ROOT, encoding: 'utf8', stdio: 'pipe' });
    report('types: tsc -p jsconfig.json', [], (Date.now() - t0) + 'ms');
  } catch (e) {
    if (e.code === 'ENOENT') return console.log('- types: skipped, TypeScript is not installed (npm install -g typescript)');
    const lines = String(e.stdout || e.message).split('\n').filter(l => / error TS/.test(l));
    report('types: tsc -p jsconfig.json', lines.length ? lines : [String(e.stdout || e.message).trim()], lines.length + ' errors');
  }
}

function careers(ids, workers) {
  return new Promise(done => {
    const res = {}, queue = ids.slice();
    let running = 0;
    const next = () => {
      if (!queue.length && !running) return done(res);
      while (running < workers && queue.length) {
        const id = queue.shift(); running++;
        execFile(process.execPath, [__filename, '--child=' + id], { maxBuffer: 1 << 26 }, (err, out, errOut) => {
          res[id] = err ? { error: (errOut || String(err)).split('\n').slice(0, 8).join('\n') } : JSON.parse(out);
          running--; next();
        });
      }
    };
    next();
  });
}

(async () => {
  const argv = process.argv, update = argv.includes('--update'), only = argv.find(a => a.startsWith('--only='));
  const t0 = Date.now();
  report('files: index.html, @ts-check, one G', checks.files(harness.ROOT));
  let G = null;
  try { G = harness.load(); report('the game loads', []); } catch (e) { report('the game loads', [String(e.stack || e).split('\n').slice(0, 4).join(' | ')]); }
  if (G) report('data: event, press and manager cards, decisive moments', checks.data(G));
  if (G) m8.CHECKS.filter(c => !(c.slow && argv.includes('--quick'))).forEach(c => { let p; try { p = c.f(harness.load); } catch (e) { p = [String(e.stack || e).split('\n').slice(0, 4).join(' | ')]; } report(c.t, p); });
  types();
  if (!argv.includes('--quick')) {
    const { LIST } = require('./scenarios');
    const ids = LIST.map(s => s.id).filter(id => !only || id === only.slice(7));
    if (!ids.length) report('careers', ['no scenario called ' + only.slice(7)]);
    const ref = fs.existsSync(GOLDEN) ? JSON.parse(fs.readFileSync(GOLDEN, 'utf8')) : {};
    const res = await careers(ids, Math.max(1, Math.min(ids.length, os.cpus().length - 1)));
    let changed = 0;
    ids.forEach(id => {
      const r = res[id], problems = [];
      if (r.error) problems.push(r.error);
      else {
        problems.push(...r.problems);
        const same = ref[id] && JSON.stringify(ref[id]) === JSON.stringify(r.s);
        if (!same && !update) problems.push('differs from tests/golden.json', '  now ' + JSON.stringify(r.s), '  was ' + JSON.stringify(ref[id] || null));
        if (update && !r.problems.length) { if (!same) changed++; ref[id] = r.s; }
      }
      report('career ' + id, problems, r.ms ? Math.round(r.ms / 100) / 10 + 's' : '');
    });
    if (update && !failed) { fs.writeFileSync(GOLDEN, JSON.stringify(ref, null, 1) + '\n'); console.log('tests/golden.json updated (' + changed + ' changed)'); }
    else if (update) console.log('tests/golden.json not updated: fix the problems first');
  }
  console.log(failed ? failed + ' check(s) failed' : 'all checks passed', '·', Math.round((Date.now() - t0) / 1000) + 's');
  process.exitCode = failed ? 1 : 0;
})();
