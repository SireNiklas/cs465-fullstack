const trips = require('../data/trips.json');

const travel = (req, res) => {
  res.render('travel', {
    title: 'Travel',
    nav: { travel: true },
    trips
  });
};

module.exports = { travel };
