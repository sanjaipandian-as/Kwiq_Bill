import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { X, Send, Copy, check } from 'lucide-react-native';
import { generateWhatsAppMessage, sendViaWhatsApp } from '../utils/invoiceMessaging';
import { useSettings } from '../context/SettingsContext';

export default function InvoiceDeliveryModal({ isOpen, onClose, invoice }) {
    const { settings } = useSettings();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen && invoice) {
            // Generate message when modal opens
            const msg = generateWhatsAppMessage(invoice, settings?.store);
            setMessage(msg);
        }
    }, [isOpen, invoice]);

    const handleSend = async () => {
        if (!invoice?.customerMobile && !invoice?.customer?.phone) {
            // Fallback or error?
            // Should have been captured.
            alert("No mobile number found for customer");
            return;
        }

        const mobile = invoice.customerMobile || invoice.customer?.phone;
        setSending(true);
        await sendViaWhatsApp(mobile, message);
        setSending(false);
        onClose();
    };

    if (!isOpen || !invoice) return null;

    // Get customer details safely
    const custName = invoice.customerName || invoice.customer?.name || 'Customer';
    const custPhone = invoice.customerMobile || invoice.customer?.phone || '--';

    return (
        <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Send size={20} color="white" />
                            <Text style={styles.headerTitle}>Send Invoice via WhatsApp</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    <ScrollView style={styles.body}>
                        {/* Customer Card */}
                        <View style={styles.customerCard}>
                            <Text style={styles.cardLabel}>Sending to:</Text>
                            <Text style={styles.custName}>{custName}</Text>
                            <Text style={styles.custPhone}>+91 {custPhone}</Text>
                        </View>

                        {/* Message Preview */}
                        <Text style={styles.previewLabel}>Message Preview:</Text>
                        <View style={styles.messageBox}>
                            <Text style={styles.messageText}>{message}</Text>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
                            <Text style={styles.btnCancelText}>Skip</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnSend} onPress={handleSend} disabled={sending}>
                            {sending ? <ActivityIndicator color="#fff" /> : <Send size={18} color="#fff" />}
                            <Text style={styles.btnSendText}>Send via WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    container: { width: '100%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },

    header: { backgroundColor: '#25D366', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

    body: { padding: 20 },

    customerCard: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#dcfce7' },
    cardLabel: { fontSize: 12, color: '#166534', marginBottom: 4 },
    custName: { fontSize: 16, fontWeight: '700', color: '#14532d' },
    custPhone: { fontSize: 14, color: '#15803d' },

    previewLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8 },
    messageBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', minHeight: 100 },
    messageText: { fontSize: 13, color: '#334155', lineHeight: 20, fontFamily:  'monospace' },

    footer: { padding: 16, borderTopWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', gap: 12 },
    btnCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
    btnCancelText: { color: '#64748b', fontWeight: '600' },

    btnSend: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: '#25D366', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnSendText: { color: '#fff', fontWeight: '700' }
});
