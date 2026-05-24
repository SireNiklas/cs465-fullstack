const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/contact');

router.get('/', ctrl.contact);

module.exports = router;
