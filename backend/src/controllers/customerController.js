const asyncHandler = require('express-async-handler');
const Customer = require('../models/customerModel');
const Joi = require('joi');

// @desc    Get all customers
// @route   GET /customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
    // Filter customers by authenticated user's ID
    const customers = await Customer.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const response = customers.map(c => ({
        id: c._id,
        customerId: c.customerId,
        fullName: c.fullName,
        firstName: c.firstName,
        lastName: c.lastName,
        customerType: c.customerType,
        gstin: c.gstin,
        email: c.email,
        phone: c.phone,
        address: c.address,
        source: c.source,
        tags: c.tags,
        loyaltyPoints: c.loyaltyPoints,
        notes: c.notes,
        totalVisits: c.totalVisits,
        totalSpent: c.totalSpent,
        due: c.due,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
    }));
    res.json(response);
});

// @desc    Get single customer
// @route   GET /customers/:id
// @access  Private
const getCustomerById = asyncHandler(async (req, res) => {
    // Verify ownership
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user._id });

    if (customer) {
        const response = {
            id: customer._id,
            customerId: customer.customerId,
            fullName: customer.fullName,
            firstName: customer.firstName,
            lastName: customer.lastName,
            customerType: customer.customerType,
            gstin: customer.gstin,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            source: customer.source,
            tags: customer.tags,
            loyaltyPoints: customer.loyaltyPoints,
            notes: customer.notes,
            totalVisits: customer.totalVisits,
            totalSpent: customer.totalSpent,
            due: customer.due,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt
        };
        res.json(response);
    } else {
        res.status(404);
        throw new Error('Customer not found or unauthorized');
    }
});

// @desc    Create a customer
// @route   POST /customers
// @access  Private
const createCustomer = asyncHandler(async (req, res) => {
    const {
        fullName,
        phone,
        email,
        address,
        customerType,
        gstin,
        source,
        tags,
        loyaltyPoints,
        notes
    } = req.body;

    const schema = Joi.object({
        fullName: Joi.string().required(),
        phone: Joi.string().required(),
        email: Joi.string().allow('').optional(),
        address: Joi.object({
            street: Joi.string().allow('').optional(),
            area: Joi.string().allow('').optional(),
            city: Joi.string().allow('').optional(),
            pincode: Joi.string().allow('').optional(),
            state: Joi.string().allow('').optional()
        }).optional(),
        customerType: Joi.string().valid('Individual', 'Business').optional(),
        gstin: Joi.string().allow('').optional(),
        source: Joi.string().valid('Walk-in', 'WhatsApp', 'Instagram', 'Referral', 'Other').optional(),
        tags: Joi.array().items(Joi.string().valid('VIP', 'Wholesale', 'Credit')).optional(),
        loyaltyPoints: Joi.number().optional(),
        notes: Joi.string().allow('').optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    // Split fullName into firstName and lastName
    const nameParts = (fullName || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Attach user ID
    const customer = await Customer.create({
        firstName,
        lastName,
        phone,
        email: email || '',
        address: address || {},
        customerType: customerType || 'Individual',
        gstin: gstin || '',
        source: source || 'Walk-in',
        tags: tags || [],
        loyaltyPoints: loyaltyPoints || 0,
        notes: notes || '',
        userId: req.user._id
    });

    const response = {
        id: customer._id,
        customerId: customer.customerId,
        fullName: customer.fullName,
        firstName: customer.firstName,
        lastName: customer.lastName,
        customerType: customer.customerType,
        gstin: customer.gstin,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        source: customer.source,
        tags: customer.tags,
        loyaltyPoints: customer.loyaltyPoints,
        notes: customer.notes,
        totalVisits: customer.totalVisits,
        totalSpent: customer.totalSpent,
        due: customer.due,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
    };
    res.status(201).json(response);
});

// @desc    Update a customer
// @route   PUT /customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res) => {
    // Verify ownership
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user._id });

    if (customer) {
        // Handle name update if fullName is provided
        if (req.body.fullName) {
            const nameParts = req.body.fullName.trim().split(/\s+/);
            customer.firstName = nameParts[0] || customer.firstName;
            customer.lastName = nameParts.slice(1).join(' ') || '';
        }

        customer.phone = req.body.phone || customer.phone;
        customer.email = req.body.email !== undefined ? req.body.email : customer.email;
        customer.customerType = req.body.customerType || customer.customerType;
        customer.gstin = req.body.gstin !== undefined ? req.body.gstin : customer.gstin;
        customer.source = req.body.source || customer.source;
        customer.loyaltyPoints = req.body.loyaltyPoints !== undefined ? req.body.loyaltyPoints : customer.loyaltyPoints;
        customer.notes = req.body.notes !== undefined ? req.body.notes : customer.notes;

        // Handle address update
        if (req.body.address) {
            customer.address = {
                street: req.body.address.street !== undefined ? req.body.address.street : customer.address.street,
                area: req.body.address.area !== undefined ? req.body.address.area : customer.address.area,
                city: req.body.address.city !== undefined ? req.body.address.city : customer.address.city,
                pincode: req.body.address.pincode !== undefined ? req.body.address.pincode : customer.address.pincode,
                state: req.body.address.state !== undefined ? req.body.address.state : customer.address.state
            };
        }

        // Handle tags update
        if (req.body.tags !== undefined) {
            customer.tags = req.body.tags;
        }

        const updatedCustomer = await customer.save();
        res.json({
            id: updatedCustomer._id,
            customerId: updatedCustomer.customerId,
            fullName: updatedCustomer.fullName,
            firstName: updatedCustomer.firstName,
            lastName: updatedCustomer.lastName,
            customerType: updatedCustomer.customerType,
            gstin: updatedCustomer.gstin,
            email: updatedCustomer.email,
            phone: updatedCustomer.phone,
            address: updatedCustomer.address,
            source: updatedCustomer.source,
            tags: updatedCustomer.tags,
            loyaltyPoints: updatedCustomer.loyaltyPoints,
            notes: updatedCustomer.notes,
            totalVisits: updatedCustomer.totalVisits,
            totalSpent: updatedCustomer.totalSpent,
            due: updatedCustomer.due,
            createdAt: updatedCustomer.createdAt,
            updatedAt: updatedCustomer.updatedAt
        });
    } else {
        res.status(404);
        throw new Error('Customer not found or unauthorized');
    }
});

