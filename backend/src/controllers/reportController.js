const asyncHandler = require('express-async-handler');
const Invoice = require('../models/invoiceModel');
const Expense = require('../models/expenseModel');
const Customer = require('../models/customerModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose');

// Helper to build date match
const buildDateMatch = (userId, startDate, endDate) => {
    const match = { userId: new mongoose.Types.ObjectId(userId) };
    if (startDate || endDate) {
        match.date = {};
        if (startDate) match.date.$gte = new Date(startDate);
        if (endDate) match.date.$lte = new Date(endDate);
    }
    return match;
};

// Helper to get daily trend for a specific field/model
const getDailyTrend = async (model, match, field = 'total', days = 14) => { // Fetch 7 visible + 7 previous for sparkline smoothening/context if needed
    const trend = await model.aggregate([
        { $match: match },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                value: { $sum: `$${field}` }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Fill missing dates
    const result = [];
    const endDate = match.date?.$lte ? new Date(match.date.$lte) : new Date();
    // Default to last 7 days if no range

    // Simple mapping for now: just return the data points we have, 
    // frontend can handle gaps or we fill them here.
    return trend.map(t => ({ date: t._id, value: t.value }));
};

// @desc    Get dashboard stats (Enhanced with Sparklines & Comparisons)
// @route   GET /reports/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const dateMatch = buildDateMatch(userId, startDate, endDate);

    // Previous Period Logic
    // Previous Period Logic
    let prevMatch;
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const duration = end - start;
        const prevEndDate = new Date(start.getTime() - 1);
        const prevStartDate = new Date(prevEndDate.getTime() - duration);
        prevMatch = buildDateMatch(userId, prevStartDate.toISOString(), prevEndDate.toISOString());
    } else {
        // "All Time" case (or no specific range provided)
        // Previous period for "All Time" is logically 0 or undefined.
        // We set a match that returns nothing to ensure prev = 0.
        prevMatch = { _id: new mongoose.Types.ObjectId() }; // Impossible ID match
    }

    // Parallel Aggregation
    const [
        currentSalesResult, prevSalesResult,
        currentOrders, prevOrders,
        currentExpensesResult, prevExpensesResult,
        salesTrend,
        paidOrders
    ] = await Promise.all([
        Invoice.aggregate([{ $match: dateMatch }, { $group: { _id: null, total: { $sum: "$total" } } }]),
        Invoice.aggregate([{ $match: prevMatch }, { $group: { _id: null, total: { $sum: "$total" } } }]),
        Invoice.countDocuments(dateMatch),
        Invoice.countDocuments(prevMatch),
        Expense.aggregate([{ $match: dateMatch }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
        Expense.aggregate([{ $match: prevMatch }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
        getDailyTrend(Invoice, dateMatch, 'total'),
        Invoice.countDocuments({ ...dateMatch, status: 'Paid' })
    ]);

    const salesVal = currentSalesResult[0]?.total || 0;
    const expenseVal = currentExpensesResult[0]?.total || 0;
    const profitVal = salesVal - expenseVal;

    // Ratios (Out of 100%)
    // Sales: Profit Margin %
    const salesRatio = salesVal > 0 ? (profitVal / salesVal) * 100 : 0;

    // Orders: Completion Rate (Paid Orders / Total Orders)
    const ordersRatio = currentOrders > 0 ? (paidOrders / currentOrders) * 100 : 0;

    // Expenses: Expense Ratio (Expenses / Sales)
    // If expenses > sales, max at 100 for display safety
    const expensesRatio = salesVal > 0 ? Math.min(100, (expenseVal / salesVal) * 100) : (expenseVal > 0 ? 100 : 0);

    const stats = {
        sales: {
            value: salesVal,
            prev: prevSalesResult[0]?.total || 0,
            change: parseFloat(salesRatio.toFixed(1)),
            sparkline: salesTrend
        },
        orders: {
            value: currentOrders || 0,
            prev: prevOrders || 0,
            change: parseFloat(ordersRatio.toFixed(1))
        },
        expenses: {
            value: expenseVal,
            prev: prevExpensesResult[0]?.total || 0,
            change: parseFloat(expensesRatio.toFixed(1))
        },
        netProfit: {
            value: profitVal,
            prev: (prevSalesResult[0]?.total || 0) - (prevExpensesResult[0]?.total || 0),
            change: parseFloat(salesRatio.toFixed(1)) // Reuse Profit Margin
        },
        aov: {
            value: currentOrders > 0 ? salesVal / currentOrders : 0,
            prev: prevOrders > 0 ? (prevSalesResult[0]?.total || 0) / prevOrders : 0,
            change: 0
        }
    };

    // No longer calculating trends here, as we are sending specific Ratios calculated above.
    // Object.keys(stats).forEach... removed.

    res.json(stats);
});

// @desc    Get Customer Metrics (New vs Returning, CLV)
// @route   GET /reports/customers
// @access  Private
const getCustomerMetrics = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    const match = buildDateMatch(userId, startDate, endDate);

    // 1. New Customers: Created within range
    // 2. Returning Customers: Placed order in range AND have > 1 order total (simplified)
    // For MVP efficiency:
    // "New" = First invoice within date range.
    // "Returning" = Invoice in range, but first invoice was BEFORE start date.

    // Actually, simpler:
    // Get all invoices in range. Group by customerId.
    // Check min(date) for each customerId globally.

    // Let's stick to simple aggregates for speed:
    // Total Unique Customers in Period
    const uniqueCustomersInPeriod = await Invoice.distinct('customerId', match);
    const totalCustomersInPeriod = uniqueCustomersInPeriod.length;

    // To differentiate New vs Returning properly requires looking up Customer creation date or history.
    // We'll use Customer model 'createdAt' for "New" approximation.
    const customerDateMatch = { userId: new mongoose.Types.ObjectId(userId) };
    if (startDate) customerDateMatch.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate || Date.now()) };

    const newCustomersCount = await Customer.countDocuments(customerDateMatch);
    const returningCustomersCount = Math.max(0, totalCustomersInPeriod - newCustomersCount);

    // CLV: Total Revenue / Total Unique Customers (All Time)
    // Or CLV in Period: Revenue / Customers
    const totalRevenueResult = await Invoice.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: "$total" } } }
    ]);
    const revenue = totalRevenueResult[0]?.total || 0;
    const clv = totalCustomersInPeriod > 0 ? revenue / totalCustomersInPeriod : 0;

    res.json({
        newCustomers: newCustomersCount,
        returningCustomers: returningCustomersCount,
        repeatRate: totalCustomersInPeriod > 0 ? (returningCustomersCount / totalCustomersInPeriod) * 100 : 0,
        clv
    });
});

