const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Coin Schema with timestamps
const CoinSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    ticker: {
        type: String,
        required: true,
        trim: true,
        unique: true // Ensure ticker symbols are unique
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    chain: {
        type: String,
        required: true
    },
    telegramLink: { type: String, trim: true },
    twitterLink: { type: String, trim: true },
    website: { type: String, trim: true },
    
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token_address: { type: String, trim: true },
    token_sell_address: { type: String, trim: true },
    
    isApproved: {
        type: Boolean,
        default: false
    },

    holders: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        tokenQty: { type: Number, default: 0, min: 0 }
    }],

    last_trade_timestamp: { type: Date, default: null },
    king_of_the_hill_timestamp: { type: Date, default: null },

    usdMarketCap: { type: Number, default: 0, min: 0 },
    coinLiquidity: { type: Number, default: 0, min: 0 },

    totalSupply: {
        type: Number,
        required: true,
        default: 1000000000000 // 1 Trillion
    },

    chartData: [{ type: Schema.Types.ObjectId, ref: 'ChartData' }],

    currentPrice: {
        type: Number,
        default: 0.0000001,
        min: 0.0000001
      },      


    currentCoinSupply: {
        type: Number,
        default: 0,
        min: 0
    },

    marketCap: {
        type: Number,
        default: 0,
        min: 0
    }

}, { timestamps: true });

// Auto-calculate marketCap before saving
CoinSchema.pre('save', function (next) {
    this.marketCap = this.currentPrice * this.currentCoinSupply;
    next();
});



// Export the model
module.exports = mongoose.model('Coin', CoinSchema);
