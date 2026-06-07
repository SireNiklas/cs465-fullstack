const Trip = require('../../app_api/models/travlr');

const travel = async (req, res) => {
  const trips = await Trip.find({}).exec();
  res.render('travel', {
    title: 'Travel',
    nav: { travel: true },
    trips
  });
};

module.exports = { travel };
