const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
  },
  totalRewardsReceivedStETH: {
    type: Number,
    required: true,
  },
  lastUpdated: {
    type: Number,
    required: true,
  },
  rewardsBreakdown: [
    {
      operatorAddress: {
        type: String,
        required: true,
      },
      amountStETH: {
        type: Number,
        required: true,
      },
      timestamp: {
        type: Number, 
        required: false,
      },
    },
  ],
});

module.exports = mongoose.model('Reward', rewardSchema);
