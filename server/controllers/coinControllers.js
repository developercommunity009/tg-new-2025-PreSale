const Coin = require('../models/CoinModel');
const Transaction = require('../models/TransactionModel');
const ChartData = require('../models/ChartDataModel');
const User = require('../models/UserModel');
const catchAsync = require('../utils/catchAsync'); // Adjust the path as necessary
const AppError = require('../utils/appError'); // Adjust the path as necessary
const ApiResponse = require('../utils/apiResponse'); // Adjust the path as necessary
const { emitSocketEvent } = require('../sockets');
const APIFeatures = require('../utils/apiFeatures');
const axios = require('axios');
const { ethers, utils } = require('ethers');
const Web3 = require('web3');
const BigNumber = require('bignumber.js');




// Create a new coin
exports.createCoin = catchAsync(async (req, res, next) => {
    const { name, ticker, description, image, chain, creator, token_address } = req.body;

    if (!name || !ticker || !description || !image || !chain || !creator) {
        return next(new AppError('All fields are required', 400));
    }

    const newCoin = await Coin.create({
        name,
        ticker,
        description,
        image,
        chain,
        creator,
        token_address
    });
    emitSocketEvent(req, "newCoinCreated", newCoin);
    res.status(201).json(new ApiResponse(201, { coin: newCoin }, 'Coin created successfully'));
});


exports.userApprovel = catchAsync(async (req, res) => {

    try {
        const { coinid } = req.params; // Get coinid from query parameters
        if (!coinid) {
            return res.status(400).json({ success: false, message: 'coinid is required' });
        }

        // Find the coin by ID
        const coin = await Coin.findOne({ _id: coinid });

        if (!coin) {
            return res.status(404).json(new ApiResponse(404, null, 'Coin not found'));
        }

        // Update isApproved to true
        coin.isApproved = true;
        await coin.save(); // Save the updated coin

        res.status(200).json(new ApiResponse(201, coin, 'Coin approved successfully'));
    } catch (error) {
        res.status(500).json(new ApiResponse(500, null, 'Server error', error.message));
    }
});


exports.setsellAddress = catchAsync(async (req, res) => {
    const { coinid } = req.params;
    const { token_sell_address } = req.body;
    console.log(token_sell_address);
    // Validate required fields
    if (!coinid) {
        return res.status(400).json({ success: false, message: 'coinid is required' });
    }
    if (!token_sell_address) {
        return res.status(400).json({ success: false, message: 'token_sell_address is required' });
    }

    // Find the coin by ID
    const coin = await Coin.findById(coinid);
    if (!coin) {
        return res.status(404).json({ success: false, message: 'Coin not found' });
    }

    // Update the token_sell_address
    coin.token_sell_address = token_sell_address;
    await coin.save();

    // Respond with success message
    return res.status(200).json({ success: true, data: coin, message: 'Token sell address updated successfully' });
});




exports.searchCoins = catchAsync(async (req, res) => {

    try {
        const { query } = req.query; // Get the search query from the request

        if (!query) {
            return next(new AppError('Query parameter is required', 400));
        }

        // Perform search across multiple fields using $or
        const coins = await Coin.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },            // Search by coin name
                { ticker: { $regex: query, $options: 'i' } },          // Search by ticker symbol
                { description: { $regex: query, $options: 'i' } },     // Search by description
                { chain: { $regex: query, $options: 'i' } },           // Search by blockchain chain
                { telegramLink: { $regex: query, $options: 'i' } },    // Search by Telegram link
                { twitterLink: { $regex: query, $options: 'i' } },     // Search by Twitter link
                { website: { $regex: query, $options: 'i' } },         // Search by website
                { 'creator.name': { $regex: query, $options: 'i' } },  // Search by creator's name (optional if using populate)
            ]
        }).populate('creator'); // Populate creator's name


        res.status(200).json(new ApiResponse(201, coins, 'Coin get successfully'));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


// Get a coin by ID
exports.getCoin = catchAsync(async (req, res, next) => {
    const coin = await Coin.findById(req.params.id).populate('chartData');
    if (!coin) return next(new AppError('Coin not found', 404));

    res.status(200).json(new ApiResponse(200, { coin }, 'Coin retrieved successfully'));
});

