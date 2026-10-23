// Kept so the older notes still work: the fingerprints in tests/golden.json are now
// checked by tests/run.js, together with files, data and types. Same options:
//   node tests/golden.js             = node tests/run.js
//   node tests/golden.js --update    record the current careers as the reference
//   node tests/golden.js --only=ID   one career
'use strict';
require('./run.js');
