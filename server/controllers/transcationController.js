const Transaction = require('../models/TransactionModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ApiResponse = require('../utils/apiResponse');


exports.getTransactionsByUser = catchAsync(async (req, res, next) => {
    const { userId } = req.params;

    if (!userId) {
        return next(new AppError('User ID is required', 400));
    }

    const transactions = await Transaction.find({ user: userId })
    .populate('coin', 'name symbol ticker')
    .populate('user')
    .exec();

    if (!transactions.length) {
        return next(new AppError('No transactions found for this user', 404));
    }

    res.status(200).json(new ApiResponse(200, transactions, 'Transactions retrieved successfully'));
});


exports.getTransactionsByCoin = catchAsync(async (req, res, next) => {
    const { coinId } = req.params;

    if (!coinId) {
        return next(new AppError('Coin ID is required', 400));
    }
    const transactions = await Transaction.find({ coin: coinId })
    .populate('user')
    .exec();

    if (!transactions.length) {
        return next(new AppError('No transactions found for this coin', 404));
    }

    res.status(200).json(new ApiResponse(200, transactions, 'Transactions retrieved successfully'));
});


exports.getLatestTransactions = catchAsync(async (req, res, next) => {
    try {
        const transactions = await Transaction.find()
            .populate('coin', 'name image ticker') // Populate the coin field
            .populate('user', 'name email') // Populate the user field
            .sort({ createdAt: -1 }) // Sort by creation date, newest first
            .limit(20) // Limit to 20 transactions
            .exec();

        if (!transactions.length) {
            return next(new AppError('No transactions found', 404));
        }

        res.status(200).json(new ApiResponse(200, transactions, 'Latest transactions retrieved successfully'));
    } catch (error) {
        console.error('Error retrieving transactions:', error);
        return next(new AppError('Error retrieving transactions', 500));
    }
});
