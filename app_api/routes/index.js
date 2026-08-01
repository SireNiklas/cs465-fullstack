const express = require('express');
const router = express.Router();
const { expressjwt: jwt } = require('express-jwt');
const auth = jwt({ secret: process.env.JWT_SECRET, algorithms: ['HS256'] });
const { requireAuth, requireRole } = require('../middleware/authorize');
const authController = require('../controllers/authentication');
const tripsController = require('../controllers/trips');
const favoritesController = require('../controllers/favorites');

// static segments first so /trips/stats is not swallowed by /trips/:tripCode
router.route('/trips/stats').get(auth, requireAuth, tripsController.tripsStats);

router
  .route('/trips')
  .get(tripsController.tripsList)
  .post(auth, requireRole('admin'), tripsController.tripsAddTrip);

router
  .route('/trips/:tripCode')
  .get(tripsController.tripsFindByCode)
  .put(auth, requireRole('admin'), tripsController.tripsUpdateTrip)
  .delete(auth, requireRole('admin'), tripsController.tripsDeleteTrip);

router
  .route('/favorites')
  .get(auth, requireAuth, favoritesController.favoritesList)
  .post(auth, requireAuth, favoritesController.favoritesAdd);

router
  .route('/favorites/:tripCode')
  .delete(auth, requireAuth, favoritesController.favoritesRemove);

router.route('/login').post(authController.login);
router.route('/register').post(authController.register);

module.exports = router;