// Get all coins
exports.getAllCoins = catchAsync(async (req, res, next) => {
    // Exclude coins with coinLiquidity equal to or greater than 50000 and filter only approved coins
    const features = new APIFeatures(
        Coin.find({ coinLiquidity: { $lt: 50000 }, isApproved: true }).populate('creator'),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const coins = await features.query;

    if (!coins.length) {
        return res.status(206).json(
            new ApiResponse(206, { coins: [] }, 'No coins available at the moment')
        );
    }

    res.status(200).json(new ApiResponse(200, { coins }, 'Coins retrieved successfully'));
});


// Get Hils coins
exports.getHilsCoins = catchAsync(async (req, res, next) => {
    // Only show coins with coinLiquidity equal to or greater than 69000
    const features = new APIFeatures(
        Coin.find({ coinLiquidity: { $gte: 50000 }, isApproved: true }).populate('creator'),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const coins = await features.query;

    if (!coins.length) {
        return res.status(206).json(
            new ApiResponse(206, { coins: [] }, 'No coins available at the moment')
        );
    }
    res.status(200).json(new ApiResponse(200, { coins }, 'Coins retrieved successfully'));
});

// Get Hils coins
exports.getfeatured = catchAsync(async (req, res, next) => {
    // Only show coins with coinLiquidity between 25000 and 50000
    const features = new APIFeatures(
        Coin.find({ coinLiquidity: { $gte: 25000, $lt: 50000 }, isApproved: true }).populate('creator'),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const coins = await features.query;

    if (!coins.length) {
        return res.status(207).json(
            new ApiResponse(207, { coins: [] }, 'No coins available at the moment')
        )
    };

    res.status(200).json(new ApiResponse(200, { coins }, 'Coins retrieved successfully'));
});

// Get all coins by userID
exports.getAllCoinsByUserId = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Check if id is provided
    if (!id) {
        return next(new AppError('User ID is required', 400));
    }
    // Find all coins by user ID
    const coins = await Coin.find({ creator: id }).populate("creator");

    // If no coins found, return error
    if (!coins || coins.length === 0) {
        return next(new AppError('Coins not found', 404));
    }

    // Return the found coins
    res.status(200).json(new ApiResponse(200, { coins }, 'Coins retrieved successfully'));
});

// Get all coins holdres
exports.getCoinsByHolders = catchAsync(async (req, res, next) => {
    const { coinId } = req.params; // Get the coinId from the request parameters

    // Check if coinId is provided
    if (!coinId) {
        return next(new AppError('Coin ID is required', 400));
    }

    // Find the coin by ID and populate the 'holders.user' field to get the user details
    const coin = await Coin.findById(coinId)
        .populate({
            path: 'holders.user', // Populate the 'user' field inside 'holders'
            select: 'profilePicture wallet username' // Adjust fields as needed
        });

    // If coin is not found, return an error
    if (!coin) {
        return next(new AppError('Coin not found', 404));
    }

    // Extract and format only the holders' information
    const holders = coin.holders.map(holder => ({
        user: holder.user, // Includes user details (name, email)
        tokenQty: holder.tokenQty // The quantity of tokens the user holds
    }));

    // Return only the holders array
    res.status(200).json(new ApiResponse(200, { holders }, 'Holders retrieved successfully'));

});
// Get all coins held by a user with their quantities
exports.getCoinsByHeld = catchAsync(async (req, res, next) => {
    const { userId } = req.params;

    // Check if userId is provided
    if (!userId) {
        return next(new AppError('User ID is required', 400));
    }

    // Find the user by ID and populate the coin details
    const user = await User.findById(userId).populate('coin_held.coin');

    // If user is not found, return an error
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // If user has no coins, return an appropriate response
    if (!user.coin_held || user.coin_held.length === 0) {
        return res.status(200).json(new ApiResponse(200, { coins: [] }, 'No coins found for this user'));
    }

    // Format the response to include coin details and quantities
    const coinsWithQuantities = user.coin_held.map(holding => ({
        coin: holding.coin,
        quantity: holding.quantity
    }));

    // Return the found coins with their quantities
    res.status(200).json(new ApiResponse(200, { coins: coinsWithQuantities }, 'Coins retrieved successfully'));
});


// Update a coin by ID
exports.updateCoin = catchAsync(async (req, res, next) => {
    const { name, totalSupply, ticker, description, image, chain, hidden, usd_market_cap } = req.body;

    const updatedCoin = await Coin.findByIdAndUpdate(req.params.id, {
        name,
        totalSupply,
        ticker,
        description,
        image,
        chain,
        hidden,
        usd_market_cap
    }, { new: true });

    if (!updatedCoin) return next(new AppError('Coin not found', 404));

    res.status(200).json(new ApiResponse(200, { coin: updatedCoin }, 'Coin updated successfully'));
});

// Delete a coin by ID
exports.deleteCoin = catchAsync(async (req, res, next) => {
    const deletedCoin = await Coin.findByIdAndDelete(req.params.id);
    if (!deletedCoin) return next(new AppError('Coin not found', 404));

    res.status(200).json(new ApiResponse(200, { coin: deletedCoin }, 'Coin deleted successfully'));
});




const basePrice = 0.0000001; // starting price
const priceFunction = (supply, liquidity) => {
    return basePrice + (supply * 0.00000000001) + (liquidity * 0.00000001);
};



const getNativeTokenPrice = (chain, priceData) => {
    switch (chain.toLowerCase()) {
        case 'bsc': return priceData?.binancecoin?.usd;
        case 'ethereum': return priceData?.ethereum?.usd;
        case 'matic': return priceData['matic-network']?.usd;
        default: return null;
    }
};


exports.buyTokens = catchAsync(async (req, res, next) => {
    const { coinId } = req.params;
    const { amount, userId } = req.body;

    if (!coinId || !amount || !userId || amount <= 0) {
        return next(new AppError('Coin ID, amount, and user ID are required', 400));
    }

    const [coin, user] = await Promise.all([
        Coin.findById(coinId),
        User.findById(userId)
    ]);
    if (!coin || !user) return next(new AppError('Coin or User not found', 404));

    // Fetch native price
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: { ids: 'binancecoin,ethereum,matic-network', vs_currencies: 'usd' }
    });
    const nativeUsd = getNativeTokenPrice(coin.chain, response.data);
    if (!nativeUsd) return next(new AppError('Chain price unavailable', 500));

    const usdtAmount = amount * nativeUsd;
    const currentPrice = priceFunction(coin.currentCoinSupply, coin.coinLiquidity);

   let tokenQty =  amount / 0.00001;;
    if (coin.currentCoinSupply + tokenQty > coin.totalSupply) {
        tokenQty = coin.totalSupply - coin.currentCoinSupply;
    }

    // Update state
    coin.currentCoinSupply += tokenQty;
    coin.coinLiquidity += usdtAmount;
    coin.currentPrice = Number(priceFunction(coin.currentCoinSupply, coin.coinLiquidity).toFixed(8));

    // Holder update
    const holder = coin.holders.find(h => h.user.toString() === userId);
    if (holder) holder.tokenQty += tokenQty;
    else coin.holders.push({ user: userId, tokenQty });

    const userCoin = user.coin_held.find(c => c.coin.toString() === coinId);
    if (userCoin) userCoin.quantity += tokenQty;
    else user.coin_held.push({ coin: coinId, quantity: tokenQty });

    await Promise.all([coin.save(), user.save()]);

    await Transaction.create({
        coin: coinId,
        user: userId,
        amount,
        tokenQuantity: tokenQty,
        type: 'buy',
        price: coin.currentPrice
    });

    await ChartData.create({
        coin: coinId,
        price: coin.currentPrice,
        totalSupply: coin.currentCoinSupply,
        timestamp: Math.floor(Date.now() / 1000)
    });

    emitSocketEvent(req, 'tradeBuy', { coinId, tokenQty, price: coin.currentPrice });

    res.status(200).json(new ApiResponse(200, { coin }, 'Tokens bought successfully'));
});





