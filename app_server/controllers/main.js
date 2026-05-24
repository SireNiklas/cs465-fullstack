const index = (req, res) => {
  res.render('index', {
    title: 'Travlr Getaways',
    nav: { home: true }
  });
};

module.exports = { index };
