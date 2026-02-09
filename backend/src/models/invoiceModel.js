const mongoose = require('mongoose');

const invoiceSchema = mongoose.Schema(
    {
        invoiceNo: { type: String, required: true, unique: true },
        invoiceType: {
            type: String,
            enum: ['classic', 'compact', 'gst_detailed', 'minimal'],
            default: 'classic',
            required: true
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        },
        customerName: {
            type: String
        },
        seller: {
            name: { type: String, required: true },
            address: { type: String, required: true },
            gstin: { type: String },
            phone: { type: String },
            email: { type: String }
        },
        buyer: {
            name: { type: String, required: true },
            address: { type: String },
            gstin: { type: String }
        },
        items: [
            {
                name: { type: String, required: true },
                quantity: { type: Number, required: true },
                rate: { type: Number, required: true },
                hsn: { type: String },
                taxRate: { type: Number },
                cgst: { type: Number },
                sgst: { type: Number },
                igst: { type: Number },
                total: { type: Number, required: true }
            }
        ],
        totals: {
            grossTotal: { type: Number, default: 0 },
            itemDiscount: { type: Number, default: 0 },
            subTotal: { type: Number, required: true },
            totalTax: { type: Number, required: true },
            discount: { type: Number, default: 0 }, // Bill Level Discount
            additionalCharges: { type: Number, default: 0 },
            roundOff: { type: Number, default: 0 },
            grandTotal: { type: Number, required: true }
        },
        paymentMethod: { type: String, default: 'Cash' },
        internalNotes: { type: String },
        taxMode: {
            type: String,
            enum: ['GST', 'NONE'],
            default: 'NONE',
            required: true
        },
        createdAt: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ['PAID', 'UNPAID', 'PARTIALLY PAID', 'CANCELLED', 'REFUNDED'],
            default: 'UNPAID',
            required: true
        },
        payments: [
            {
                amount: Number,
                method: String,
                date: { type: Date, default: Date.now },
                note: String
            }
        ],
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Soft delete fields
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null }
    },
    {
        timestamps: true
    }
);

// Query middleware to filter out soft-deleted records
invoiceSchema.pre('find', function () {
    this.where({ isDeleted: false });
});

invoiceSchema.pre('findOne', function () {
    this.where({ isDeleted: false });
});

invoiceSchema.pre('countDocuments', function () {
    this.where({ isDeleted: false });
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
