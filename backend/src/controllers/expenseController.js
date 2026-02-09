const asyncHandler = require('express-async-handler');
const Expense = require('../models/expenseModel');
const Joi = require('joi');
const path = require('path');
const fs = require('fs');
const { cloudinary, uploadToCloudinary } = require('../config/cloudinary');

// @desc    Get all expenses
// @route   GET /expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
    // Filter expenses by authenticated user's ID
    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 });
    const response = expenses.map(e => ({
        id: e._id,
        title: e.title,
        amount: e.amount,
        date: e.date,
        category: e.category,
        description: e.description,
        paymentMethod: e.paymentMethod,
        reference: e.reference,
        tags: e.tags,
        isRecurring: e.isRecurring,
        frequency: e.frequency,
        nextDueDate: e.nextDueDate,
        receiptUrl: e.receiptUrl
    }));
    res.json(response);
});

// @desc    Create an expense
// @route   POST /expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
    const schema = Joi.object({
        title: Joi.string().required(),
        amount: Joi.number().required(),
        category: Joi.string().required(),
        date: Joi.date().required(),
        description: Joi.string().allow('').optional(),
        paymentMethod: Joi.string().valid('Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other').optional(),
        reference: Joi.string().allow('').optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        isRecurring: Joi.boolean().optional(),
        frequency: Joi.string().valid('one-time', 'weekly', 'monthly', 'quarterly', 'yearly').optional(),
        nextDueDate: Joi.date().allow('', null).optional(),
        receiptUrl: Joi.string().allow('').optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    const {
        title, amount, category, date, description,
        paymentMethod, reference, tags, isRecurring,
        frequency, nextDueDate, receiptUrl
    } = req.body;

    // Attach authenticated user's ID to the expense
    const expense = await Expense.create({
        title,
        amount,
        category,
        date,
        description,
        paymentMethod,
        reference,
        tags,
        isRecurring,
        frequency,
        nextDueDate,
        receiptUrl,
        userId: req.user._id
    });

    res.status(201).json({
        id: expense._id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        description: expense.description,
        paymentMethod: expense.paymentMethod,
        reference: expense.reference,
        tags: expense.tags,
        isRecurring: expense.isRecurring,
        frequency: expense.frequency,
        nextDueDate: expense.nextDueDate,
        receiptUrl: expense.receiptUrl
    });
});

// @desc    Update an expense
// @route   PUT /expenses/:id
// @access  Private
const updateExpense = asyncHandler(async (req, res) => {
    const schema = Joi.object({
        title: Joi.string().optional(),
        amount: Joi.number().optional(),
        category: Joi.string().optional(),
        date: Joi.date().optional(),
        description: Joi.string().allow('').optional(),
        paymentMethod: Joi.string().valid('Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other').optional(),
        reference: Joi.string().allow('').optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        isRecurring: Joi.boolean().optional(),
        frequency: Joi.string().valid('one-time', 'weekly', 'monthly', 'quarterly', 'yearly').optional(),
        nextDueDate: Joi.date().allow('', null).optional(),
        receiptUrl: Joi.string().allow('').optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    // Verify ownership: find expense by ID AND userId
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });

    if (!expense) {
        res.status(404);
        throw new Error('Expense not found or unauthorized');
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
        expense[key] = req.body[key];
    });

    await expense.save();

    res.json({
        id: expense._id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        description: expense.description,
        paymentMethod: expense.paymentMethod,
        reference: expense.reference,
        tags: expense.tags,
        isRecurring: expense.isRecurring,
        frequency: expense.frequency,
        nextDueDate: expense.nextDueDate,
        receiptUrl: expense.receiptUrl
    });
});

// @desc    Delete an expense (soft delete)
// @route   DELETE /expenses/:id
// @access  Private
const deleteExpense = asyncHandler(async (req, res) => {
    // Verify ownership: find expense by ID AND userId
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });

    if (expense) {
        // Soft delete: mark as deleted instead of removing
        // Note: Receipt file is retained for recovery purposes
        expense.isDeleted = true;
        expense.deletedAt = new Date();
        await expense.save();
        res.json({ message: 'Expense deleted successfully' });
    } else {
        res.status(404);
        throw new Error('Expense not found or unauthorized');
    }
});

