import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CreditCard, Banknote, Smartphone, CheckCircle2, QrCode } from 'lucide-react-native';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';

const PaymentStep = ({ totals, paymentMode, amountReceived, onPaymentChange, onFinish }) => {
    const modes = [
        { id: 'Cash', label: 'Cash', icon: Banknote, color: '#16a34a' },
        { id: 'UPI', label: 'UPI / QR', icon: QrCode, color: '#9333ea' },
        { id: 'Card', label: 'Card', icon: CreditCard, color: '#2563eb' },
        { id: 'Digital', label: 'Digital Wallet', icon: Smartphone, color: '#f59e0b' },
    ];

    const change = Math.max(0, (parseFloat(amountReceived) || 0) - totals.total);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Payable Amount</Text>
                <Text style={styles.summaryValue}>₹{totals.total.toFixed(2)}</Text>
            </View>

            <Text style={styles.sectionTitle}>Select Payment method</Text>
            <View style={styles.modesGrid}>
                {modes.map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = paymentMode === mode.id;
                    return (
                        <TouchableOpacity
                            key={mode.id}
                            style={[styles.modeCard, isSelected && { borderColor: mode.color, backgroundColor: mode.color + '10' }]}
                            onPress={() => onPaymentChange('mode', mode.id)}
                        >
                            <View style={[styles.iconBox, { backgroundColor: mode.color + '20' }]}>
                                <Icon size={24} color={mode.color} />
                            </View>
                            <Text style={[styles.modeLabel, isSelected && { color: mode.color, fontWeight: 'bold' }]}>{mode.label}</Text>
                            {isSelected && <CheckCircle2 size={18} color={mode.color} style={styles.check} />}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.inputSection}>
                <Text style={styles.label}>Amount Received</Text>
                <Input
                    keyboardType="numeric"
                    value={amountReceived.toString()}
                    onChangeText={(v) => onPaymentChange('amount', v)}
                    style={styles.amountInput}
                    placeholder="0.00"
                />

                {parseFloat(amountReceived || 0) > 0 && (
                    <View style={styles.changeBox}>
                        <Text style={styles.changeLabel}>Change to Return</Text>
                        <Text style={styles.changeValue}>₹{change.toFixed(2)}</Text>
                    </View>
                )}
            </View>

            <Button size="lg" onPress={onFinish} style={styles.finishBtn}>
                <Text style={styles.finishBtnText}>Confirm & Complete Payment</Text>
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 16 },
    summaryCard: { backgroundColor: '#1e293b', padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 24 },
    summaryLabel: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
    summaryValue: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 16 },
    modesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    modeCard: { width: '48%', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', position: 'relative' },
    iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    modeLabel: { fontSize: 14, color: '#64748b' },
    check: { position: 'absolute', top: 8, right: 8 },
    inputSection: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
    label: { fontSize: 14, color: '#64748b', marginBottom: 8 },
    amountInput: { height: 60, fontSize: 24, fontWeight: 'bold' },
    changeBox: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between' },
    changeLabel: { color: '#64748b', fontSize: 14 },
    changeValue: { color: '#16a34a', fontSize: 18, fontWeight: 'bold' },
    finishBtn: { height: 56, borderRadius: 12, backgroundColor: '#16a34a' },
    finishBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default PaymentStep;
