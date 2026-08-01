const favoriteRepository = require('../repositories/FavoriteRepository');

// The owner id is read off the verified token, never off the body or the URL.
// A caller cannot ask for someone else's favorites because there is no place to
// put someone else's id.
const ownerIdFrom = (req) => req.auth && req.auth._id;

const favoritesList = async (req, res) => {
  try {
    const favorites = await favoriteRepository.listForOwner(ownerIdFrom(req));
    return res.status(200).json(favorites);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const favoritesAdd = async (req, res) => {
  const tripCode = req.body.tripCode;
  if (!tripCode || typeof tripCode !== 'string') {
    return res.status(400).json({ message: 'tripCode is required.' });
  }
  try {
    const favorite = await favoriteRepository.addForOwner(ownerIdFrom(req), tripCode);
    return res.status(201).json(favorite);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Already favorited.' });
    }
    return res.status(400).json({ message: err.message });
  }
};

const favoritesRemove = async (req, res) => {
  try {
    const removed = await favoriteRepository.removeForOwner(
      ownerIdFrom(req),
      req.params.tripCode
    );
    if (!removed) {
      return res.status(404).json({ message: 'Favorite not found.' });
    }
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { favoritesList, favoritesAdd, favoritesRemove };
