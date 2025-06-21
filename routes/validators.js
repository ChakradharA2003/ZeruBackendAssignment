const express = require('express');
const router = express.Router();
const {getAllValidators} = require('../controllers/validatorController');

router.get('/', getAllValidators);

module.exports = router;