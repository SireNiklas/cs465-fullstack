const index = (req, res) => {
  res.render('index', {
    title: 'GameBrowse',
    nav: { home: true }
  });
};

module.exports = { index };
