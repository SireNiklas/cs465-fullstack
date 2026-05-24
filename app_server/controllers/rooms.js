const rooms = (req, res) => {
  res.render('rooms', {
    title: 'Rooms',
    nav: { rooms: true }
  });
};

module.exports = { rooms };
