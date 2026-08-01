const BaseRepository = require('./BaseRepository');
const Favorite = require('../models/favorite');

// Every method takes the owner id and folds it into the filter before the query
// is built. There is no method here that can read or delete a row without one,
// so an owner check cannot be forgotten at the controller.
class FavoriteRepository extends BaseRepository {
  constructor(model = Favorite) {
    super(model);
  }

  static requireOwner(ownerId) {
    if (!ownerId) throw new Error('FavoriteRepository needs an owner id.');
    return ownerId;
  }

  listForOwner(ownerId) {
    const user = FavoriteRepository.requireOwner(ownerId);
    return this.findAll({ user });
  }

  findForOwner(ownerId, tripCode) {
    const user = FavoriteRepository.requireOwner(ownerId);
    return this.findOne({ user, tripCode });
  }

  addForOwner(ownerId, tripCode) {
    const user = FavoriteRepository.requireOwner(ownerId);
    return this.create({ user, tripCode });
  }

  removeForOwner(ownerId, tripCode) {
    const user = FavoriteRepository.requireOwner(ownerId);
    return this.remove({ user, tripCode });
  }

  countForOwner(ownerId) {
    const user = FavoriteRepository.requireOwner(ownerId);
    return this.findAll({ user }).then((rows) => rows.length);
  }
}

module.exports = new FavoriteRepository();
module.exports.FavoriteRepository = FavoriteRepository;
