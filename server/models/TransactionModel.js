const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
    coin: {
        type: Schema.Types.ObjectId,
        ref: 'Coin',
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    type: {
        type: String,
        enum: ['buy', 'sell'],  // Only allow 'buy' or 'sell'
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0  // Ensures price is a positive number
    },
    amount: {
        type: Number,
        required: true,
        min: 0  // Ensures amount is a positive number
    },
    tokenQuantity:{
        type: Number,
        required: true,
    }
}, { timestamps: true });

TransactionSchema.index({ coin: 1 });
TransactionSchema.index({ buyer: 1 });
TransactionSchema.index({ seller: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
