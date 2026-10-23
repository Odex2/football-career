// Loads the game in Node exactly as the page does: the scripts listed in index.html, in order, inside one
// sandbox that plays the browser's window (with an in-memory localStorage and an empty document).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');

function scripts() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
}

function memoryStorage() {
  const data = {};
  return {
    getItem: k => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: k => { delete data[k]; },
    clear: () => { for (const k in data) delete data[k]; }
  };
}

// A fresh game: returns the sandbox's G
function load() {
  const nop = () => null;
  const doc = { getElementById: nop, querySelector: nop, querySelectorAll: () => [], addEventListener: nop, createElement: () => ({ style: {}, classList: { add: nop, remove: nop } }), body: null, documentElement: {} };
  const box = { console, localStorage: memoryStorage(), document: doc, setTimeout, clearTimeout, URL: { createObjectURL: nop, revokeObjectURL: nop }, confirm: () => true, alert: nop };
  box.window = box;
  vm.createContext(box);
  for (const src of scripts()) vm.runInContext(fs.readFileSync(path.join(ROOT, src), 'utf8'), box, { filename: src });
  Object.defineProperty(box.G, 'sandbox', { value: box });  // its localStorage, for the checks of the saves
  return box.G;
}

module.exports = { load, scripts, ROOT };
