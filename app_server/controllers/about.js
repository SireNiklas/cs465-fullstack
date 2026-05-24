const about = (req, res) => {
  res.render('about', {
    title: 'About',
    nav: { about: true }
  });
};

module.exports = { about };
