const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        barcode: { type: String },
        barcodeType: {
            type: String,
            enum: ['CODE128', 'EAN13', 'UPC'],
            default: 'CODE128'
        },
        // Contract says: Response: { id, name, sku, category, price, stock, unit }
        // Payload: { name, sku, category, price, stock, unit }
        // Let's use 'sku' to match contract strictly, but we can alias or store barcode there.
        sku: { type: String, required: true }, // Removed unique: true, handled by compound index
        category: { type: String, required: true },
        brand: { type: String },
        price: { type: Number, required: true, default: 0 },
        stock: { type: Number, required: true, default: 0 },
        unit: { type: String, default: 'pcs' },
        description: { type: String },
        taxRate: { type: Number, default: 0 },
        costPrice: { type: Number, default: 0 },
        minStock: { type: Number, default: 10 },
        expiryDate: { type: Date },
        isActive: { type: Boolean, default: true },
        variants: [{
            name: { type: String }, // e.g., "Size", "Color"
            options: [{ type: String }], // e.g., ["S", "M", "L"]
            price: { type: Number },
            stock: { type: Number },
            sku: { type: String }
        }],
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
productSchema.pre('find', function() {
    this.where({ isDeleted: false });
});

productSchema.pre('findOne', function() {
    this.where({ isDeleted: false });
});

productSchema.pre('countDocuments', function() {
    this.where({ isDeleted: false });
});

// Compound index to ensure SKU is unique per user
productSchema.index({ sku: 1, userId: 1 }, { unique: true });
// Compound index to ensure Barcode is unique per user (sparse to allow nulls if multiple items define no barcode)
productSchema.index({ barcode: 1, userId: 1 }, { unique: true, sparse: true });
// Compound index to ensure Variant SKU is unique per user
productSchema.index({ "variants.sku": 1, userId: 1 }, { unique: true, sparse: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
