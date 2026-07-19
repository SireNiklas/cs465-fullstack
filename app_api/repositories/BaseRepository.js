// Generic data access over a Mongoose model. Keeps the db calls in one spot so
// controllers never import a model directly. Extend it per collection.
class BaseRepository {
  constructor(model) {
    if (!model) throw new Error('BaseRepository needs a Mongoose model.');
    this.model = model;
  }

  findAll(filter = {}) {
    return this.model.find(filter).exec();
  }

  findOne(filter) {
    return this.model.findOne(filter).exec();
  }

  create(data) {
    return this.model.create(data);
  }

  update(filter, data) {
    return this.model.findOneAndUpdate(filter, data, { new: true }).exec();
  }

  remove(filter) {
    return this.model.findOneAndDelete(filter).exec();
  }
}

module.exports = BaseRepository;
