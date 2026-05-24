const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/news');

router.get('/', ctrl.news);

module.exports = router;
