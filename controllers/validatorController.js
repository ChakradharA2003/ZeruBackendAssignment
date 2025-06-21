const Validator = require('../models/validator');

exports.getAllValidators = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        status: 'error',
        message: 'Page and limit must be positive integers'
      });
    }

    const skip = (page - 1) * limit;

    const totalDocuments = await Validator.countDocuments();

    const validators = await Validator.find()
      .skip(skip)
      .limit(limit)
      .select('operatorAddress totalDelegatedStakeStETH status lastUpdated slashHistory')
      .lean();

    if (!validators || validators.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No validators found'
      });
    }

    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(200).json({
      status: 'success',
      results: validators.length,
      totalDocuments,
      totalPages,
      currentPage: page,
      data: {
        validators
      }
    });
  } catch (err) {
    console.error('Error fetching validators:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};