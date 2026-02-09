const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const Invoice = require('../models/invoiceModel');
const Joi = require('joi');

// @desc    Get all products
// @route   GET /products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
    // Filter products by authenticated user's ID
    const products = await Product.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const response = products.map(p => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        brand: p.brand,
        price: p.price,
        stock: p.stock,
        unit: p.unit,
        description: p.description
    }));
    res.json(response);
});

// @desc    Get single product
// @route   GET /products/:id
// @access  Private
const getProductById = asyncHandler(async (req, res) => {
    // Verify ownership
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });

    if (product) {
        res.json({
            id: product._id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            brand: product.brand,
            price: product.price,
            stock: product.stock,
            unit: product.unit,
            description: product.description
        });
    } else {
        res.status(404);
        throw new Error('Product not found or unauthorized');
    }
});

// @desc    Create a product
// @route   POST /products
// @access  Private
const createProduct = asyncHandler(async (req, res) => {
    // Payload: { name, sku, category, price, stock, unit }
    const schema = Joi.object({
        name: Joi.string().required(),
        sku: Joi.string().required(),
        category: Joi.string().required(),
        price: Joi.number().required(),
        stock: Joi.number().required(),
        unit: Joi.string().allow('').optional(),
        brand: Joi.string().allow('').optional(),
        barcode: Joi.string().allow('').optional(),
        barcodeType: Joi.string().valid('CODE128', 'EAN13', 'UPC').default('CODE128').optional(),
        description: Joi.string().allow('').optional(),
        taxRate: Joi.number().optional(),
        costPrice: Joi.number().optional(),
        minStock: Joi.number().optional(),
        expiryDate: Joi.date().allow(null).optional(),
        isActive: Joi.boolean().default(true).optional(),
        variants: Joi.array().items(Joi.object({
            name: Joi.string().required(),
            options: Joi.array().items(Joi.string()).required(),
            price: Joi.number().optional(),
            stock: Joi.number().optional(),
            sku: Joi.string().optional()
        })).optional()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400);
        throw new Error(error.details[0].message);
    }

    const { name, sku, category, price, stock, unit, brand, barcode, barcodeType, description, taxRate, costPrice, minStock, expiryDate, isActive, variants } = req.body;

    // Check if sku exists for this user (SKU should be unique per user, not globally)
    const productExists = await Product.findOne({ sku, userId: req.user._id });
    if (productExists) {
        res.status(400);
        throw new Error('Product with this SKU already exists');
    }

    // Check if barcode exists for this user (if provided)
    if (barcode) {
        const barcodeExists = await Product.findOne({ barcode, userId: req.user._id });
        if (barcodeExists) {
            res.status(400);
            throw new Error('Product with this Barcode already exists');
        }
    }

    // Auto-calculate stock from variants if they exist
    let finalStock = stock;
    if (variants && variants.length > 0) {
        finalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
    }

    // Attach user ID
    const product = await Product.create({
        name,
        sku,
        category,
        price,
        stock: finalStock,
        unit,
        brand,
        barcode,
        barcodeType,
        description,
        taxRate,
        costPrice,
        minStock,
        expiryDate,
        isActive,
        variants,
        userId: req.user._id
    });

    res.status(201).json({
        id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        brand: product.brand,
        price: product.price,
        stock: product.stock,
        unit: product.unit,
        barcode: product.barcode,
        barcodeType: product.barcodeType,
        description: product.description,
        taxRate: product.taxRate,
        costPrice: product.costPrice,
        minStock: product.minStock,
        expiryDate: product.expiryDate,
        isActive: product.isActive,
        variants: product.variants
    });
});

