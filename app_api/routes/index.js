const express = require('express');
const router = express.Router();
const { expressjwt: jwt } = require('express-jwt');
const auth = jwt({ secret: process.env.JWT_SECRET, algorithms: ['HS256'] });
const authController = require('../controllers/authentication');
const tripsController = require('../controllers/trips');

router
  .route('/trips')
  .get(tripsController.tripsList)
  .post(auth, tripsController.tripsAddTrip);

router
  .route('/trips/:tripCode')
  .get(tripsController.tripsFindByCode)
  .put(auth, tripsController.tripsUpdateTrip)
  .delete(auth, tripsController.tripsDeleteTrip);

router.route('/login').post(authController.login);
router.route('/register').post(authController.register);

module.exports = router;
