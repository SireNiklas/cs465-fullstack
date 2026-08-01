const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, index: true },
  name:        { type: String, required: true, index: true },
  length:      { type: String, required: true },
  start:       { type: Date,   required: true },
  resort:      { type: String, required: true },
  perPerson:   { type: String, required: true },
  image:       { type: String, required: true },
  description: { type: String, required: true },
});

// Compound indexes matching the filter and sort the browse screen actually
// sends. Prefix order matters: equality field first, then the range or sort
// field, so the index can serve both stages.
tripSchema.index({ resort: 1, start: 1 });
tripSchema.index({ start: 1, name: 1 });

const Trip = mongoose.model('trips', tripSchema);
module.exports = Trip;