// @desc    Get financials  
// @route   GET /reports/financials
// @access  Private
const getFinancials = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const invoiceMatch = buildDateMatch(userId, startDate, endDate);
    const expenseMatch = { userId: new mongoose.Types.ObjectId(userId) };
    if (startDate || endDate) {
        expenseMatch.date = {};
        if (startDate) expenseMatch.date.$gte = new Date(startDate);
        if (endDate) expenseMatch.date.$lte = new Date(endDate);
    }

    const [salesResult, expensesResult, countResult] = await Promise.all([
        Invoice.aggregate([
            { $match: invoiceMatch },
            { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]),
        Expense.aggregate([
            { $match: expenseMatch },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        Invoice.countDocuments(invoiceMatch) // Use match with date for count
    ]);

    const totalSales = salesResult[0] ? salesResult[0].total : 0;
    const totalOrders = countResult; // This is now filtered
    const totalExpenses = expensesResult[0] ? expensesResult[0].total : 0;

    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const netProfit = totalSales - totalExpenses;

    res.json({
        totalSales,
        totalOrders,
        avgOrderValue,
        totalExpenses,
        netProfit
    });
});


// @desc    Get Sales Trend (Comparison Support)
// @route   GET /reports/sales-trend
// @access  Private
const getSalesTrend = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    const match = buildDateMatch(userId, startDate, endDate);

    const trend = await Invoice.aggregate([
        { $match: match },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                sales: { $sum: "$total" },
                orders: { $sum: 1 },
                profit: { $sum: { $subtract: ["$total", { $ifNull: ["$totalCost", 0] }] } } // Needs cost logic if available
            }
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                date: "$_id",
                sales: 1,
                orders: 1,
                _id: 0
            }
        }
    ]);

    res.json(trend);
});

