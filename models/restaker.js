const mongoose = require('mongoose');

const restakerSchema = new mongoose.Schema({
  userAddress: {
    type: String,
    required: true,
    unique: true,
  },
  amountRestakedStETH: {
    type: Number, 
    required: true,
  },
  targetAVSOperatorAddress: {
    type: String,
    required: true,
  },
  lastUpdated: {
  type: Date,
  required: true
}
});

module.exports = mongoose.model('Restaker', restakerSchema);
