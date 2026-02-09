const asyncHandler = require('express-async-handler');
const Invoice = require('../models/invoiceModel');
const Product = require('../models/productModel');
const Customer = require('../models/customerModel');
const Joi = require('joi');
const Settings = require('../models/settingsModel');

// @desc    Get all invoices
// @route   GET /invoices
// @access  Private
// @desc    Get all invoices with filtering
// @route   GET /invoices
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
    const {
        search,
        customerId,
        startDate,
        endDate,
        status,
        paymentMethod,
        minAmount,
        maxAmount,
        limit = 50,
        page = 1
    } = req.query;

    const query = { userId: req.user._id };

    // Filter by Customer
    if (customerId) {
        query.customerId = customerId;
    }

    // Search (ID, Customer Name)
    if (search) {
        query.$or = [
            { customerName: { $regex: search, $options: 'i' } },
            // If search is a valid ObjectId, search by ID
            ...(mongoose.isValidObjectId(search) ? [{ _id: search }] : [])
        ];
    }

    // Date Range
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    // Status (Support array for multi-select)
    if (status) {
        if (Array.isArray(status)) {
            query.status = { $in: status };
        } else {
            // If comma separated string
            query.status = { $in: status.split(',') };
        }
    }

    // Payment Method
    if (paymentMethod && paymentMethod !== 'All') {
        query.paymentMethod = paymentMethod;
    }

    // Amount Range
    if (minAmount || maxAmount) {
        query.total = {};
        if (minAmount) query.total.$gte = Number(minAmount);
        if (maxAmount) query.total.$lte = Number(maxAmount);
    }

    const count = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
        .sort({ date: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate('userId', 'name');

    // Transform response
    const response = invoices.map(inv => ({
        id: inv._id,
        invoiceNumber: inv._id.toString().slice(-6).toUpperCase(), // Visual ID
        customerName: inv.customerName,
        customer: inv.customerName,
        date: inv.date,
        total: inv.total,
        amount: inv.total,
        status: inv.status,
        paymentStatus: inv.paymentStatus || inv.status,
        method: inv.paymentMethod || 'Cash',
        paymentMethod: inv.paymentMethod || 'Cash',
        type: inv.type,
        balance: inv.balance || 0,
        isLocked: inv.isLocked || false,
        cashierName: inv.userId ? (inv.userId.name || 'Unknown') : 'System',
        internalNotes: inv.internalNotes,
        items: inv.items,
        tax: inv.totals?.totalTax || 0,
        discount: inv.totals?.discount || 0,
        subtotal: inv.totals?.subTotal || 0,
        total: inv.totals?.grandTotal || inv.total || 0,
    }));

    res.json({
        data: response,
        page: Number(page),
        pages: Math.ceil(count / limit),
        total: count
    });
});



