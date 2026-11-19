# Contributing

Thanks for your interest! Bug reports, balance feedback and pull requests are welcome.

## Ground rules

- **No build step, ever.** The game must keep working by double-clicking `index.html`: plain JavaScript, classic `<script>` tags (no ES modules), one global namespace `G`, no runtime dependencies.
- **Small files.** One responsibility per file, about 300 lines max. New code usually goes in a new file, added to `index.html` after the files it depends on.
- **Balance numbers live in config.** `js/config.js` (player career) and `js/config-mgr.js` (manager career), not hard-coded in the logic.
- **Code and comments in English.** The interface is currently in Italian.
- **No choice may block the simulation.** Every new decision has a sensible default, so "Simulate season" keeps working.
- **New random choices use their own random numbers**, so the automatic simulation doesn't shift the rest of the world.
- **Old saves must keep loading**: migrate missing fields with defaults.

## Type checking

TypeScript is used only as a checker (`tsc -p jsconfig.json`, strict mode); nothing is compiled.

- Use **TypeScript 5.9** (`npm install -g typescript@5.9`). TypeScript 7 does not handle the global `G` namespace and reports thousands of errors.
- Every JS file starts with `// @ts-check`; `var G` is declared only in `js/config.js`.
- Public functions get JSDoc `@param` / `@returns`.
- A module starts empty and is filled one property at a time (`G.x = {}; G.x.a = 1;`). With `G.x = { a: 1 }` TypeScript treats the object as closed.
- New types go in `types/parts/`, one file per topic.
- When the code knows a value is present (e.g. `st.S` during a season), read it with `G.sure(x)`.

## Running the checks

```bash
node tests/run.js                 # everything (~2 min)
node tests/run.js --quick         # files, data and types only
node tests/run.js --only=ID       # one career from tests/scenarios.js
node tests/stats.js balance       # manager balance over 8 automatic seasons
```

What they check:

1. **Files**: `index.html` loads every file in `js/`, `config.js` first, and every file is type-checked.
2. **Data**: events, press conferences and decisive moments have unique ids, complete texts and valid effect keys.
3. **Types**: `tsc` reports zero errors.
4. **Careers**: fixed-seed player and manager careers (including old saves) are played to the end. Numbers stay finite and in range, squads stay consistent, save and reload give the same career, and no displayed text contains a placeholder or `undefined`.
5. **Fingerprints**: each career always ends the same way, so its fingerprint in `tests/golden.json` must not change.

### When fingerprints change

A change that only adds types or comments keeps every fingerprint. A change to the simulation will change some of them, which is expected:

1. Understand *why* each fingerprint changed before accepting it.
2. Record the new reference with `node tests/run.js --update`.
3. In the pull request, list the changed careers and the reason.

Fingerprints were recorded with **Node 25.8.2** (the version pinned in CI); a few careers can differ on other Node versions, and `player-por-eng` also differs on Linux x64. CI runs on macOS for this reason. If the checks fail before you change anything, check your Node version first.

## Pull requests

- Keep them focused: one feature or fix per PR.
- `node tests/run.js` must pass.
- For gameplay changes, describe what the player will notice and, if balance moves, include before/after numbers from `G.debug.simCareers(200)` or `node tests/stats.js balance`.
