// Shows what the indexes are actually doing. Each case runs twice: once as the
// planner would run it, and once forced onto a collection scan with a $natural
// hint. The pair is the evidence. One number on its own says nothing.
//
//   node tools/explain_indexes.js
//   node tools/explain_indexes.js --scale 50000
//
// The scale flag builds a throwaway collection of generated trips, indexes it
// the same way, measures against that, then drops it. The real trips
// collection is only ever read.
require('dotenv').config();
require('../app_api/models/db');
const mongoose = require('mongoose');
const { buildTripQuery } = require('../app_api/query/tripQuery');

const SAMPLE_COLLECTION = 'trips_explain_sample';

const RESORTS = [
  'Emerald Bay Resort, 3 stars',
  'Coral Sands, 4 stars',
  'Alpine Ridge Lodge, 4 stars',
  'Savanna Plains Camp, 5 stars',
  'Harbor Point Inn, 3 stars',
  'Cliffside Retreat, 5 stars',
];

const CASES = [
  {
    label: 'equality on resort, sorted by start',
    query: { resort: 'Coral Sands, 4 stars', sort: 'start' },
    expect: 'resort_1_start_1',
  },
  {
    label: 'date range on start, sorted by name',
    query: { startAfter: '2026-01-01', startBefore: '2026-12-31', sort: 'name' },
    expect: 'name_1_start_1',
  },
  {
    label: 'equality on code, the unique index',
    query: { code: 'GALR210214' },
    expect: 'code_1',
  },
  {
    label: 'anchored name prefix against the lowercased field',
    query: { name: 'Re' },
    expect: 'nameLower_1',
  },
];

// Walks whatever shape the server hands back and pulls out every stage name and
// index name. The plan is nested differently across server versions, so this
// does not assume a fixed depth.
function collect(node, stages, indexes) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const child of node) collect(child, stages, indexes);
    return;
  }
  if (typeof node.stage === 'string') stages.push(node.stage);
  if (typeof node.indexName === 'string') indexes.push(node.indexName);
  for (const key of ['winningPlan', 'queryPlan', 'inputStage', 'inputStages', 'shards', 'executionStages']) {
    if (node[key]) collect(node[key], stages, indexes);
  }
}

function readPlan(explain) {
  const stages = [];
  const indexes = [];
  collect(explain.queryPlanner, stages, indexes);
  collect(explain.executionStats, stages, indexes);
  const unique = [...new Set(stages)];
  const stats = explain.executionStats || {};
  // EXPRESS_IXSCAN is the 8.x fast path for equality on a unique index. It is
  // an index scan, so an exact match against 'IXSCAN' misses it.
  return {
    stages: unique,
    indexName: indexes[0] || null,
    usedIndex: unique.some((s) => s.includes('IXSCAN')),
    returned: stats.nReturned,
    docsExamined: stats.totalDocsExamined,
    keysExamined: stats.totalKeysExamined,
  };
}

async function runCase(collection, testCase) {
  const { filter, options } = buildTripQuery(testCase.query);

  const shape = (hint) => {
    let cursor = collection.find(filter);
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.limit) cursor = cursor.limit(options.limit);
    if (hint) cursor = cursor.hint(hint);
    return cursor.explain('executionStats');
  };

  const planned = readPlan(await shape(null));
  let forced = null;
  try {
    forced = readPlan(await shape({ $natural: 1 }));
  } catch (err) {
    forced = null;
  }
  return { planned, forced };
}

function generateTrips(offset, count) {
  const docs = [];
  const base = Date.UTC(2026, 0, 1);
  const day = 24 * 60 * 60 * 1000;
  for (let i = offset; i < offset + count; i += 1) {
    docs.push({
      code: `SYN${String(i).padStart(8, '0')}`,
      name: `Trip ${String(i).padStart(7, '0')}`,
      nameLower: `trip ${String(i).padStart(7, '0')}`,
      length: '5 nights / 6 days',
      start: new Date(base + (i % 900) * day),
      resort: RESORTS[i % RESORTS.length],
      perPerson: (500 + (i % 2000)).toFixed(2),
      image: 'placeholder.jpg',
      description: 'Generated for index measurement.',
    });
  }
  return docs;
}

