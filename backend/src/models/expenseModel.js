const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema(
    {
        title: { type: String, required: true },
        amount: { type: Number, required: true },
        date: { type: Date, required: true, default: Date.now },
        category: { type: String, required: true },
        description: { type: String },

        // Payment tracking
        paymentMethod: {
            type: String,
            enum: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other'],
            default: 'Cash'
        },
        reference: { type: String }, // Bill number or transaction ID

        // Categorization
        tags: [{ type: String }],

        // Recurring expenses
        isRecurring: { type: Boolean, default: false },
        frequency: {
            type: String,
            enum: ['one-time', 'weekly', 'monthly', 'quarterly', 'yearly'],
            default: 'one-time'
        },
        nextDueDate: { type: Date },

        // Receipt attachment
        receiptUrl: { type: String },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Soft delete fields
        isDeleted: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
    }
);

// Query middleware to filter out soft-deleted records
expenseSchema.pre('find', function() {
    this.where({ isDeleted: false });
});

expenseSchema.pre('findOne', function() {
    this.where({ isDeleted: false });
});

expenseSchema.pre('countDocuments', function() {
    this.where({ isDeleted: false });
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
