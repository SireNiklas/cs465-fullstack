const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/about');

router.get('/', ctrl.about);

module.exports = router;
