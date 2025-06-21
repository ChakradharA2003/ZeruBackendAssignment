const express = require('express');
const router = express.Router();
const {getAllRestakers} = require('../controllers/restakeController');

router.get('/', getAllRestakers);

module.exports = router;