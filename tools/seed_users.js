// Creates the accounts needed to demo authorization and the password migration.
// The legacy account is written straight through the collection at the old
// iteration count so logging in as that user shows the upgrade happening.
// Run: npm run seed:users
require('dotenv').config();
require('../app_api/models/db');
const mongoose = require('mongoose');
const { makeSalt, hashPassword, LEGACY_ITERATIONS } = require('../app_api/security/password');

const ACCOUNTS = [
  { name: 'Site Admin', email: 'admin@gamebrowse.test', password: 'admin-pass-1234', role: 'admin' },
  { name: 'Regular Player', email: 'player@gamebrowse.test', password: 'player-pass-1234', role: 'user' },
];

async function main() {
  await new Promise((resolve) => mongoose.connection.once('connected', resolve));
  const User = mongoose.model('User');

  await User.deleteMany({ email: { $in: [...ACCOUNTS.map((a) => a.email), 'legacy@gamebrowse.test'] } });

  for (const account of ACCOUNTS) {
    const user = new User({ name: account.name, email: account.email, role: account.role });
    user.setPassword(account.password);
    await user.save();
    console.log(`created ${account.email} as ${account.role} at ${user.iterations} iterations`);
  }

  const salt = makeSalt();
  await User.collection.insertOne({
    name: 'Legacy Account',
    email: 'legacy@gamebrowse.test',
    salt,
    hash: hashPassword('legacy-pass-1234', salt, LEGACY_ITERATIONS),
    iterations: LEGACY_ITERATIONS,
    role: 'user',
  });
  console.log(`created legacy@gamebrowse.test at ${LEGACY_ITERATIONS} iterations (log in once to upgrade it)`);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.connection.close();
  process.exit(1);
});