// @desc    Update invoice (Status, Notes, Lock)
// @route   PUT /invoices/:id
// @access  Private
const updateInvoice = asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });

    if (!invoice) {
        res.status(404);
        throw new Error('Invoice not found');
    }

    if (invoice.isLocked) {
        // Only allow unlocking if specifically requested (maybe by admin/owner)? 
        // For now, allow modifying 'isLocked' to false.
        if (req.body.isLocked === false) {
            invoice.isLocked = false;
        } else {
            res.status(403);
            throw new Error('Invoice is locked. Unlock it to make changes.');
        }
    }

    const {
        status,
        internalNotes,
        isLocked,
        type,
        balance,
        paymentAdd // Object: { amount, method, note }
    } = req.body;

    const oldBalance = invoice.balance || 0;
    const oldStatus = invoice.status;

    if (status) invoice.status = status.toUpperCase();
    if (internalNotes !== undefined) invoice.internalNotes = internalNotes;
    if (isLocked !== undefined) invoice.isLocked = isLocked;
    if (type) invoice.type = type;
    if (balance !== undefined) invoice.balance = balance;

    // Add Payment Logic
    if (paymentAdd) {
        if (!invoice.payments) invoice.payments = [];
        invoice.payments.push({
            ...paymentAdd,
            date: new Date()
        });

        const totalPaid = invoice.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        if (invoice.total - totalPaid <= 0) {
            invoice.status = 'PAID';
            invoice.balance = 0;
        } else {
            invoice.status = 'PARTIALLY PAID'; // Schema only has PAID/UNPAID? Let's check.
            invoice.balance = invoice.total - totalPaid;
        }
    }

    const savedInvoice = await invoice.save();

    // Update Customer Stats if status changed or balance changed
    if (invoice.customerId) {
        const customer = await Customer.findOne({ _id: invoice.customerId, userId: req.user._id });
        if (customer) {
            // Case 1: Status changed to Cancelled
            if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
                customer.totalSpent = Math.max(0, customer.totalSpent - invoice.total);
                customer.totalVisits = Math.max(0, customer.totalVisits - 1);

                // Calculate item count to deduct
                const itemCount = invoice.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                customer.totalItemsPurchased = Math.max(0, (customer.totalItemsPurchased || 0) - itemCount);

                customer.due = Math.max(0, customer.due - oldBalance);

                // Restore stock if cancelled
                for (const item of invoice.items) {
                    const product = await Product.findOne({ _id: item.productId, userId: req.user._id });
                    if (product) {
                        product.stock += item.quantity;
                        await product.save();
                    }
                }
            }
            // Case 2: Status restored from Cancelled
            else if (oldStatus === 'Cancelled' && status && status !== 'Cancelled') {
                customer.totalSpent += invoice.total;
                customer.totalVisits += 1;

                // Calculate item count to add back
                const itemCount = invoice.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                customer.totalItemsPurchased = (customer.totalItemsPurchased || 0) + itemCount;

                customer.due += invoice.balance;

                // Re-deduct stock if restored from cancelled
                for (const item of invoice.items) {
                    const product = await Product.findOne({ _id: item.productId, userId: req.user._id });
                    if (product) {
                        product.stock -= item.quantity;
                        await product.save();
                    }
                }
            }
            // Case 3: Just a balance change (payment added)
            else if (invoice.balance !== oldBalance) {
                customer.due += (invoice.balance - oldBalance);
            }

            await customer.save();
        }
    }

    res.json(savedInvoice);
});


// @desc    Get single invoice
// @route   GET /invoices/:id
// @access  Private
const getInvoiceById = asyncHandler(async (req, res) => {
    // Verify ownership
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });

    if (invoice) {
        res.json({
            id: invoice._id,
            customerName: invoice.customerName,
            customer: invoice.customerName,
            customerId: invoice.customerId,
            date: invoice.date,
            items: invoice.items.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.total
            })),
            subtotal: invoice.totals?.subTotal || invoice.subtotal || 0,
            tax: invoice.totals?.totalTax || invoice.tax || 0,
            discount: invoice.totals?.discount || invoice.discount || 0,
            total: invoice.totals?.grandTotal || invoice.total || 0,
            amount: invoice.totals?.grandTotal || invoice.total || 0,
            status: invoice.status,
            method: invoice.paymentMethod || 'Cash',
            paymentMethod: invoice.paymentMethod || 'Cash',
            type: invoice.type || 'Retail',
            internalNotes: invoice.internalNotes,
            isLocked: invoice.isLocked,
            balance: invoice.balance,
            payments: invoice.payments || [],
            totals: {
                subtotal: invoice.subtotal,
                tax: invoice.tax,
                discount: invoice.discount,
                total: invoice.total
            }
        });
    } else {
        res.status(404);
        throw new Error('Invoice not found or unauthorized');
    }
});

