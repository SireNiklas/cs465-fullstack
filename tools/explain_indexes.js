// Proves the compound indexes are doing work. Runs the queries the browse
// screen sends and reports whether Mongo used an index scan or read the whole
// collection. Run: npm run explain
require('dotenv').config();
require('../app_api/models/db');
const mongoose = require('mongoose');
const Trip = require('../app_api/models/travlr');
const { buildTripQuery } = require('../app_api/query/tripQuery');

const CASES = [
  {
    label: 'filter by resort, sorted by start date',
    query: { resort: 'Coral Sands, 4 stars', sort: 'start' },
  },
  {
    label: 'date range, sorted by name',
    query: { startAfter: '2026-01-01', startBefore: '2026-12-31', sort: 'name' },
  },
  {
    label: 'lookup by code',
    query: { code: 'GALR210214' },
  },
  {
    label: 'name prefix, no supporting compound index',
    query: { name: 'Re' },
  },
];

function stageOf(plan) {
  let node = plan;
  const chain = [];
  while (node) {
    chain.push(node.stage);
    node = node.inputStage;
  }
  return chain;
}

async function main() {
  await new Promise((resolve) => mongoose.connection.once('connected', resolve));
  await Trip.syncIndexes();

  const indexes = await Trip.collection.indexes();
  console.log('Indexes on trips:');
  for (const ix of indexes) {
    console.log(`  ${ix.name}  ${JSON.stringify(ix.key)}${ix.unique ? '  unique' : ''}`);
  }
  console.log('');

  let indexed = 0;
  for (const testCase of CASES) {
    const { filter, options } = buildTripQuery(testCase.query);
    let q = Trip.find(filter);
    if (options.sort) q = q.sort(options.sort);
    if (options.limit) q = q.limit(options.limit);

    const result = await q.explain('executionStats');
    const chain = stageOf(result.queryPlanner.winningPlan);
    const stats = result.executionStats;
    const usedIndex = chain.includes('IXSCAN');
    if (usedIndex) indexed += 1;

    console.log(testCase.label);
    console.log(`  plan:      ${chain.join(' <- ')}`);
    console.log(`  returned:  ${stats.nReturned}`);
    console.log(`  examined:  ${stats.totalDocsExamined} documents, ${stats.totalKeysExamined} index keys`);
    console.log(`  verdict:   ${usedIndex ? 'index scan' : 'collection scan'}`);
    console.log('');
  }

  console.log(`${indexed} of ${CASES.length} cases served by an index.`);
  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.connection.close();
  process.exit(1);
});