// @desc    Update a product
// @route   PUT /products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
    // Verify ownership
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });

    if (product) {
        product.name = req.body.name || product.name;
        product.sku = req.body.sku || product.sku; // Optional update
        product.category = req.body.category || product.category;
        product.brand = req.body.brand !== undefined ? req.body.brand : product.brand;

        product.price = req.body.price !== undefined ? Number(req.body.price) : product.price;
        product.stock = req.body.stock !== undefined ? Number(req.body.stock) : product.stock;

        product.unit = req.body.unit !== undefined ? req.body.unit : product.unit;
        product.barcode = req.body.barcode !== undefined ? req.body.barcode : product.barcode;
        product.barcodeType = req.body.barcodeType || product.barcodeType;
        product.description = req.body.description !== undefined ? req.body.description : product.description;

        product.taxRate = req.body.taxRate !== undefined ? Number(req.body.taxRate) : product.taxRate;
        product.costPrice = req.body.costPrice !== undefined ? Number(req.body.costPrice) : product.costPrice;
        product.minStock = req.body.minStock !== undefined ? Number(req.body.minStock) : product.minStock;

        product.expiryDate = req.body.expiryDate !== undefined ? req.body.expiryDate : product.expiryDate;
        product.isActive = req.body.isActive !== undefined ? req.body.isActive : product.isActive;

        product.variants = req.body.variants || product.variants;

        // Auto-calculate stock if variants exist (either updated or existing)
        if (product.variants && product.variants.length > 0) {
            product.stock = product.variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
        } else {
            product.stock = req.body.stock !== undefined ? req.body.stock : product.stock;
        }

        // Check for duplicate barcode on update if it's being changed
        if (req.body.barcode && req.body.barcode !== product.barcode) {
            const barcodeExists = await Product.findOne({ barcode: req.body.barcode, userId: req.user._id });
            if (barcodeExists) {
                res.status(400);
                throw new Error('Product with this Barcode already exists');
            }
        }

        const updatedProduct = await product.save();
        res.json({
            id: updatedProduct._id,
            name: updatedProduct.name,
            sku: updatedProduct.sku,
            category: updatedProduct.category,
            brand: updatedProduct.brand,
            price: updatedProduct.price,
            stock: updatedProduct.stock,
            unit: updatedProduct.unit,
            barcode: updatedProduct.barcode,
            barcodeType: updatedProduct.barcodeType,
            description: updatedProduct.description,
            taxRate: updatedProduct.taxRate,
            costPrice: updatedProduct.costPrice,
            minStock: updatedProduct.minStock,
            expiryDate: updatedProduct.expiryDate,
            isActive: updatedProduct.isActive,
            variants: updatedProduct.variants
        });
    } else {
        res.status(404);
        throw new Error('Product not found or unauthorized');
    }
});

// @desc    Delete a product (soft delete)
// @route   DELETE /products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
    // Verify ownership
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });

    if (product) {
        // Soft delete: mark as deleted instead of removing
        product.isDeleted = true;
        product.deletedAt = new Date();
        await product.save();
        res.json({ message: 'Product deleted successfully' });
    } else {
        res.status(404);
        throw new Error('Product not found or unauthorized');
    }
});

// @desc    Restore a soft-deleted product
// @route   POST /products/:id/restore
// @access  Private
const restoreProduct = asyncHandler(async (req, res) => {
    // Find product including deleted ones
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: true });

    if (product) {
        product.isDeleted = false;
        product.deletedAt = null;
        await product.save();
        res.json({ 
            message: 'Product restored successfully',
            product: {
                id: product._id,
                name: product.name,
                sku: product.sku,
                price: product.price,
                stock: product.stock
            }
        });
    } else {
        res.status(404);
        throw new Error('Deleted product not found or unauthorized');
    }
});

// @desc    Fix database indexes (Drop old global sku index)
// @route   GET /products/fix-indexes
// @access  Public (Protected by secret or just open for temp fix? Making it protected by user auth is better)
const fixIndexes = asyncHandler(async (req, res) => {
    try {
        await Product.collection.dropIndex('sku_1');
        res.json({ message: 'Global SKU index dropped successfully' });
    } catch (error) {
        if (error.code === 27) {
            res.json({ message: 'Index sku_1 not found (already dropped)' });
        } else {
            res.status(500);
            throw new Error('Failed to drop index: ' + error.message);
        }
    }
});

// @desc    Get product stats (sales, history)
// @route   GET /products/:id/stats
// @access  Private
const getProductStats = asyncHandler(async (req, res) => {
    const productId = req.params.id;

    // Get all invoices for this user that contain this product
    const invoices = await Invoice.find({
        userId: req.user._id,
        "items.productId": productId
    }).sort({ date: -1 });

    let totalSold = 0;
    let monthlySales = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30));
    let lastSoldDate = null;

    if (invoices.length > 0) {
        lastSoldDate = invoices[0].date;

        invoices.forEach(inv => {
            const item = inv.items.find(i => i.productId.toString() === productId);
            if (item) {
                const qty = item.quantity || 0;
                totalSold += qty;

                if (new Date(inv.date) >= thirtyDaysAgo) {
                    monthlySales += qty;
                }
            }
        });
    }

    res.json({
        lastSold: lastSoldDate,
        totalSold,
        monthlySales
    });
});

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct,
    fixIndexes,
    getProductStats
};