// @desc    Create invoice
// @route   POST /invoices
// @access  Private
const createInvoice = asyncHandler(async (req, res) => {
    const schema = Joi.object({
        customerId: Joi.string().allow('').optional(), // ObjectId as string or empty
        customerName: Joi.string().required(),
        date: Joi.date().required(),
        type: Joi.string().allow('').optional(),
        items: Joi.array().items(
            Joi.object({
                productId: Joi.string().required(),
                name: Joi.string().required(),
                quantity: Joi.number().greater(0).required(),
                price: Joi.number().required(),
                total: Joi.number().required() // We verify this
            })
        ).min(1).required(),
        subtotal: Joi.number().required(),
        tax: Joi.number().required(),
        discount: Joi.number().min(0).optional(),
        grossTotal: Joi.number().optional(),
        itemDiscount: Joi.number().optional(),
        additionalCharges: Joi.number().optional(),
        roundOff: Joi.number().optional(),
        total: Joi.number().required(),
        paymentMethod: Joi.string().allow('').optional(),
        status: Joi.string().allow('').optional(),
        internalNotes: Joi.string().allow('').optional(),
        amountReceived: Joi.number().optional().allow(null, '')
    });

    console.log("Create Invoice Body:", JSON.stringify(req.body, null, 2));
    const { error } = schema.validate(req.body);
    if (error) {
        console.log("Joi Validation Error:", error.details[0].message);
        res.status(400);
        throw new Error(error.details[0].message);
    }

    let {
        customerId, customerName, date, items, subtotal, tax,
        discount = 0, grossTotal = 0, itemDiscount = 0,
        additionalCharges = 0, roundOff = 0, total,
        paymentMethod, type = 'Retail', status = 'Paid', internalNotes,
        amountReceived = 0
    } = req.body;

    // Recalculate totals and check stock
    let calcSubtotal = 0;
    const finalItems = [];

    // Calculate Balance and Payments
    let balance = 0;
    let payments = [];
    const received = parseFloat(amountReceived) || 0;

    if (status === 'Paid') {
        balance = 0;
        payments.push({
            amount: total, // Full amount paid
            method: paymentMethod || 'Cash',
            date: date || new Date(),
            note: 'Full Payment'
        });
    } else if (status === 'Unpaid') {
        balance = total;
        // No payments
    } else if (status === 'Partially Paid') {
        balance = total - received;
        if (received > 0) {
            payments.push({
                amount: received,
                method: paymentMethod || 'Cash',
                date: date || new Date(),
                note: 'Partial Payment'
            });
        }
    } else {
        // Cancelled, etc.
        balance = 0; // Or keep as total? Usually cancelled means 0 due.
    }

    // Process items - verify user owns the products
    for (const item of items) {
        const product = await Product.findOne({ _id: item.productId, userId: req.user._id });
        if (!product) {
            res.status(400);
            throw new Error(`Product not found or unauthorized: ${item.name}`);
        }

        if (product.type !== 'Service' && product.stock < item.quantity) {
            // Allow service items to bypass stock check or specifically check if type is Product
            // Assuming product model has 'type', if not, just check stock.
            // Existing code checked stock. Let's assume stock check is needed.
            // If we add 'Service' type to Product later, we skip this.
            // For now, standard behavior:
            res.status(400);
            throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stock}`);
        }

        // Verify item total
        const lineTotal = item.quantity * item.price;
        calcSubtotal += lineTotal;

        finalItems.push({
            productId: product._id,
            name: product.name,
            quantity: item.quantity,
            rate: item.price, // Map frontend 'price' to backend 'rate'
            total: lineTotal
        });

        // Deduct Stock
        product.stock -= item.quantity;
        await product.save();
    }

    // allow small float diffs
    const epsilon = 0.01;

    if (Math.abs(calcSubtotal - subtotal) > epsilon) {
        subtotal = calcSubtotal;
    }

    const calcTotal = subtotal + tax + additionalCharges - discount;

    // Attach user ID
    // Generate Invoice Number
    const count = await Invoice.countDocuments();
    const invoiceNo = `INV-${new Date().getFullYear()}${String(count + 1).padStart(5, '0')}`;

    // Fetch Settings for Seller Info
    const settings = await Settings.findOne({ userId: req.user._id });
    const sellerInfo = {
        name: settings?.store?.name || 'Store Name',
        address: settings?.store?.address ? Object.values(settings.store.address).filter(Boolean).join(', ') : 'Store Address',
        gstin: settings?.store?.gstin || '',
        phone: settings?.store?.contact || '',
        email: settings?.store?.email || ''
    };

    // Prepare Buyer Info
    let buyerInfo = {
        name: customerName || 'Walk-in Customer',
        address: '',
        gstin: ''
    };

    if (customerId) {
        const customer = await Customer.findOne({ _id: customerId, userId: req.user._id });
        if (customer) {
            buyerInfo.name = customer.fullName || customerName;
            buyerInfo.address = customer.address ? Object.values(customer.address).filter(Boolean).join(', ') : '';
            buyerInfo.gstin = customer.gstin || '';
        }
    }

    const invoice = await Invoice.create({
        invoiceNo,
        customerId: customerId || null,
        customerName: buyerInfo.name, // Ensure consistent name
        seller: sellerInfo,
        buyer: buyerInfo,
        date,
        items: finalItems,
        totals: {
            grossTotal,
            itemDiscount,
            subTotal: subtotal,
            totalTax: tax,
            discount,
            additionalCharges,
            roundOff,
            grandTotal: calcTotal
        },
        // Legacy flat fields for backward compatibility if needed, removing them now as they are not in schema
        // grossTotal, itemDiscount, subtotal, tax, discount, additionalCharges, roundOff, total: calcTotal,

        status: status.toUpperCase(), // Enum requires UPPERCASE
        paymentStatus: status.toUpperCase(),
        balance,
        payments,
        paymentMethod,
        type,
        internalNotes,
        userId: req.user._id
    });

    // Update Customer Stats if customerId exists (and user owns the customer)
    if (customerId) {
        const customer = await Customer.findOne({ _id: customerId, userId: req.user._id });
        if (customer) {
            customer.totalSpent += calcTotal;
            customer.totalVisits += 1;

            // Calculate total items
            const totalItems = finalItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
            customer.totalItemsPurchased = (customer.totalItemsPurchased || 0) + totalItems;

            customer.due += balance; // Add the remaining balance to customer's due
            await customer.save();
        }
    }

    res.status(201).json({
        id: invoice._id,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        date: invoice.date,
        items: invoice.items,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        discount: invoice.discount,
        total: invoice.total,
        status: invoice.status,
        paymentMethod: invoice.paymentMethod,
        type: invoice.type,
        internalNotes: invoice.internalNotes,
        invoiceNumber: invoice._id.toString().slice(-6).toUpperCase(),
        balance: invoice.balance,
        payments: invoice.payments
    });
});

// @desc    Delete invoice (soft delete)
// @route   DELETE /invoices/:id
// @access  Private
const deleteInvoice = asyncHandler(async (req, res) => {
    // Verify ownership
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });

    if (invoice) {
        if (invoice.isLocked) {
            res.status(403);
            throw new Error('Cannot delete a locked invoice.');
        }

        // Restore stock for user's products only
        for (const item of invoice.items) {
            const product = await Product.findOne({ _id: item.productId, userId: req.user._id });
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        // Update customer stats if customer exists and user owns it
        if (invoice.customerId) {
            const customer = await Customer.findOne({ _id: invoice.customerId, userId: req.user._id });
            if (customer) {
                customer.totalSpent = Math.max(0, customer.totalSpent - invoice.total);
                customer.totalVisits = Math.max(0, customer.totalVisits - 1);

                // Deduct items
                const itemCount = invoice.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                customer.totalItemsPurchased = Math.max(0, (customer.totalItemsPurchased || 0) - itemCount);

                customer.due = Math.max(0, customer.due - (invoice.balance || 0));
                await customer.save();
            }
        }

        // Soft delete: mark as deleted instead of removing
        invoice.isDeleted = true;
        invoice.deletedAt = new Date();
        await invoice.save();
        res.json({ message: 'Invoice deleted successfully' });
    } else {
        res.status(404);
        throw new Error('Invoice not found or unauthorized');
    }
});

const bulkDeleteInvoices = asyncHandler(async (req, res) => {
    const { ids } = req.body;

    if (!ids || ids.length === 0) {
        res.status(400);
        throw new Error('No invoice IDs provided');
    }

    // Process each invoice for stock restoration and user verification
    const operations = ids.map(async (id) => {
        const invoice = await Invoice.findOne({ _id: id, userId: req.user._id });
        if (invoice) {
            if (invoice.isLocked) return; // Skip locked

            // Restore stock
            for (const item of invoice.items) {
                const product = await Product.findOne({ _id: item.productId, userId: req.user._id });
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }

            // Update customer
            if (invoice.customerId) {
                const customer = await Customer.findOne({ _id: invoice.customerId, userId: req.user._id });
                if (customer) {
                    customer.totalSpent = Math.max(0, customer.totalSpent - invoice.total);
                    customer.totalVisits = Math.max(0, customer.totalVisits - 1);

                    // Deduct items
                    const itemCount = invoice.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                    customer.totalItemsPurchased = Math.max(0, (customer.totalItemsPurchased || 0) - itemCount);

                    customer.due = Math.max(0, customer.due - (invoice.balance || 0));
                    await customer.save();
                }
            }

            // Soft delete
            invoice.isDeleted = true;
            invoice.deletedAt = new Date();
            await invoice.save();
        }
    });

    await Promise.all(operations);
    res.json({ message: 'Selected invoices deleted successfully' });
});

// @desc    Restore a soft-deleted invoice
// @route   POST /invoices/:id/restore
// @access  Private
const restoreInvoice = asyncHandler(async (req, res) => {
    // Find invoice including deleted ones
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: true });

    if (invoice) {
        // Deduct stock again (reverse the restoration that happened on delete)
        for (const item of invoice.items) {
            const product = await Product.findOne({ _id: item.productId, userId: req.user._id });
            if (product) {
                if (product.stock < item.quantity) {
                    res.status(400);
                    throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`);
                }
                product.stock -= item.quantity;
                await product.save();
            }
        }

        // Restore customer stats
        if (invoice.customerId) {
            const customer = await Customer.findOne({ _id: invoice.customerId, userId: req.user._id });
            if (customer) {
                customer.totalSpent += invoice.total;
                customer.totalVisits += 1;

                // Restore items
                const itemCount = invoice.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                customer.totalItemsPurchased = (customer.totalItemsPurchased || 0) + itemCount;

                customer.due += (invoice.balance || 0);
                await customer.save();
            }
        }

        // Restore invoice
        invoice.isDeleted = false;
        invoice.deletedAt = null;
        await invoice.save();

        res.json({
            message: 'Invoice restored successfully',
            invoice: {
                id: invoice._id,
                customerName: invoice.customerName,
                total: invoice.total,
                date: invoice.date,
                status: invoice.status
            }
        });
    } else {
        res.status(404);
        throw new Error('Deleted invoice not found or unauthorized');
    }
});

