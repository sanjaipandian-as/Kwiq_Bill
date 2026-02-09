import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export const DiscountModal = ({ isOpen, onClose, onApply, title = "Apply Discount", initialValue = 0, isPercentage = false }) => {
    const [value, setValue] = useState(initialValue.toString());
    const [mode, setMode] = useState(isPercentage ? 'percent' : 'amount');

    useEffect(() => {
        if (isOpen) setValue(initialValue.toString());
    }, [isOpen, initialValue]);

    const handleSubmit = () => {
        onApply(parseFloat(value) || 0, mode === 'percent');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <View style={styles.container}>
                <View style={styles.segmentControl}>
                    <TouchableOpacity
                        style={[styles.segmentBtn, mode === 'amount' && styles.segmentBtnActive]}
                        onPress={() => setMode('amount')}
                    >
                        <Text style={[styles.segmentText, mode === 'amount' && styles.segmentTextActive]}>Value (₹)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segmentBtn, mode === 'percent' && styles.segmentBtnActive]}
                        onPress={() => setMode('percent')}
                    >
                        <Text style={[styles.segmentText, mode === 'percent' && styles.segmentTextActive]}>Percent (%)</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputSection}>
                    <Text style={styles.labelTitle}>ENTER DISCOUNT</Text>
                    <Input
                        keyboardType="numeric"
                        value={value}
                        onChangeText={setValue}
                        style={styles.premiumInput}
                        placeholder="0.00"
                    />
                    <View style={styles.presetGrid}>
                        {(mode === 'percent' ? [5, 10, 15, 20] : [50, 100, 200, 500]).map(p => (
                            <TouchableOpacity
                                key={p}
                                style={styles.chip}
                                onPress={() => setValue(p.toString())}
                            >
                                <Text style={styles.chipText}>{mode === 'percent' ? `${p}%` : `₹${p}`}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.actionBtn} onPress={handleSubmit}>
                    <Text style={styles.actionBtnText}>Apply Discount</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

export const AdditionalChargesModal = ({ isOpen, onClose, onApply, initialValue = 0 }) => {
    const [value, setValue] = useState(initialValue.toString());

    useEffect(() => {
        if (isOpen) setValue(initialValue.toString());
    }, [isOpen, initialValue]);

    const handleSubmit = () => {
        onApply(parseFloat(value) || 0);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Service Charges">
            <View style={styles.container}>
                <View style={styles.inputSection}>
                    <Text style={styles.labelTitle}>EXTRA CHARGES (₹)</Text>
                    <Input
                        keyboardType="numeric"
                        value={value}
                        onChangeText={setValue}
                        style={styles.premiumInput}
                        placeholder="0.00"
                    />
                    <View style={styles.presetGrid}>
                        {[10, 20, 50, 100].map(p => (
                            <TouchableOpacity
                                key={p}
                                style={styles.chip}
                                onPress={() => setValue(p.toString())}
                            >
                                <Text style={styles.chipText}>₹{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.actionBtn} onPress={handleSubmit}>
                    <Text style={styles.actionBtnText}>Apply Charges</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

export const LoyaltyPointsModal = ({ isOpen, onClose, onApply, availablePoints = 0 }) => {
    const [pointsToRedeem, setPointsToRedeem] = useState('');
    const conversionRate = 1.0;

    useEffect(() => {
        if (isOpen) setPointsToRedeem('');
    }, [isOpen]);

    const handleSubmit = () => {
        const redeeem = parseInt(pointsToRedeem) || 0;
        if (redeeem > availablePoints) {
            alert(`Insufficient balance: ${availablePoints} pts available`);
            return;
        }
        onApply(redeeem * conversionRate);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Loyalty Reward">
            <View style={styles.container}>
                <View style={styles.loyaltyHeader}>
                    <Text style={styles.loyaltyTitle}>Available Balance</Text>
                    <Text style={styles.loyaltyValue}>{availablePoints} pts</Text>
                </View>

                <View style={styles.inputSection}>
                    <Text style={styles.labelTitle}>POINTS TO REDEEM</Text>
                    <Input
                        keyboardType="numeric"
                        value={pointsToRedeem}
                        onChangeText={setPointsToRedeem}
                        style={styles.premiumInput}
                        placeholder="0"
                    />
                    <Text style={styles.rewardHint}>
                        Savings Value: <Text style={{ color: '#000' }}>₹{((parseFloat(pointsToRedeem) || 0) * conversionRate).toFixed(0)}</Text>
                    </Text>
                </View>

                <TouchableOpacity style={styles.actionBtn} onPress={handleSubmit}>
                    <Text style={styles.actionBtnText}>Redeem Reward</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

export const RemarksModal = ({ isOpen, onClose, onSave, initialValue = "" }) => {
    const [text, setText] = useState(initialValue);

    useEffect(() => {
        if (isOpen) setText(initialValue);
    }, [isOpen, initialValue]);

    const handleSubmit = () => {
        onSave(text);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Bill Note">
            <View style={styles.container}>
                <View style={styles.inputSection}>
                    <Text style={styles.labelTitle}>BILL REMARKS</Text>
                    <Input
                        value={text}
                        onChangeText={setText}
                        style={styles.premiumInputArea}
                        placeholder="Special instructions..."
                        multiline
                        numberOfLines={4}
                    />
                    <View style={styles.presetGrid}>
                        {['Fragile', 'Paid', 'Gift', 'URGENT'].map(note => (
                            <TouchableOpacity
                                key={note}
                                style={styles.chip}
                                onPress={() => setText(note)}
                            >
                                <Text style={styles.chipText}>{note}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.actionBtn} onPress={handleSubmit}>
                    <Text style={styles.actionBtnText}>Save Remarks</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { gap: 24, paddingBottom: 8 },

    segmentControl: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 16, padding: 4 },
    segmentBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
    segmentBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    segmentText: { color: '#94a3b8', fontSize: 13, fontWeight: '800' },
    segmentTextActive: { color: '#000' },

    inputSection: { gap: 12 },
    labelTitle: { fontSize: 10, fontWeight: '900', color: '#cbd5e1', letterSpacing: 1.5 },
    premiumInput: { backgroundColor: '#f8fafc', height: 64, borderRadius: 20, fontSize: 24, fontWeight: '900', color: '#000', paddingHorizontal: 20, textAlign: 'right', borderWidth: 1.5, borderColor: '#f1f5f9' },
    premiumInputArea: { backgroundColor: '#f8fafc', height: 100, borderRadius: 20, fontSize: 16, fontWeight: '700', color: '#000', padding: 16, borderWidth: 1.5, borderColor: '#f1f5f9', textAlignVertical: 'top' },

    presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    chip: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#f1f5f9' },
    chipText: { fontSize: 13, fontWeight: '800', color: '#475569' },

    loyaltyHeader: { backgroundColor: '#f0fdf4', padding: 24, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#dcfce7' },
    loyaltyTitle: { fontSize: 14, fontWeight: '700', color: '#166534' },
    loyaltyValue: { fontSize: 20, fontWeight: '900', color: '#15803d' },
    rewardHint: { textAlign: 'right', fontSize: 12, fontWeight: '800', color: '#94a3b8', marginTop: 4 },

    actionBtn: { backgroundColor: '#000', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
