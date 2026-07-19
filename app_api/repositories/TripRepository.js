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

  addTrip(data) {
    return this.create(data);
  }

  updateByCode(code, data) {
    return this.update({ code }, data);
  }

  deleteByCode(code) {
    return this.remove({ code });
  }
}

// singleton for the app; class exported too so tests can pass in a fake model
module.exports = new TripRepository();
module.exports.TripRepository = TripRepository;
