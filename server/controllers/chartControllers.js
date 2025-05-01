const ChartData = require('../models/ChartDataModel'); // Import the chart data model
const AppError = require('../utils/appError'); // Adjust the path as necessary
const ApiResponse = require('../utils/apiResponse'); 


// Controller to get chart data by coinId
exports.getCoinChartByCoinId = async (req, res, next) => {
  try {
    const { coinId } = req.params;

    // Validate if coinId is passed
    if (!coinId) {
      return next(new AppError('Coin ID is required', 400));
    }

    // Fetch chart data for the given coin ID
    const chartData = await ChartData.find({ coin: coinId }).sort({ timestamp: 1 });
    // If no data found for the given coinId
    if (!chartData || chartData.length === 0) {
      return next(new AppError('No chart data found for this coin', 400));
    }

    // Success response
    res.status(200).json(new ApiResponse(200, chartData , 'Chart data retrieved successfully'));
  } catch (err) {
    return next(new AppError('Failed to retrieve chart data', 500));

  }
};


