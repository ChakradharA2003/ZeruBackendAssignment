const Restaker = require('../models/restaker');

exports.getAllRestakers = async (req, res) => {
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

    const totalDocuments = await Restaker.countDocuments();

    const restakers = await Restaker.find()
      .skip(skip)
      .limit(limit)
      .select('userAddress amountRestakedStETH targetAVSOperatorAddress lastUpdated')
      .lean(); 

    if (!restakers || restakers.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No restakers found'
      });
    }

    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(200).json({
      status: 'success',
      results: restakers.length,
      totalDocuments,
      totalPages,
      currentPage: page,
      data: {
        restakers
      }
    });
  } catch (err) {
    console.error('Error fetching restakers:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};