import { Linking, Alert, Platform } from 'react-native';
// import Clipboard from '@react-native-clipboard/clipboard'; // User mentioned using this, need to check if installed or available. 
// If not available, we might need a fallback. React Native's Clipboard is deprecated, usually it's from @react-native-clipboard/clipboard or expo-clipboard.
// Since this is Expo (implied by expo-sqlite usage), we should use expo-clipboard.
import * as Clipboard from 'expo-clipboard';

/**
 * Generates a formatted WhatsApp message for the invoice
 */
export const generateWhatsAppMessage = (invoice, storeSettings) => {
    const storeName = storeSettings?.name || 'My Store';
    const customerName = invoice.customerName || 'Customer';
    const invoiceNo = invoice.invoiceNumber || invoice.id;
    // Format date properly
    const dateObj = new Date(invoice.date);
    const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString() : '';

    let message = `*${storeName}*\n`;
    message += `Invoice: ${invoiceNo}\n`;
    message += `Date: ${dateStr}\n\n`;
    message += `Hello ${customerName},\n`;
    message += `Thank you for shopping with us! Here are your bill details:\n\n`;

    // Items
    if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach(item => {
            message += `${item.name} x ${item.quantity} = ${item.total}\n`;
        });
    }

    message += `\n----------------\n`;
    message += `Subtotal: ${invoice.subtotal}\n`;
    if (invoice.discount > 0) message += `Discount: -${invoice.discount}\n`;
    if (invoice.tax > 0) message += `Tax: +${invoice.tax}\n`;
    message += `*Total: ${invoice.total}*\n`;
    message += `----------------\n\n`;
    message += `Thank you, visit again!`;

    return message;
};

/**
 * Sends a message via WhatsApp
 */
export const sendViaWhatsApp = async (mobile, message) => {
    if (!mobile) {
        Alert.alert("Error", "No mobile number provided");
        return;
    }

    // Clean mobile number
    let phone = mobile.replace(/[^0-9]/g, '');
    if (phone.length === 10) {
        phone = '91' + phone; // Default to India if 10 digits
    }

    const text = encodeURIComponent(message);
    const url = `whatsapp://send?phone=${phone}&text=${text}`;

    try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            // Fallback
            await Clipboard.setStringAsync(message);
            Alert.alert(
                "WhatsApp Not Installed",
                "Message copied to clipboard. You can paste it manually."
            );
        }
    } catch (err) {
        console.error("WhatsApp Error:", err);
        // Fallback on error
        await Clipboard.setStringAsync(message);
        Alert.alert("Error", "Could not open WhatsApp. Message copied to clipboard.");
    }
};
