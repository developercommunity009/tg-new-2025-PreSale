const mongoose = require('mongoose');

const chartDataSchema = new mongoose.Schema({
  coin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coin',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  totalSupply: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Number, // Unix timestamp in seconds
    required: true
  }
});

const ChartData = mongoose.model('ChartData', chartDataSchema);
module.exports = ChartData;
