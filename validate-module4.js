#!/usr/bin/env node
//
// validate-module4.js
// Checks the CS 465 Module Four deliverables against the rubric.
// Run from your travlr project root, with MongoDB running and after seeding:
//   node validate-module4.js
//
const fs = require('fs');

const C = { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', c: '\x1b[36m', d: '\x1b[2m', x: '\x1b[0m' };
const results = [];
const add = (group, label, ok, note = '') => results.push({ group, label, ok, note });

const REQUIRED = ['code', 'name', 'length', 'start', 'resort', 'perPerson', 'image', 'description'];
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);

// --- Database Access (35) ---------------------------------------------------
const db = read('app_api/models/db.js');
add('Database Access (35)', 'db.js exists', !!db);
if (db) {
  add('Database Access (35)', 'opens a Mongoose connection', /mongoose\.connect/.test(db));
  add('Database Access (35)', 'has error handling', /connection\.on\(\s*['"]error['"]/.test(db));
}
const appjs = read('app.js');
add('Database Access (35)', 'db.js wired into app.js', !!appjs && /app_api\/models\/db/.test(appjs));

// --- API Integration (35) ---------------------------------------------------
const model = read('app_api/models/travlr.js');
add('API Integration (35)', 'travlr.js exists', !!model);
if (model) {
  add('API Integration (35)', 'defines a Schema', /new\s+mongoose\.Schema/.test(model));
  add('API Integration (35)', 'has required-field validation', /required:\s*true/.test(model));
  add('API Integration (35)', 'registers a model', /mongoose\.model\(/.test(model));
}

// --- Populate Database (20) -------------------------------------------------
const tripsRaw = read('app_api/data/trips.json');
add('Populate Database (20)', 'trips.json exists', !!tripsRaw);
let trips = null;
if (tripsRaw) {
  try { trips = JSON.parse(tripsRaw); add('Populate Database (20)', 'trips.json is valid JSON', true); }
  catch (e) { add('Populate Database (20)', 'trips.json is valid JSON', false, e.message); }
}
if (Array.isArray(trips)) {
  add('Populate Database (20)', `has sample trips (${trips.length})`, trips.length > 0);
  add('Populate Database (20)', 'every trip has all schema fields',
    trips.every((t) => REQUIRED.every((f) => f in t)));
}
const seed = read('app_api/seed.js');
add('Populate Database (20)', 'seed.js exists', !!seed);
if (seed) add('Populate Database (20)', 'seed.js inserts via the model', /insertMany|\.create\(|\.save\(/.test(seed));

// --- Environment ------------------------------------------------------------
try {
  const v = require('mongoose/package.json').version;
  const major = parseInt(v, 10);
  add('Environment', `mongoose@${v} installed`, true);
  add('Environment', 'mongoose works on this Node',
    major < 9 || parseInt(process.versions.node, 10) >= 20,
    major >= 9 ? 'Mongoose 9 needs Node 20+ — pin mongoose@^8' : '');
} catch {
  add('Environment', 'mongoose installed', false, 'run: npm install mongoose@^8');
}

// --- Testing (10): live read from MongoDB -----------------------------------
async function dbCheck() {
  let mongoose;
  try { mongoose = require('mongoose'); }
  catch { add('Testing (10)', 'can load mongoose', false); return; }
  try { require('./app_api/models/travlr'); } catch { /* registered elsewhere */ }
  try {
    await mongoose.connect('mongodb://127.0.0.1/travlr', { serverSelectionTimeoutMS: 3000 });
    const Trip = mongoose.model('trips');
    const count = await Trip.countDocuments();
    add('Testing (10)', `data present in MongoDB (${count} docs)`, count > 0);
    const one = await Trip.findOne().lean();
    if (one) {
      let json = false;
      try { JSON.stringify(one); json = true; } catch { /* not serializable */ }
      add('Testing (10)', 'a trip returns as JSON', json);
    }
  } catch {
    add('Testing (10)', 'connect + retrieve from MongoDB', false,
      'is mongod running, and did you run `node app_api/seed.js`?');
  } finally {
    try { await mongoose.connection.close(); } catch { /* ignore */ }
  }
}

(async () => {
  await dbCheck();
  console.log(`\n${C.c}Module Four validation${C.x}\n`);
  for (const g of [...new Set(results.map((r) => r.group))]) {
    console.log(`${C.c}${g}${C.x}`);
    for (const r of results.filter((x) => x.group === g)) {
      const mark = r.ok ? `${C.g}\u2713${C.x}` : `${C.r}\u2717${C.x}`;
      console.log(`  ${mark} ${r.label}${r.note ? `  ${C.d}(${r.note})${C.x}` : ''}`);
    }
    console.log('');
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(failed === 0
    ? `${C.g}All checks passed \u2014 your Module Four deliverables look complete.${C.x}\n`
    : `${C.y}${failed} check(s) need attention (see \u2717 above).${C.x}\n`);
  process.exit(failed === 0 ? 0 : 1);
})();
