// Runs the repository against a fake model, no database. Each test checks the
// repo calls the model the right way and hands back what we expect. Works
// because nothing here talks to Mongoose directly. Run: npm test
const test = require('node:test');
const assert = require('node:assert');
const { TripRepository } = require('./TripRepository');

// fake model: records what it was called with, returns canned data
function makeFakeModel() {
  const calls = [];
  const thenable = (value) => ({ exec: () => Promise.resolve(value) });
  return {
    calls,
    find(filter) {
      calls.push(['find', filter]);
      // echo the filter back so a test can see what was queried
      return thenable([{ code: filter.code ?? 'ALL', name: 'stub' }]);
    },
    create(data) {
      calls.push(['create', data]);
      return Promise.resolve({ _id: 'new', ...data });
    },
    findOneAndUpdate(filter, data, opts) {
      calls.push(['findOneAndUpdate', filter, data, opts]);
      return thenable({ ...filter, ...data });
    },
    findOneAndDelete(filter) {
      calls.push(['findOneAndDelete', filter]);
      return thenable({ ...filter, deleted: true });
    },
  };
}

test('listTrips asks the model for all documents', async () => {
  const model = makeFakeModel();
  const repo = new TripRepository(model);
  const result = await repo.listTrips();
  assert.deepStrictEqual(model.calls[0], ['find', {}]);
  assert.strictEqual(result.length, 1);
});

test('findByCode filters by trip code', async () => {
  const model = makeFakeModel();
  const repo = new TripRepository(model);
  const result = await repo.findByCode('GALR210214');
  assert.deepStrictEqual(model.calls[0], ['find', { code: 'GALR210214' }]);
  assert.strictEqual(result[0].code, 'GALR210214');
});

test('addTrip creates a document from the given data', async () => {
  const model = makeFakeModel();
  const repo = new TripRepository(model);
  const created = await repo.addTrip({ code: 'NEW1', name: 'Reef Dive' });
  assert.deepStrictEqual(model.calls[0], ['create', { code: 'NEW1', name: 'Reef Dive' }]);
  assert.strictEqual(created.name, 'Reef Dive');
});

test('updateByCode updates the matching document and returns the new version', async () => {
  const model = makeFakeModel();
  const repo = new TripRepository(model);
  const updated = await repo.updateByCode('NEW1', { name: 'Wreck Dive' });
  assert.strictEqual(model.calls[0][0], 'findOneAndUpdate');
  assert.deepStrictEqual(model.calls[0][1], { code: 'NEW1' });
  assert.deepStrictEqual(model.calls[0][3], { new: true });
  assert.strictEqual(updated.name, 'Wreck Dive');
});

test('deleteByCode removes the matching document', async () => {
  const model = makeFakeModel();
  const repo = new TripRepository(model);
  const removed = await repo.deleteByCode('NEW1');
  assert.deepStrictEqual(model.calls[0], ['findOneAndDelete', { code: 'NEW1' }]);
  assert.strictEqual(removed.deleted, true);
});

test('constructor rejects a missing model', () => {
  assert.throws(() => new TripRepository(null), /needs a Mongoose model/);
});