// @desc    Get Payment Methods
// @route   GET /reports/payment-methods
// @access  Private
const getPaymentMethods = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    const match = buildDateMatch(userId, startDate, endDate);

    const stats = await Invoice.aggregate([
        { $match: match },
        {
            $group: {
                _id: "$paymentMethod",
                value: { $sum: "$total" },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                name: { $ifNull: ["$_id", "Other"] },
                value: 1,
                count: 1,
                _id: 0
            }
        },
        { $sort: { value: -1 } }
    ]);
    res.json(stats);
});

// @desc    Get Top Products/Categories/Brands
// @route   GET /reports/top-products
// @access  Private
const getTopProducts = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { startDate, endDate, groupBy = 'product' } = req.query; // product, category, brand
    const match = buildDateMatch(userId, startDate, endDate);

    // Grouping Field Selection
    let groupId;
    let localField = "_id";
    let foreignField = "_id";
    let lookupFrom = "products";
    let lookupAs = "info";
    let nameField = "$info.name";

    if (groupBy === 'category') {
        // Group by product Category first?
        // Actually Invoice items stores productId. Product has category.
        // We need to look up first.
        const results = await Invoice.aggregate([
            { $match: match },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $group: {
                    _id: "$product.category",
                    revenue: { $sum: "$items.total" },
                    quantity: { $sum: "$items.quantity" },
                    cost: { $sum: { $multiply: ["$items.quantity", { $ifNull: ["$product.costPrice", 0] }] } }
                }
            },
            {
                $project: {
                    name: "$_id",
                    revenue: 1,
                    quantity: 1,
                    margin: { $subtract: ["$revenue", "$cost"] },
                    _id: 0
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 20 }
        ]);
        return res.json(results);

    } else if (groupBy === 'brand') {
        const results = await Invoice.aggregate([
            { $match: match },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $group: {
                    _id: "$product.brand",
                    revenue: { $sum: "$items.total" },
                    quantity: { $sum: "$items.quantity" },
                    cost: { $sum: { $multiply: ["$items.quantity", { $ifNull: ["$product.costPrice", 0] }] } }
                }
            },
            {
                $project: {
                    name: { $ifNull: ["$_id", "Unknown Brand"] },
                    revenue: 1,
                    quantity: 1,
                    margin: { $subtract: ["$revenue", "$cost"] },
                    _id: 0
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 20 }
        ]);
        return res.json(results);
    }

    // Default: Group by Product
    const topProducts = await Invoice.aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.productId",
                quantity: { $sum: "$items.quantity" },
                revenue: { $sum: "$items.total" }
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "productInfo"
            }
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                name: { $ifNull: ["$productInfo.name", "Unknown Product"] },
                quantity: 1,
                revenue: 1,
                costPrice: { $ifNull: ["$productInfo.costPrice", 0] }
            }
        },
        {
            $addFields: {
                totalCost: { $multiply: ["$quantity", "$costPrice"] }
            }
        },
        {
            $addFields: {
                marginValue: { $subtract: ["$revenue", "$totalCost"] }
            }
        },
        {
            $addFields: {
                marginPercent: {
                    $cond: [
                        { $gt: ["$revenue", 0] },
                        { $multiply: [{ $divide: ["$marginValue", "$revenue"] }, 100] },
                        0
                    ]
                }
            }
        },
        { $sort: { revenue: -1 } },
        { $limit: 50 },
        {
            $project: {
                name: 1,
                quantity: 1,
                revenue: 1,
                marginPercent: 1,
                marginValue: 1,
                _id: 0
            }
        }
    ]);
    res.json(topProducts);
});

module.exports = {
    getDashboardStats,
    getFinancials,
    getSalesTrend,
    getPaymentMethods,
    getTopProducts,
    getCustomerMetrics
};

