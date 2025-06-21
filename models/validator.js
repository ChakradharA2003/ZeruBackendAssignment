const mongoose = require('mongoose');

const validatorSchema = new mongoose.Schema({
  operatorAddress: {
    type: String,
    required: true,
    unique: true,
  },
  totalDelegatedStakeStETH: {
    type: Number, 
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  lastUpdated: {
    type: Date,
  required: true
  },
  slashHistory: [
    {
      timestamp: {
        type: Number, 
        required: true,
      },
      amountStETH: {
        type: Number,
        required: true,
      },
      reason: {
        type: String, 
        default: null,
      },
    },
  ],
});

module.exports = mongoose.model('Validator', validatorSchema);