exports.sellTokens = catchAsync(async (req, res, next) => {
    const { coinId } = req.params;
    const { amount, userId, address } = req.body;

    if (!coinId || !amount || !userId || !address) {
        return next(new AppError('All fields are required', 400));
    }

    const coin = await Coin.findById(coinId);
    const user = await User.findById(userId);
    if (!coin || !user) return next(new AppError('Coin or User not found', 404));

    // Get native token price
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: { ids: 'binancecoin,ethereum,matic-network', vs_currencies: 'usd' }
    });
    const nativeUsd = getNativeTokenPrice(coin.chain, response.data);
    if (!nativeUsd) return next(new AppError('Chain price unavailable', 500));

    const usdAmount = amount * nativeUsd;
    const currentPrice = priceFunction(coin.currentCoinSupply, coin.coinLiquidity);
    const sellTokenQty = usdAmount / currentPrice;

    const userCoin = user.coin_held.find(c => c.coin.toString() === coinId);
    if (!userCoin || userCoin.quantity < sellTokenQty) {
        return next(new AppError('Not enough tokens to sell', 402));
    }

    if (coin.coinLiquidity < usdAmount || coin.currentCoinSupply < sellTokenQty) {
        return next(new AppError('Not enough liquidity or supply', 400));
    }

    // Update coin and user
    coin.currentCoinSupply -= sellTokenQty;
    coin.coinLiquidity -= usdAmount;
    coin.currentPrice = Number(priceFunction(coin.currentCoinSupply, coin.coinLiquidity).toFixed(8));

    userCoin.quantity -= sellTokenQty;
    if (userCoin.quantity === 0) {
        user.coin_held = user.coin_held.filter(c => c.coin.toString() !== coinId);
    }

    const holder = coin.holders.find(h => h.user.toString() === userId);
    if (holder) {
        holder.tokenQty -= sellTokenQty;
        if (holder.tokenQty <= 0) {
            coin.holders = coin.holders.filter(h => h.user.toString() !== userId);
        }
    }

    await Promise.all([coin.save(), user.save()]);

    await Transaction.create({
        coin: coinId,
        user: userId,
        amount,
        tokenQuantity: sellTokenQty,
        type: 'sell',
        price: coin.currentPrice
    });

    await ChartData.create({
        coin: coinId,
        price: coin.currentPrice,
        totalSupply: coin.currentCoinSupply,
        timestamp: Math.floor(Date.now() / 1000)
    });

    emitSocketEvent(req, 'tradeSell', { coinId, tokenQty: sellTokenQty, price: coin.currentPrice });

    res.status(200).json(new ApiResponse(200, { coin }, 'Tokens sold successfully'));
});


