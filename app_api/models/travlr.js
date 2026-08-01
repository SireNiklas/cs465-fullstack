const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, index: true },
  name:        { type: String, required: true },
  // lowercased copy of name. A case insensitive regex cannot produce index
  // bounds, so a search on name alone walks every key in the index. Matching a
  // case sensitive anchored pattern against this field gives real bounds and
  // still behaves case insensitively for the caller.
  nameLower:   { type: String, index: true },
  length:      { type: String, required: true },
  start:       { type: Date,   required: true },
  resort:      { type: String, required: true },
  perPerson:   { type: String, required: true },
  image:       { type: String, required: true },
  description: { type: String, required: true },
});

// Equality field, then the sort field, then the range field. The first version
// of this had start before name, and the planner refused it: once you scan a
// range of start values the results are no longer in name order, so it would
// have needed a blocking sort afterward. It walked the name index instead.
tripSchema.index({ resort: 1, start: 1 });
tripSchema.index({ name: 1, start: 1 });

const lower = (value) => (typeof value === 'string' ? value.toLowerCase() : value);

tripSchema.pre('save', function (next) {
  if (this.name) this.nameLower = lower(this.name);
  next();
});

// insertMany skips save hooks, and seeding goes through it
tripSchema.pre('insertMany', function (next, docs) {
  if (Array.isArray(docs)) {
    for (const doc of docs) {
      if (doc && doc.name) doc.nameLower = lower(doc.name);
    }
  }
  next();
});

// the repository updates through findOneAndUpdate, so keep the pair in step
tripSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {};
  if (update.name) {
    update.nameLower = lower(update.name);
    this.setUpdate(update);
  } else if (update.$set && update.$set.name) {
    update.$set.nameLower = lower(update.$set.name);
    this.setUpdate(update);
  }
  next();
});

const Trip = mongoose.model('trips', tripSchema);
module.exports = Trip;
