const contact = (req, res) => {
  res.render('contact', {
    title: 'Contact',
    nav: { contact: true }
  });
};

module.exports = { contact };
