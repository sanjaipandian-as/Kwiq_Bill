const express = require('express');
const router = express.Router();
const {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    restoreExpense,
    bulkUpdateExpenses,
    bulkDeleteExpenses,
    exportExpensesToCSV,
    uploadReceipt,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// Main routes
router.route('/').get(protect, getExpenses).post(protect, createExpense);
router.route('/:id').put(protect, updateExpense).delete(protect, deleteExpense);
router.post('/:id/restore', protect, restoreExpense);

// Bulk operations
router.post('/bulk-update', protect, bulkUpdateExpenses);
router.post('/bulk-delete', protect, bulkDeleteExpenses);

// CSV export
router.get('/export/csv', protect, exportExpensesToCSV);

// Receipt upload
// Receipt upload with error handling
router.post('/:id/receipt', protect, (req, res, next) => {
    upload.single('receipt')(req, res, (err) => {
        if (err) {
            console.error('Upload Error:', err);
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, uploadReceipt);

module.exports = router;