// Update getInvoiceStats to include payment method breakdown
const getInvoiceStats = asyncHandler(async (req, res) => {
    const { startDate, endDate, status } = req.query;
    const match = { userId: req.user._id };

    if (startDate || endDate) {
        match.date = {};
        if (startDate) match.date.$gte = new Date(startDate);
        if (endDate) match.date.$lte = new Date(endDate);
    }

    if (status) {
        match.status = status;
    }

    const stats = await Invoice.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalSales: { $sum: '$total' },
                totalInvoices: { $sum: 1 },
                avgOrderValue: { $avg: '$total' },
                outstandingAmount: {
                    $sum: { $cond: [{ $ne: ['$status', 'PAID'] }, '$balance', 0] }
                },
                paidCount: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] } },
                cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] } }
            }
        }
    ]);

    const byMethod = await Invoice.aggregate([
        { $match: match },
        { $group: { _id: '$paymentMethod', totalAmount: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    res.json({
        summary: stats[0] || { totalSales: 0, totalInvoices: 0, avgOrderValue: 0, outstandingAmount: 0 },
        byMethod
    });
});

module.exports = {
    getInvoices,
    getInvoiceById,
    createInvoice,
    deleteInvoice,
    restoreInvoice,
    bulkDeleteInvoices,
    getInvoiceStats,
    updateInvoice
};
