const BaseRepository = require('./BaseRepository');
const Trip = require('../models/travlr');

// Trip data access. Methods are named the way the controller talks about trips
// (by code) so the query details stay in here.
class TripRepository extends BaseRepository {
  constructor(model = Trip) {
    super(model);
  }

  listTrips() {
    return this.findAll();
  }

  // list, not single, so the existing API response shape holds
  findByCode(code) {
    return this.findAll({ code });
  }

  // filter and options come from the whitelist, never straight off req.query
  searchTrips(filter = {}, options = {}) {
    return this.findMany(filter, options);
  }

  countMatching(filter = {}) {
    return this.model.countDocuments(filter).exec();
  }

  addTrip(data) {
    return this.create(data);
  }

  updateByCode(code, data) {
    return this.update({ code }, data);
  }

  deleteByCode(code) {
    return this.remove({ code });
  }

  // perPerson is stored as a string like "799.00", so it gets converted inside
  // the pipeline before any math happens
  statsByResort() {
    return this.aggregate([
      { $addFields: { priceValue: { $toDouble: '$perPerson' } } },
      {
        $group: {
          _id: '$resort',
          tripCount: { $sum: 1 },
          averagePerPerson: { $avg: '$priceValue' },
          lowestPerPerson: { $min: '$priceValue' },
          highestPerPerson: { $max: '$priceValue' },
          earliestStart: { $min: '$start' },
        },
      },
      {
        $project: {
          _id: 0,
          resort: '$_id',
          tripCount: 1,
          averagePerPerson: { $round: ['$averagePerPerson', 2] },
          lowestPerPerson: 1,
          highestPerPerson: 1,
          earliestStart: 1,
        },
      },
      { $sort: { tripCount: -1, resort: 1 } },
    ]);
  }
}

// singleton for the app; class exported too so tests can pass in a fake model
module.exports = new TripRepository();
module.exports.TripRepository = TripRepository;
