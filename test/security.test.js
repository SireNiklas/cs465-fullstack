// Enhancement three checks. Nothing here opens a database connection. The
// whitelist and the role gate are plain functions, the repository runs against
// a fake model, and the password helpers only need crypto. Run: npm run test:security
const test = require('node:test');
const assert = require('node:assert');

const { buildTripQuery, MAX_LIMIT, DEFAULT_LIMIT } = require('../app_api/query/tripQuery');
const { requireAuth, requireRole } = require('../app_api/middleware/authorize');
const { FavoriteRepository } = require('../app_api/repositories/FavoriteRepository');
const {
  CURRENT_ITERATIONS,
  LEGACY_ITERATIONS,
  makeSalt,
  hashPassword,
  verifyPassword,
  needsRehash,
} = require('../app_api/security/password');

// ---------- query whitelist ----------

test('an empty query produces an empty filter and the default limit', () => {
  const { filter, options, errors } = buildTripQuery({});
  assert.deepStrictEqual(filter, {});
  assert.strictEqual(options.limit, DEFAULT_LIMIT);
  assert.strictEqual(errors.length, 0);
});

test('code is passed through as an equality match', () => {
  const { filter, errors } = buildTripQuery({ code: 'GALR210214' });
  assert.deepStrictEqual(filter, { code: 'GALR210214' });
  assert.strictEqual(errors.length, 0);
});

test('an unknown parameter is rejected and never reaches the filter', () => {
  const { filter, errors } = buildTripQuery({ description: 'anything' });
  assert.deepStrictEqual(filter, {});
  assert.ok(errors.some((e) => e.includes('unknown query parameter')));
});

test('an object valued parameter is rejected, which blocks operator injection', () => {
  const { filter, errors } = buildTripQuery({ code: { $ne: '' } });
  assert.deepStrictEqual(filter, {});
  assert.ok(errors.some((e) => e.includes('single string value')));
});

test('an array valued parameter is rejected', () => {
  const { filter, errors } = buildTripQuery({ resort: ['a', 'b'] });
  assert.deepStrictEqual(filter, {});
  assert.strictEqual(errors.length, 1);
});

test('a nested operator on a date field is rejected', () => {
  const { filter, errors } = buildTripQuery({ startAfter: { $gt: '2020-01-01' } });
  assert.deepStrictEqual(filter, {});
  assert.strictEqual(errors.length, 1);
});

test('name becomes an anchored prefix match on the lowercased field', () => {
  const { filter } = buildTripQuery({ name: 'Reef' });
  assert.ok(filter.nameLower instanceof RegExp);
  assert.strictEqual(filter.name, undefined);
  assert.strictEqual(filter.nameLower.source, '^reef');
  assert.ok(filter.nameLower.test('reef & beef'));
  assert.ok(!filter.nameLower.test('grand reef'));
});

test('the prefix regex carries no ignore case flag, which is what keeps the bounds tight', () => {
  const { filter } = buildTripQuery({ name: 'Reef' });
  assert.strictEqual(filter.nameLower.flags, '');
});

test('mixed case input still matches, because the input is lowercased not the pattern', () => {
  const shouty = buildTripQuery({ name: 'REEF' }).filter.nameLower;
  const mixed = buildTripQuery({ name: 'ReEf' }).filter.nameLower;
  assert.strictEqual(shouty.source, '^reef');
  assert.strictEqual(mixed.source, '^reef');
  assert.ok(shouty.test('reef & beef'));
});

test('regex metacharacters in name are escaped instead of interpreted', () => {
  const { filter } = buildTripQuery({ name: '(a+)+$' });
  assert.strictEqual(filter.nameLower.source, '^\\(a\\+\\)\\+\\$');
  assert.ok(!filter.nameLower.test('aaaaaaaaaaaaaaaa'));
});

test('a sort field outside the allowed set is rejected', () => {
  const { options, errors } = buildTripQuery({ sort: 'description' });
  assert.strictEqual(options.sort, undefined);
  assert.ok(errors.some((e) => e.includes('sort field not allowed')));
});

test('a leading minus on an allowed sort field means descending', () => {
  const { options, errors } = buildTripQuery({ sort: '-start' });
  assert.deepStrictEqual(options.sort, { start: -1 });
  assert.strictEqual(errors.length, 0);
});

test('limit is clamped to the maximum', () => {
  const { options } = buildTripQuery({ limit: '5000' });
  assert.strictEqual(options.limit, MAX_LIMIT);
});

test('a non numeric limit is rejected', () => {
  const { options, errors } = buildTripQuery({ limit: 'all' });
  assert.strictEqual(options.limit, DEFAULT_LIMIT);
  assert.strictEqual(errors.length, 1);
});

test('page turns into a skip based on the limit', () => {
  const { options } = buildTripQuery({ page: '3', limit: '10' });
  assert.strictEqual(options.skip, 20);
  assert.strictEqual(options.limit, 10);
});

test('startAfter and startBefore combine into one range on start', () => {
  const { filter, errors } = buildTripQuery({
    startAfter: '2026-01-01',
    startBefore: '2026-12-31',
  });
  assert.strictEqual(errors.length, 0);
  assert.ok(filter.start.$gte instanceof Date);
  assert.ok(filter.start.$lte instanceof Date);
});