exports.getBuyedTokenQty = catchAsync(async (req, res, next) => {

    const { coinId } = req.params;
    const { amount } = req.body;
    if (!coinId || !amount) {
        return next(new AppError('Coin ID and amount are required', 400));
    }

    const coin = await Coin.findById(coinId);
    if (!coin) return next(new AppError('Coin not found', 404));

    // Get real-time price
    let priceData;
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: { ids: 'binancecoin,ethereum,matic-network', vs_currencies: 'usd' }
        });
        priceData = response.data;
    } catch (error) {
        return next(new AppError('Failed to fetch price data', 500));
    }

    let usdValue;
    switch (coin.chain.toLowerCase()) {
        case 'bsc': usdValue = priceData?.binancecoin?.usd; break;
        case 'ethereum': usdValue = priceData?.ethereum?.usd; break;
        case 'matic': usdValue = priceData['matic-network']?.usd; break;
        default: return next(new AppError('Unsupported chain', 400));
    }

    if (!usdValue) return next(new AppError('Price data unavailable', 500));

    const usdtAmount = amount * usdValue;
    const currentPrice = priceFunction(coin.currentCoinSupply, coin.coinLiquidity);
    let buyedTokenQty = usdtAmount / currentPrice;

    // Clamp to max available
    if (coin.currentCoinSupply + buyedTokenQty > coin.totalSupply) {
        buyedTokenQty = coin.totalSupply - coin.currentCoinSupply;
    }

    res.status(206).json(new ApiResponse(206, { buyedTokenQty }, 'Token quantity calculated'));
});


exports.getSellTokenQty = catchAsync(async (req, res, next) => {
    console.log("ENterß")
    const { coinId } = req.params;
    const { amount } = req.body;

    if (!coinId || !amount) {
        return next(new AppError('Coin ID and amount are required', 400));
    }

    const coin = await Coin.findById(coinId);
    if (!coin) return next(new AppError('Coin not found', 404));

    // Fetch live price
    let priceData;
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: { ids: 'binancecoin,ethereum,matic-network', vs_currencies: 'usd' }
        });
        priceData = response.data;
    } catch (error) {
        return next(new AppError('Failed to fetch real-time price data', 500));
    }

    let nativeTokenPrice;
    switch (coin.chain.toLowerCase()) {
        case 'bsc': nativeTokenPrice = priceData?.binancecoin?.usd; break;
        case 'ethereum': nativeTokenPrice = priceData?.ethereum?.usd; break;
        case 'matic': nativeTokenPrice = priceData['matic-network']?.usd; break;
        default: return next(new AppError('Unsupported chain', 400));
    }

    if (!nativeTokenPrice) return next(new AppError('Price data for the chain is missing', 500));

    const nativeTokenAmount = amount * nativeTokenPrice;

    const currentPrice = priceFunction(coin.currentCoinSupply, coin.coinLiquidity);
    const sellTokenQty = nativeTokenAmount / currentPrice;
    console.log(coin.currentCoinSupply, coin.coinLiquidity)
    console.log(currentPrice)
    console.log(nativeTokenAmount)
    console.log(sellTokenQty)
    res.status(207).json(new ApiResponse(207, { sellTokenQty }, 'Sell token quantity calculated successfully'));
});
