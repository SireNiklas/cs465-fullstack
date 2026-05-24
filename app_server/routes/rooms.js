const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/rooms');

router.get('/', ctrl.rooms);

module.exports = router;