test('an unparseable date is rejected', () => {
  const { filter, errors } = buildTripQuery({ startAfter: 'next tuesday-ish' });
  assert.deepStrictEqual(filter, {});
  assert.ok(errors.some((e) => e.includes('not a valid date')));
});

// ---------- role gate ----------

function makeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test('requireAuth answers 401 when there is no decoded token', () => {
  const res = makeRes();
  let nextCalled = false;
  requireAuth({}, res, () => { nextCalled = true; });
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(nextCalled, false);
});

test('requireAuth continues when the token carries an id', () => {
  const res = makeRes();
  let nextCalled = false;
  requireAuth({ auth: { _id: 'u1' } }, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(res.statusCode, null);
});

test('requireRole answers 401 when no token is present', () => {
  const res = makeRes();
  requireRole('admin')({}, res, () => {});
  assert.strictEqual(res.statusCode, 401);
});

test('requireRole answers 403 for a valid token with the wrong role', () => {
  const res = makeRes();
  let nextCalled = false;
  requireRole('admin')({ auth: { _id: 'u1', role: 'user' } }, res, () => { nextCalled = true; });
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(nextCalled, false);
});

test('a token with no role at all is treated as the lowest role', () => {
  const res = makeRes();
  requireRole('admin')({ auth: { _id: 'u1' } }, res, () => {});
  assert.strictEqual(res.statusCode, 403);
});

test('requireRole continues for the allowed role', () => {
  const res = makeRes();
  let nextCalled = false;
  requireRole('admin')({ auth: { _id: 'u1', role: 'admin' } }, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(res.statusCode, null);
});

// ---------- owner scoped favorites ----------

function makeFakeModel() {
  const calls = [];
  const thenable = (value) => ({ exec: () => Promise.resolve(value) });
  return {
    calls,
    find(filter) { calls.push(['find', filter]); return thenable([]); },
    findOne(filter) { calls.push(['findOne', filter]); return thenable(null); },
    create(data) { calls.push(['create', data]); return Promise.resolve({ _id: 'f1', ...data }); },
    findOneAndDelete(filter) { calls.push(['findOneAndDelete', filter]); return thenable({ ...filter }); },
  };
}

test('listing favorites always filters by the owner', async () => {
  const model = makeFakeModel();
  const repo = new FavoriteRepository(model);
  await repo.listForOwner('user-a');
  assert.deepStrictEqual(model.calls[0], ['find', { user: 'user-a' }]);
});

test('deleting a favorite carries the owner into the filter', async () => {
  const model = makeFakeModel();
  const repo = new FavoriteRepository(model);
  await repo.removeForOwner('user-a', 'GALR210214');
  assert.deepStrictEqual(model.calls[0], [
    'findOneAndDelete',
    { user: 'user-a', tripCode: 'GALR210214' },
  ]);
});

test('adding a favorite stores the owner alongside the trip code', async () => {
  const model = makeFakeModel();
  const repo = new FavoriteRepository(model);
  await repo.addForOwner('user-b', 'MTNX180314');
  assert.deepStrictEqual(model.calls[0], [
    'create',
    { user: 'user-b', tripCode: 'MTNX180314' },
  ]);
});

test('a missing owner id throws before any query is built', async () => {
  const model = makeFakeModel();
  const repo = new FavoriteRepository(model);
  assert.throws(() => repo.listForOwner(undefined), /owner id/);
  assert.throws(() => repo.removeForOwner(null, 'ANY'), /owner id/);
  assert.strictEqual(model.calls.length, 0);
});

// ---------- password hashing and migration ----------

test('a password verifies against the hash it produced', () => {
  const salt = makeSalt();
  const hash = hashPassword('correct horse battery', salt, 2000);
  assert.strictEqual(verifyPassword('correct horse battery', salt, 2000, hash), true);
});

test('a wrong password does not verify', () => {
  const salt = makeSalt();
  const hash = hashPassword('correct horse battery', salt, 2000);
  assert.strictEqual(verifyPassword('wrong horse battery', salt, 2000, hash), false);
});

test('a hash written by the original code still verifies when no count is stored', () => {
  const salt = makeSalt();
  const legacyHash = hashPassword('old-account', salt, LEGACY_ITERATIONS);
  assert.strictEqual(verifyPassword('old-account', salt, undefined, legacyHash), true);
});

test('a record written at the old count is flagged for rehashing and a new one is not', () => {
  assert.strictEqual(needsRehash(undefined), true);
  assert.strictEqual(needsRehash(LEGACY_ITERATIONS), true);
  assert.strictEqual(needsRehash(CURRENT_ITERATIONS), false);
});

test('verification fails safely when the salt or hash is missing', () => {
  assert.strictEqual(verifyPassword('anything', null, 2000, 'abcd'), false);
  assert.strictEqual(verifyPassword('anything', 'somesalt', 2000, null), false);
});

test('the current iteration count is well above the original setting', () => {
  assert.ok(CURRENT_ITERATIONS >= 210000);
  assert.strictEqual(LEGACY_ITERATIONS, 1000);
});
