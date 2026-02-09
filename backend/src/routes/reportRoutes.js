const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getFinancials,
    getSalesTrend,
    getPaymentMethods,
    getTopProducts,
    getCustomerMetrics
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboardStats);
router.get('/financials', protect, getFinancials);
router.get('/sales-trend', protect, getSalesTrend);
router.get('/payment-methods', protect, getPaymentMethods);
router.get('/top-products', protect, getTopProducts);
router.get('/customers', protect, getCustomerMetrics);

module.exports = router;
