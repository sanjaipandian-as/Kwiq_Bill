const mongoose = require('mongoose');

const customerSchema = mongoose.Schema(
    {
        customerId: {
            type: String,
            unique: true,
            sparse: true // Allow null for existing records during migration
        },
        firstName: { type: String, required: [true, 'First name is required'] },
        lastName: { type: String, default: '' },
        customerType: {
            type: String,
            enum: ['Individual', 'Business'],
            default: 'Individual'
        },
        gstin: {
            type: String,
            validate: {
                validator: function (v) {
                    // GSTIN is required only for Business type
                    if (this.customerType === 'Business' && !v) {
                        return false;
                    }
                    // If GSTIN is provided, validate format (15 characters alphanumeric)
                    if (v && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v)) {
                        return false;
                    }
                    return true;
                },
                message: 'Invalid GSTIN format'
            }
        },
        email: { type: String },
        phone: { type: String, required: [true, 'Phone number is required'] },
        address: {
            street: { type: String, default: '' },
            area: { type: String, default: '' },
            city: { type: String, default: '' },
            pincode: { type: String, default: '' },
            state: { type: String, default: '' }
        },
        source: {
            type: String,
            enum: ['Walk-in', 'WhatsApp', 'Instagram', 'Referral', 'Other'],
            default: 'Walk-in'
        },
        tags: [{
            type: String,
            enum: ['VIP', 'Wholesale', 'Credit']
        }],
        loyaltyPoints: { type: Number, default: 0 },
        notes: { type: String, default: '' },
        totalVisits: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        totalItemsPurchased: { type: Number, default: 0 },
        due: { type: Number, default: 0 },
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

// Virtual for full name
customerSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});

// Ensure virtuals are included in JSON
customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

// Indexes for fast duplicate detection
customerSchema.index({ phone: 1, userId: 1 });
customerSchema.index({ email: 1, userId: 1 });

// Query middleware to filter out soft-deleted records
customerSchema.pre('find', function () {
    this.where({ isDeleted: false });
});

customerSchema.pre('findOne', function () {
    this.where({ isDeleted: false });
});

customerSchema.pre('countDocuments', function () {
    this.where({ isDeleted: false });
});

// Pre-save hook to auto-generate customerId
customerSchema.pre('save', async function () {
    if (!this.customerId && this.isNew) {
        // Generate customerId: CUS-YYYYMMDD-XXXX
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

        // Find the last customer created today
        const lastCustomer = await this.constructor.findOne({
            customerId: new RegExp(`^CUS-${dateStr}-`)
        }).sort({ customerId: -1 });

        let sequence = 1;
        if (lastCustomer && lastCustomer.customerId) {
            const lastSequence = parseInt(lastCustomer.customerId.split('-')[2]);
            sequence = lastSequence + 1;
        }

        this.customerId = `CUS-${dateStr}-${sequence.toString().padStart(4, '0')}`;
    }
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
