const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

require('./models/db');                  // opens the connection
const Trip = require('./models/travlr');  // the model

const dataPath = path.join(__dirname, 'data', 'trips.json');
const trips = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const seedDB = async () => {
  await Trip.deleteMany({});             // clear old data
  await Trip.insertMany(trips);          // load fresh data
  console.log(`Seeded ${trips.length} trips`);
};

seedDB()
  .then(async () => { await mongoose.connection.close(); process.exit(0); })
  .catch(async (err) => { console.error(err); await mongoose.connection.close(); process.exit(1); });