// @desc    Delete a customer (soft delete)
// @route   DELETE /customers/:id
// @access  Private
const deleteCustomer = asyncHandler(async (req, res) => {
    // Verify ownership
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user._id });

    if (customer) {
        // Soft delete: mark as deleted instead of removing
        customer.isDeleted = true;
        customer.deletedAt = new Date();
        await customer.save();
        res.json({ message: 'Customer deleted successfully' });
    } else {
        res.status(404);
        throw new Error('Customer not found or unauthorized');
    }
});

// @desc    Restore a soft-deleted customer
// @route   POST /customers/:id/restore
// @access  Private
const restoreCustomer = asyncHandler(async (req, res) => {
    // Find customer including deleted ones
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: true });

    if (customer) {
        customer.isDeleted = false;
        customer.deletedAt = null;
        await customer.save();
        res.json({ 
            message: 'Customer restored successfully',
            customer: {
                id: customer._id,
                customerId: customer.customerId,
                fullName: customer.fullName,
                phone: customer.phone,
                email: customer.email
            }
        });
    } else {
        res.status(404);
        throw new Error('Deleted customer not found or unauthorized');
    }
});

// @desc    Search for duplicate customers by phone or email
// @route   GET /customers/search-duplicates?query=<phone_or_email>
// @access  Private
const searchDuplicates = asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query || query.length < 3) {
        return res.json([]);
    }

    // Escape special characters for regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Search by phone or email
    const customers = await Customer.find({
        userId: req.user._id,
        $or: [
            { phone: { $regex: escapedQuery, $options: 'i' } },
            { email: { $regex: escapedQuery, $options: 'i' } }
        ]
    })
        .limit(3)
        .select('_id customerId firstName lastName phone email');

    const response = customers.map(c => ({
        id: c._id,
        customerId: c.customerId,
        fullName: `${c.firstName} ${c.lastName}`.trim(),
        phone: c.phone,
        email: c.email
    }));

    res.json(response);
});

module.exports = {
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    restoreCustomer,
    searchDuplicates,
};
