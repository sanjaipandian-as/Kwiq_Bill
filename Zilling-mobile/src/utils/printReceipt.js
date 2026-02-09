export const printReceipt = (invoice, format = '80mm', settings = {}) => {
    console.log(`Printing Invoice #${invoice.id} in ${format} format.`);
    console.log('Settings:', settings);
    console.log('Items:', invoice.items);
    // Implementation for react-native-thermal-receipt-printer or similar would go here
    // For now, we just log it.
    alert(`Printing Invoice #${invoice.id} (${format})`);
};