async function buildSample(db, count) {
  const existing = await db.listCollections({ name: SAMPLE_COLLECTION }).toArray();
  if (existing.length > 0) await db.collection(SAMPLE_COLLECTION).drop();

  const collection = db.collection(SAMPLE_COLLECTION);
  const BATCH = 5000;
  for (let start = 0; start < count; start += BATCH) {
    const size = Math.min(BATCH, count - start);
    await collection.insertMany(generateTrips(start, size), { ordered: false });
  }
  await collection.createIndex({ code: 1 }, { unique: true, name: 'code_1' });
  await collection.createIndex({ nameLower: 1 }, { name: 'nameLower_1' });
  await collection.createIndex({ resort: 1, start: 1 }, { name: 'resort_1_start_1' });
  await collection.createIndex({ name: 1, start: 1 }, { name: 'name_1_start_1' });
  return collection;
}

function parseScale(argv) {
  const at = argv.indexOf('--scale');
  if (at === -1) return null;
  const value = Number.parseInt(argv[at + 1], 10);
  if (!Number.isInteger(value) || value < 1) return null;
  return value;
}

async function main() {
  const scale = parseScale(process.argv);
  await new Promise((resolve) => mongoose.connection.once('connected', resolve));
  const db = mongoose.connection.db;

  let collection;
  let cases = CASES;

  if (scale) {
    console.log(`Building a throwaway collection of ${scale} generated trips.`);
    collection = await buildSample(db, scale);
    cases = CASES.map((c) => {
      if (c.query.code) return { ...c, query: { ...c.query, code: 'SYN00000042' } };
      if (c.query.name) return { ...c, query: { ...c.query, name: 'Trip 000004' } };
      return c;
    });
    console.log('');
  } else {
    collection = db.collection('trips');
    const count = await collection.countDocuments();
    console.log(`Measuring against the real trips collection (${count} documents).`);
    if (count < 1000) {
      console.log('That is a small collection, so both paths will look similar.');
      console.log('Run with --scale 50000 to see the difference at size.');
    }
    console.log('');
  }

  const indexes = await collection.indexes();
  console.log('Indexes present:');
  for (const ix of indexes) {
    console.log(`  ${ix.name.padEnd(20)} ${JSON.stringify(ix.key)}${ix.unique ? '  unique' : ''}`);
  }
  console.log('');

  let served = 0;
  let matched = 0;
  for (const testCase of cases) {
    const { planned, forced } = await runCase(collection, testCase);
    if (planned.usedIndex) served += 1;

    console.log(testCase.label);
    console.log(`  plan:           ${planned.stages.join(' <- ')}`);
    console.log(`  index used:     ${planned.indexName || 'none'}`);
    if (testCase.expect) {
      const isMatch = planned.indexName === testCase.expect;
      if (isMatch) matched += 1;
      console.log(`  expected:       ${testCase.expect} ${isMatch ? '(match)' : '(planner chose otherwise)'}`);
    }
    console.log(`  returned:       ${planned.returned}`);
    console.log(`  examined:       ${planned.docsExamined} documents, ${planned.keysExamined} index keys`);
    if (forced) {
      console.log(`  forced scan:    ${forced.docsExamined} documents examined for the same ${forced.returned} results`);
      if (planned.docsExamined > 0 && forced.docsExamined > planned.docsExamined) {
        const ratio = (forced.docsExamined / planned.docsExamined).toFixed(1);
        console.log(`  difference:     the collection scan reads ${ratio} times as many documents`);
      }
    }
    console.log(`  verdict:        ${planned.usedIndex ? 'index scan' : 'collection scan'}`);
    console.log('');
  }

  console.log(`${served} of ${cases.length} cases served by an index.`);
  console.log(`${matched} of ${cases.length} used the index I expected.`);

  if (scale) {
    await db.collection(SAMPLE_COLLECTION).drop();
    console.log(`Dropped ${SAMPLE_COLLECTION}.`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  try { await mongoose.connection.close(); } catch (e) { /* connection already gone */ }
  process.exit(1);
});
