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

  // findAll with sort, skip, and limit applied by the caller. Split out so the
  // plain listing path stays unchanged.
  findMany(filter = {}, options = {}) {
    let query = this.model.find(filter);
    if (options.sort) query = query.sort(options.sort);
    if (options.skip) query = query.skip(options.skip);
    if (options.limit) query = query.limit(options.limit);
    return query.exec();
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

  aggregate(pipeline) {
    return this.model.aggregate(pipeline).exec();
  }
}

module.exports = BaseRepository;
