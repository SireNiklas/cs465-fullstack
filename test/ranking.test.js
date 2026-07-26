const test = require('node:test');
const assert = require('node:assert');

const { Trie } = require('../app_api/algorithms/trie');
const { serverFactors } = require('../app_api/algorithms/factors');
const { EPSILON, buildBaseScores, compareScored, applyFavoriteBoost } = require('../app_api/algorithms/rank');
const { createEngine } = require('../app_api/algorithms');

const fixture = [
  { id: 'a', name: 'Alpha Base',   playerCount: 20, maxPlayers: 40, ping: 30,  uptime: 0.99 },
  { id: 'b', name: 'Alpine Ridge', playerCount: 10, maxPlayers: 40, ping: 80,  uptime: 0.90 },
  { id: 'c', name: 'Bravo Camp',   playerCount: 38, maxPlayers: 40, ping: 20,  uptime: 0.95 },
  { id: 'd', name: 'Alpha Base',   playerCount: 5,  maxPlayers: 40, ping: 200, uptime: 0.50 },
];

// ---------------------------------------------------------------- trie

test('trie finds a single exact name', () => {
  const t = new Trie();
  t.insert('Bravo Camp', 'c');
  assert.deepStrictEqual(t.search('Bravo Camp'), ['c']);
});

test('trie returns every id sharing a prefix', () => {
  const t = new Trie();
  for (const i of fixture) t.insert(i.name, i.id);
  assert.deepStrictEqual(t.search('Alp').sort(), ['a', 'b', 'd']);
});

test('trie search is case insensitive both ways', () => {
  const t = new Trie();
  t.insert('Bravo Camp', 'c');
  assert.deepStrictEqual(t.search('bRaVo'), ['c']);
});

test('trie keeps both ids when two items share a name', () => {
  const t = new Trie();
  for (const i of fixture) t.insert(i.name, i.id);
  assert.deepStrictEqual(t.search('Alpha Base').sort(), ['a', 'd']);
});

test('trie returns everything for an empty prefix', () => {
  const t = new Trie();
  for (const i of fixture) t.insert(i.name, i.id);
  assert.strictEqual(t.search('').length, 4);
});

test('trie returns nothing for a prefix that matches nothing', () => {
  const t = new Trie();
  for (const i of fixture) t.insert(i.name, i.id);
  assert.deepStrictEqual(t.search('Zulu'), []);
});

// ---------------------------------------------------------------- factors

test('every factor returns a number between 0 and 1', () => {
  for (const f of serverFactors) {
    for (const item of fixture) {
      const s = f.score(item);
      assert.ok(Number.isFinite(s), `${f.key} returned ${s}`);
      assert.ok(s >= 0 && s <= 1, `${f.key} returned ${s}, outside [0,1]`);
    }
  }
});

test('factors survive missing fields without throwing or going NaN', () => {
  const empty = { id: 'x', name: 'Empty' };
  for (const f of serverFactors) {
    const s = f.score(empty);
    assert.ok(Number.isFinite(s), `${f.key} returned ${s} on an item with no fields`);
  }
});

test('a zero denominator does not produce NaN or Infinity', () => {
  const zero = { id: 'z', name: 'Zero', playerCount: 5, maxPlayers: 0, ping: 0, uptime: 0 };
  for (const f of serverFactors) {
    assert.ok(Number.isFinite(f.score(zero)), `${f.key} blew up on a zero denominator`);
  }
});

// ---------------------------------------------------------------- base scores

test('base scores cover every item and are all finite', () => {
  const base = buildBaseScores(fixture, serverFactors);
  assert.strictEqual(base.size, fixture.length);
  for (const i of fixture) assert.ok(Number.isFinite(base.get(i.id)));
});

test('the busier, closer, more stable server outscores the worst one', () => {
  const base = buildBaseScores(fixture, serverFactors);
  assert.ok(base.get('c') > base.get('d'));
});

// ---------------------------------------------------------------- comparator

test('higher score sorts first', () => {
  const out = [{ name: 'x', score: 0.1 }, { name: 'y', score: 0.9 }].sort(compareScored);
  assert.strictEqual(out[0].name, 'y');
});

test('scores inside epsilon count as tied and fall back to name ascending', () => {
  const out = [
    { name: 'Zeta',  score: 0.5 },
    { name: 'Alpha', score: 0.5 + EPSILON / 10 },
  ].sort(compareScored);
  assert.strictEqual(out[0].name, 'Alpha');
});

test('scores further apart than epsilon are not treated as tied', () => {
  const out = [
    { name: 'Alpha', score: 0.5 },
    { name: 'Zeta',  score: 0.5 + 0.001 },
  ].sort(compareScored);
  assert.strictEqual(out[0].name, 'Zeta');
});

test('ranking the same set twice gives the identical order', () => {
  const base = buildBaseScores(fixture, serverFactors);
  const ids = fixture.map((i) => i.id);
  const byId = new Map(fixture.map((i) => [i.id, i]));
  const once = applyFavoriteBoost(ids, byId, base, new Set(), 0).sort(compareScored).map((r) => r.id);
  const twice = applyFavoriteBoost([...ids].reverse(), byId, base, new Set(), 0).sort(compareScored).map((r) => r.id);
  assert.deepStrictEqual(once, twice);
});

// ---------------------------------------------------------------- favorite boost

test('a favorited item gains exactly the boost amount', () => {
  const base = buildBaseScores(fixture, serverFactors);
  const byId = new Map(fixture.map((i) => [i.id, i]));
  const boosted = applyFavoriteBoost(['b'], byId, base, new Set(['b']), 0.25);
  assert.ok(Math.abs(boosted[0].score - (base.get('b') + 0.25)) < EPSILON);
});

test('an item nobody favorited keeps its base score', () => {
  const base = buildBaseScores(fixture, serverFactors);
  const byId = new Map(fixture.map((i) => [i.id, i]));
  const plain = applyFavoriteBoost(['b'], byId, base, new Set(['a']), 0.25);
  assert.ok(Math.abs(plain[0].score - base.get('b')) < EPSILON);
});

test('the boost never mutates the shared base scores', () => {
  const base = buildBaseScores(fixture, serverFactors);
  const byId = new Map(fixture.map((i) => [i.id, i]));
  const before = base.get('b');
  applyFavoriteBoost(['b'], byId, base, new Set(['b']), 0.5);
  assert.strictEqual(base.get('b'), before, 'base score changed, the cache is now poisoned');
});

test('two users searching the same thing get different orders', () => {
  const engine = createEngine({ items: fixture });
  const userOne = engine.query({ prefix: 'Alp', favoriteIds: new Set(['b']), boost: 1 });
  const userTwo = engine.query({ prefix: 'Alp', favoriteIds: new Set(),      boost: 1 });
  assert.strictEqual(userOne.results[0].id, 'b');
  assert.notStrictEqual(userTwo.results[0].id, 'b');
});

// ---------------------------------------------------------------- engine

test('paging reports the full match count and returns one page', () => {
  const engine = createEngine({ items: fixture });
  const page = engine.query({ prefix: 'Alp', page: 1, pageSize: 2 });
  assert.strictEqual(page.total, 3);
  assert.strictEqual(page.results.length, 2);
});

test('page two picks up where page one stopped', () => {
  const engine = createEngine({ items: fixture });
  const all = engine.query({ prefix: 'Alp', page: 1, pageSize: 3 }).results.map((r) => r.id);
  const second = engine.query({ prefix: 'Alp', page: 2, pageSize: 2 }).results.map((r) => r.id);
  assert.deepStrictEqual(second, all.slice(2));
});
