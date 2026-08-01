// HTTP only. Anything touching the db goes through TripRepository.
const tripRepository = require('../repositories/TripRepository');
const { buildTripQuery } = require('../query/tripQuery');

const tripsList = async (req, res) => {
  const { filter, options, errors } = buildTripQuery(req.query);
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Invalid query.', errors });
  }
  try {
    const trips = await tripRepository.searchTrips(filter, options);
    if (!trips || trips.length === 0) {
      return res.status(404).json({ message: 'No trips found' });
    }
    return res.status(200).json(trips);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const tripsFindByCode = async (req, res) => {
  try {
    const trips = await tripRepository.findByCode(req.params.tripCode);
    if (!trips || trips.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    return res.status(200).json(trips);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const tripsStats = async (req, res) => {
  try {
    const stats = await tripRepository.statsByResort();
    return res.status(200).json(stats);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const tripsAddTrip = async (req, res) => {
  try {
    const trip = await tripRepository.addTrip({
      code:        req.body.code,
      name:        req.body.name,
      length:      req.body.length,
      start:       req.body.start,
      resort:      req.body.resort,
      perPerson:   req.body.perPerson,
      image:       req.body.image,
      description: req.body.description,
    });
    return res.status(201).json(trip);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

const tripsUpdateTrip = async (req, res) => {
  try {
    const trip = await tripRepository.updateByCode(req.params.tripCode, {
      code:        req.body.code,
      name:        req.body.name,
      length:      req.body.length,
      start:       req.body.start,
      resort:      req.body.resort,
      perPerson:   req.body.perPerson,
      image:       req.body.image,
      description: req.body.description,
    });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    return res.status(200).json(trip);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const tripsDeleteTrip = async (req, res) => {
  try {
    const trip = await tripRepository.deleteByCode(req.params.tripCode);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  tripsList,
  tripsFindByCode,
  tripsStats,
  tripsAddTrip,
  tripsUpdateTrip,
  tripsDeleteTrip,
};
