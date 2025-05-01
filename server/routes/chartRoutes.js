const express = require('express');
const router = express.Router();
const  ChartData  = require('../controllers/chartControllers');

router.get('/:coinId', ChartData.getCoinChartByCoinId);

module.exports = router;
