// Naive full scan against the trie path. The ranking, the boost, and the paging
// are byte for byte the same on both sides, so the only thing being measured is
// how candidates get found.
//
//   node tools/benchmark.js
//   node tools/benchmark.js 100000
//
// Prints a table. Screenshot it for the narrative.

const { generate } = require('./seed_synthetic');
const { buildBaseScores } = require('../app_api/algorithms/rank');
const { createEngine, naiveQuery, serverFactors } = require('../app_api/algorithms');

const SIZES = [1000, 10000, 50000, Number(process.argv[2] || 75000)];
const PREFIXES = ['A', 'Al', 'Alp', 'Alpi', 'Alpin', 'Alpine'];
const REPS = 40;

function timeIt(fn) {
  const start = process.hrtime.bigint();
  for (let i = 0; i < REPS; i++) fn();
  return Number(process.hrtime.bigint() - start) / 1e6 / REPS;
}

function run(size) {
  const items = generate(size);
  const baseScores = buildBaseScores(items, serverFactors);

  const buildStart = process.hrtime.bigint();
  const engine = createEngine({ items });
  const buildMs = Number(process.hrtime.bigint() - buildStart) / 1e6;

  const favoriteIds = new Set(items.slice(0, 25).map((i) => i.id));

  let naiveTotal = 0;
  let trieTotal = 0;

  for (const prefix of PREFIXES) {
    naiveTotal += timeIt(() => naiveQuery({ items, baseScores, prefix, favoriteIds, boost: 0.15 }));
    trieTotal += timeIt(() => engine.query({ prefix, favoriteIds, boost: 0.15 }));
  }

  const naive = naiveTotal / PREFIXES.length;
  const trie = trieTotal / PREFIXES.length;

  return { size, buildMs, naive, trie, speedup: naive / trie };
}

function pad(s, n, right = false) {
  s = String(s);
  return right ? s.padStart(n) : s.padEnd(n);
}

console.log('');
console.log(`Search-as-you-type, mean of ${REPS} runs across ${PREFIXES.length} prefix lengths.`);
console.log('Identical ranking, boost, and paging on both paths.');
console.log('');
console.log(`${pad('items', 10)}${pad('build ms', 12, true)}${pad('naive ms', 12, true)}${pad('trie ms', 12, true)}${pad('speedup', 12, true)}`);
console.log('-'.repeat(58));

for (const size of SIZES) {
  const r = run(size);
  console.log(
    pad(r.size.toLocaleString(), 10) +
    pad(r.buildMs.toFixed(1), 12, true) +
    pad(r.naive.toFixed(3), 12, true) +
    pad(r.trie.toFixed(3), 12, true) +
    pad(`${r.speedup.toFixed(1)}x`, 12, true)
  );
}

console.log('');
console.log('Build cost is paid once at cache fill. Query cost is paid on every keystroke.');
console.log('');
