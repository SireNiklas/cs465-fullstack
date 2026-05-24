const meals = (req, res) => {
  res.render('meals', {
    title: 'Meals',
    nav: { meals: true }
  });
};

module.exports = { meals };
