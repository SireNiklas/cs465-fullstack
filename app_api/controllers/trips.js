const Trip = require('../models/travlr');

const tripsList = async (req, res) => {
  try {
    const trips = await Trip.find({}).exec();
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
    const trips = await Trip.find({ code: req.params.tripCode }).exec();
    if (!trips || trips.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    return res.status(200).json(trips);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const tripsAddTrip = async (req, res) => {
  try {
    const trip = await Trip.create({
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
    const trip = await Trip.findOneAndUpdate(
      { code: req.params.tripCode },
      {
        code:        req.body.code,
        name:        req.body.name,
        length:      req.body.length,
        start:       req.body.start,
        resort:      req.body.resort,
        perPerson:   req.body.perPerson,
        image:       req.body.image,
        description: req.body.description,
      },
      { new: true }
    ).exec();
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
    const trip = await Trip.findOneAndDelete({ code: req.params.tripCode }).exec();
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
  tripsAddTrip,
  tripsUpdateTrip,
  tripsDeleteTrip,
};