// @desc    Bulk update expenses
// @route   POST /expenses/bulk-update
// @access  Private
const bulkUpdateExpenses = asyncHandler(async (req, res) => {
    const schema = Joi.object({
        ids: Joi.array().items(Joi.string()).required(),
        updates: Joi.object({
            category: Joi.string().optional(),
            isRecurring: Joi.boolean().optional(),
            frequency: Joi.string().valid('one-time', 'weekly', 'monthly', 'quarterly', 'yearly').optional(),
            tags: Joi.array().items(Joi.string()).optional(),
        }).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    const { ids, updates } = req.body;

    // Update only expenses owned by the user
    const result = await Expense.updateMany(
        { _id: { $in: ids }, userId: req.user._id },
        { $set: updates }
    );

    res.json({
        message: 'Expenses updated successfully',
        modifiedCount: result.modifiedCount
    });
});

// @desc    Bulk delete expenses (soft delete)
// @route   POST /expenses/bulk-delete
// @access  Private
const bulkDeleteExpenses = asyncHandler(async (req, res) => {
    const schema = Joi.object({
        ids: Joi.array().items(Joi.string()).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    const { ids } = req.body;

    // Soft delete: update only expenses owned by the user
    const result = await Expense.updateMany(
        { _id: { $in: ids }, userId: req.user._id },
        {
            $set: {
                isDeleted: true,
                deletedAt: new Date()
            }
        }
    );

    res.json({
        message: 'Expenses deleted successfully',
        deletedCount: result.modifiedCount
    });
});

// @desc    Restore a soft-deleted expense
// @route   POST /expenses/:id/restore
// @access  Private
const restoreExpense = asyncHandler(async (req, res) => {
    // Find expense including deleted ones
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: true });

    if (expense) {
        expense.isDeleted = false;
        expense.deletedAt = null;
        await expense.save();
        res.json({
            message: 'Expense restored successfully',
            expense: {
                id: expense._id,
                title: expense.title,
                amount: expense.amount,
                category: expense.category,
                date: expense.date
            }
        });
    } else {
        res.status(404);
        throw new Error('Deleted expense not found or unauthorized');
    }
});

// @desc    Export expenses to CSV
// @route   GET /expenses/export/csv
// @access  Private
const exportExpensesToCSV = asyncHandler(async (req, res) => {
    const expenses = await Expense.find({ userId: req.user._id }).sort({ date: -1 });

    // CSV header
    const header = 'Title,Amount,Category,Date,Payment Method,Reference,Tags,Recurring,Frequency,Next Due Date,Notes\n';

    // CSV rows
    const rows = expenses.map(e => {
        const tags = e.tags ? e.tags.join(';') : '';
        const recurring = e.isRecurring ? 'Yes' : 'No';
        const nextDue = e.nextDueDate ? new Date(e.nextDueDate).toLocaleDateString() : '';
        const date = new Date(e.date).toLocaleDateString();

        return [
            `"${e.title}"`,
            e.amount,
            `"${e.category}"`,
            date,
            `"${e.paymentMethod || ''}"`,
            `"${e.reference || ''}"`,
            `"${tags}"`,
            recurring,
            `"${e.frequency || ''}"`,
            nextDue,
            `"${e.description || ''}"`
        ].join(',');
    }).join('\n');

    const csv = header + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=expenses-${Date.now()}.csv`);
    res.send(csv);
});

// @desc    Upload receipt for expense
// @route   POST /expenses/:id/receipt
// @access  Private
const uploadReceipt = asyncHandler(async (req, res) => {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });

    if (!expense) {
        res.status(404);
        throw new Error('Expense not found or unauthorized');
    }

    if (!req.file) {
        res.status(400);
        throw new Error('No file uploaded');
    }

    // Delete old receipt from Cloudinary if exists
    if (expense.receiptUrl && expense.receiptUrl.includes('cloudinary.com')) {
        try {
            // Extract public_id from Cloudinary URL
            const urlParts = expense.receiptUrl.split('/');
            const uploadIndex = urlParts.findIndex(part => part === 'upload');
            if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                // Get everything after version (v1234567890)
                const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');
                // Remove file extension to get public_id
                const publicId = pathAfterVersion.replace(/\.[^/.]+$/, '');

                // Determine resource type from URL or file extension
                const isPdf = expense.receiptUrl.toLowerCase().includes('.pdf');
                const resourceType = isPdf ? 'raw' : 'image';

                // Delete from Cloudinary
                await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
                console.log(`Deleted old receipt: ${publicId}`);
            }
        } catch (deleteError) {
            // Log but don't fail the upload if deletion fails
            console.error('Failed to delete old receipt from Cloudinary:', deleteError.message);
        }
    }

    // Force 'image' resource type even for PDFs. 
    // This treats PDFs as visual documents (standard Cloudinary behavior), 
    // which avoids strict 'raw' file access permissions that cause 401 errors.
    const resourceType = 'auto'; // 'auto' is safest, but we rely on Cloudinary's default handling which is usually public for images/PDFs.

    // NOTE: If 'auto' still results in 401, it means the account has strict PDF delivery settings.
    // We explicitly set access_mode to public.

    // Upload options
    const uploadOptions = {
        folder: 'expense-receipts',
        resource_type: 'auto', // Keep auto to support both generic images and PDFs
        type: 'upload',
        access_mode: 'public',
        use_filename: true,
        unique_filename: true,
    };

    try {
        const result = await uploadToCloudinary(req.file.buffer, uploadOptions);

        // Save secure URL
        expense.receiptUrl = result.secure_url;
        await expense.save();

        // Return complete expense object for proper state sync
        res.json({
            message: 'Receipt uploaded successfully',
            receiptUrl: expense.receiptUrl,
            expense: {
                id: expense._id,
                title: expense.title,
                amount: expense.amount,
                category: expense.category,
                date: expense.date,
                description: expense.description,
                paymentMethod: expense.paymentMethod,
                reference: expense.reference,
                tags: expense.tags,
                isRecurring: expense.isRecurring,
                frequency: expense.frequency,
                nextDueDate: expense.nextDueDate,
                receiptUrl: expense.receiptUrl
            }
        });
    } catch (uploadError) {
        console.error('Cloudinary Upload Error:', uploadError);
        res.status(500);
        throw new Error(`Failed to upload receipt: ${uploadError.message}`);
    }
});

module.exports = {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    restoreExpense,
    bulkUpdateExpenses,
    bulkDeleteExpenses,
    exportExpensesToCSV,
    uploadReceipt,
};