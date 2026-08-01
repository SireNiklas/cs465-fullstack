const mongoose = require('mongoose');

// A favorite belongs to exactly one user. Nothing here is readable without
// knowing whose it is, which is the point.
const favoriteSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripCode: { type: String, required: true },
  addedAt:  { type: Date, default: Date.now },
});

// one row per user per trip, and it doubles as the lookup index for
// "everything this user favorited"
favoriteSchema.index({ user: 1, tripCode: 1 }, { unique: true });
// supports listing a user's favorites newest first without a sort stage
favoriteSchema.index({ user: 1, addedAt: -1 });

const Favorite = mongoose.model('favorites', favoriteSchema);
module.exports = Favorite;
