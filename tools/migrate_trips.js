// One time migration for the index work. Fills in nameLower on documents that
// predate the field, then syncs the collection's indexes to the schema, which
// drops the ones the planner was ignoring. Safe to run more than once.
// Run: npm run migrate:trips
require('dotenv').config();
require('../app_api/models/db');
const mongoose = require('mongoose');
const Trip = require('../app_api/models/travlr');

async function main() {
  await new Promise((resolve) => mongoose.connection.once('connected', resolve));

  const before = await Trip.collection.indexes();
  console.log('Indexes before:');
  for (const ix of before) console.log(`  ${ix.name}  ${JSON.stringify(ix.key)}`);

  const missing = await Trip.countDocuments({
    $or: [{ nameLower: { $exists: false } }, { nameLower: null }],
  });
  console.log(`\n${missing} documents need nameLower.`);

  if (missing > 0) {
    const result = await Trip.collection.updateMany(
      { $or: [{ nameLower: { $exists: false } }, { nameLower: null }] },
      [{ $set: { nameLower: { $toLower: '$name' } } }]
    );
    console.log(`Updated ${result.modifiedCount} documents.`);
  }

  const stillMissing = await Trip.countDocuments({
    $or: [{ nameLower: { $exists: false } }, { nameLower: null }],
  });
  console.log(`${stillMissing} documents still missing nameLower.`);

  console.log('\nSyncing indexes to the schema.');
  const dropped = await Trip.syncIndexes();
  if (dropped && dropped.length > 0) {
    console.log(`Dropped: ${dropped.join(', ')}`);
  } else {
    console.log('Nothing needed dropping.');
  }

  const after = await Trip.collection.indexes();
  console.log('\nIndexes after:');
  for (const ix of after) console.log(`  ${ix.name}  ${JSON.stringify(ix.key)}`);

  await mongoose.connection.close();
  process.exit(stillMissing === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error(err);
  try { await mongoose.connection.close(); } catch (e) { /* already closed */ }
  process.exit(1);
});
