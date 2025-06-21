const express = require('express');
const router = express.Router();
const restakerRoutes = require('./restakers');
const validatorRoutes = require('./validators');

// Mount restaker routes
router.use('/restakers', restakerRoutes);

// Mount validator routes
router.use('/validators', validatorRoutes);

module.exports = router;