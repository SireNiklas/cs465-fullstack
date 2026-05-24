const news = (req, res) => {
  res.render('news', {
    title: 'News',
    nav: { news: true }
  });
};

module.exports = { news };
