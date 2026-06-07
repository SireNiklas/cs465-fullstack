const Trip = require('../models/travlr');

// GET: /trips - return all trips
const tripsList = async (req, res) => {
  const trips = await Trip.find({}).exec();
  if (!trips || trips.length === 0) {
    return res.status(404).json({ message: 'No trips found' });
  }
  return res.status(200).json(trips);
};

// GET: /trips/:tripCode - return a single trip matched by code
const tripsFindByCode = async (req, res) => {
  const trips = await Trip.find({ code: req.params.tripCode }).exec();
  if (!trips || trips.length === 0) {
    return res.status(404).json({ message: 'Trip not found' });
  }
  return res.status(200).json(trips);
};

module.exports = {
  tripsList,
  tripsFindByCode,
};
