const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transcationController');

// Route to get transactions by user
router.get('/user/:userId', transactionController.getTransactionsByUser);

// Route to get transactions by coin
router.get('/coin/:coinId', transactionController.getTransactionsByCoin);

router.get('/getlatest', transactionController.getLatestTransactions);

module.exports = router;
