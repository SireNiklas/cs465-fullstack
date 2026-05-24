const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/meals');

router.get('/', ctrl.meals);

module.exports = router;
