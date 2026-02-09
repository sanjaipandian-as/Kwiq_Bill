import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Platform,
    Image,
    Dimensions,
    TextInput
} from 'react-native';
import {
    Upload,
    FileText,
    ExternalLink,
    ChevronDown,
    Calendar as CalendarIcon,
    Tag,
    CreditCard,
    AlignLeft,
    DollarSign,
    Briefcase
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useExpenses } from '../../context/ExpenseContext';
import {
    PAYMENT_METHODS,
    SAMPLE_CATEGORIES,
} from '../../utils/expenseConstants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FieldContainer = ({ label, children, icon: Icon, required }) => (
    <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
            {Icon && <Icon size={14} color="#64748b" style={{ marginRight: 6 }} />}
            <Text style={styles.fieldLabel}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
        </View>
        {children}
    </View>
);

const ExpenseModal = ({ isOpen, onClose, expense = null }) => {
    const { addExpense, updateExpense } = useExpenses();
    const isEditMode = !!expense;

    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        paymentMethod: 'Cash',
        reference: '',
        tags: [],
        isRecurring: false,
        frequency: 'one-time',
        nextDueDate: ''
    });

    const [receiptFile, setReceiptFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showReceiptConfirmation, setShowReceiptConfirmation] = useState(false);
    const [activePicker, setActivePicker] = useState(null);
    const [isReplacing, setIsReplacing] = useState(false);
    const [previewUri, setPreviewUri] = useState(null);

    useEffect(() => {
        if (expense) {
            setFormData({
                ...expense,
                amount: expense.amount ? String(expense.amount) : '',
                date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            });
        } else {
            setFormData({
                title: '',
                amount: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                paymentMethod: 'Cash',
                reference: '',
                tags: [],
                isRecurring: false,
                frequency: 'one-time',
                nextDueDate: ''
            });
        }
        setReceiptFile(null);
        setIsReplacing(false);
    }, [expense, isOpen]);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Gallery access is needed for receipts.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            const selectedUri = result.assets[0].uri;
            setReceiptFile(selectedUri);
            handleChange('receiptUrl', selectedUri);
        }
    };

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.amount || !formData.category) {
            Alert.alert('Required Fields', 'Please fill Title, Amount, and Category');
            return;
        }

        setIsSubmitting(true);
        try {
            const submissionData = { ...formData, receiptFile };
            if (isEditMode) {
                await updateExpense(expense.id, submissionData);
            } else {
                await addExpense(submissionData);
            }
            onClose();
        } catch (error) {
            console.error("Expense Save Error:", error);
            Alert.alert('Error', 'Failed to save expense.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSelect = (label, currentVal, options, onSelect, pickerKey, icon) => {
        const isPickerOpen = activePicker === pickerKey;
        return (
            <View style={[styles.fieldContainer, { zIndex: isPickerOpen ? 100 : 1 }]}>
                <Text style={styles.labelSmall}>{label}</Text>
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.selectTrigger, isPickerOpen && styles.selectTriggerActive]}
                    onPress={() => setActivePicker(isPickerOpen ? null : pickerKey)}
                >
                    <Text style={[styles.selectText, !currentVal && { color: '#94a3b8' }]}>
                        {currentVal || `Select ${label.replace('*', '').trim()}`}
                    </Text>
                    <ChevronDown size={20} color={isPickerOpen ? '#000' : '#64748b'} />
                </TouchableOpacity>
                {isPickerOpen && (
                    <View style={styles.optionsList}>
                        <ScrollView bounces={false} style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                            {options.map((opt, idx) => {
                                const val = typeof opt === 'string' ? opt : opt.value;
                                const optLabel = typeof opt === 'string' ? opt : opt.label;
                                return (
                                    <TouchableOpacity
                                        key={val}
                                        style={[styles.optionItem, idx === options.length - 1 && { borderBottomWidth: 0 }]}
                                        onPress={() => {
                                            onSelect(val);
                                            setActivePicker(null);
                                        }}
                                    >
                                        <Text style={[styles.dropdownItemText, currentVal === val && styles.dropdownItemTextActive]}>
                                            {optLabel}
                                        </Text>
                                        {currentVal === val && <View style={styles.activeDot} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
            </View>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Transaction' : 'Record Expense'}>
            <View style={styles.modalBody}>
                <ScrollView
                    style={styles.formScroll}
                    contentContainerStyle={styles.formScrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.formContainer}>
                        <View style={styles.fieldContainer}>
                            <Text style={styles.labelSmall}>EXPENSE TITLE <Text style={styles.required}>*</Text></Text>
                            <Input
                                value={formData.title}
                                onChangeText={(val) => handleChange('title', val)}
                                placeholder="Marketing / Inventory / Rent..."
                                style={styles.premiumInput}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1.2 }}>
                                <Text style={styles.labelSmall}>AMOUNT <Text style={styles.required}>*</Text></Text>
                                <Input
                                    value={formData.amount}
                                    onChangeText={(val) => handleChange('amount', val)}
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    style={[styles.premiumInput, styles.amountInput]}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                {renderSelect('CATEGORY *', formData.category, SAMPLE_CATEGORIES, (val) => handleChange('category', val), 'category')}
                            </View>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            {renderSelect('PAYMENT MODE', formData.paymentMethod, PAYMENT_METHODS, (val) => handleChange('paymentMethod', val), 'pMethod')}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.labelSmall}>TRANSACTION DATE</Text>
                            <Input
                                value={formData.date}
                                onChangeText={(val) => handleChange('date', val)}
                                placeholder="YYYY-MM-DD"
                                style={styles.premiumInput}
                            />
                        </View>
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.labelSmall}>NOTES & DESCRIPTION</Text>
                        <Input
                            value={formData.description}
                            onChangeText={(val) => handleChange('description', val)}
                            placeholder="Add business notes or reference IDs..."
                            multiline
                            numberOfLines={3}
                            style={[styles.premiumInput, styles.textArea]}
                        />
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.labelSmall}>RECEIPT / DOCUMENTATION</Text>
                        {isEditMode && expense?.receiptUrl && !receiptFile && !isReplacing ? (
                            <View style={styles.existingReceipt}>
                                <View style={styles.receiptHeader}>
                                    <View style={styles.attachedBadge}>
                                        <FileText size={12} color="#000" />
                                        <Text style={styles.receiptLabelText}>Attachment Found</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setPreviewUri(expense.receiptUrl)} style={styles.viewLink}>
                                        <ExternalLink size={14} color="#000" />
                                        <Text style={styles.viewLinkText}>Preview</Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setShowReceiptConfirmation(true)}
                                    style={styles.replaceBtn}
                                >
                                    <Text style={styles.replaceBtnText}>Replace with New File</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={handlePickImage}
                                style={[styles.uploadBox, receiptFile && styles.uploadBoxActive]}
                            >
                                {receiptFile ? (
                                    <View style={styles.previewActive}>
                                        <Image source={{ uri: receiptFile }} style={styles.miniPreview} />
                                        <View style={styles.previewInfo}>
                                            <Text style={styles.previewTitle}>Attachment Selected</Text>
                                            <Text style={styles.previewSub}>Click to change</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setReceiptFile(null)} style={styles.removeBtn}>
                                            <Text style={styles.removeBtnText}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <>
                                        <View style={styles.uploadIconBg}>
                                            <Upload size={24} color="#2563eb" />
                                        </View>
                                        <Text style={styles.uploadTitle}>Upload Receipt</Text>
                                        <Text style={styles.uploadSub}>PDF or Image (Max 5MB)</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        title="Cancel"
                        onPress={onClose}
                        variant="ghost"
                        style={styles.cancelBtn}
                    />
                    <Button
                        title={isSubmitting ? 'PROCESSING...' : (isEditMode ? 'UPDATE EXPENSE' : 'SAVE EXPENSE')}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        style={styles.saveBtnFull}
                    />
                </View>
            </View>

            <ConfirmationModal
                isOpen={showReceiptConfirmation}
                onClose={() => setShowReceiptConfirmation(false)}
                onConfirm={() => { setIsReplacing(true); setShowReceiptConfirmation(false); }}
                title="Replace Proof?"
                message="Are you sure you want to remove the current attachment? This action cannot be undone."
            />

            <Modal
                isOpen={!!previewUri}
                onClose={() => setPreviewUri(null)}
                title="Receipt Preview"
            >
                <View style={styles.proPreviewContainer}>
                    <Image
                        source={{ uri: previewUri }}
                        style={styles.proPreviewImage}
                    />
                </View>
            </Modal>
        </Modal>
    );
};

const styles = StyleSheet.create({
    contentWrapper: { maxHeight: SCREEN_HEIGHT * 0.8, backgroundColor: '#fff' },
    scrollView: { width: '100%' },
    scrollContent: { paddingVertical: 10, paddingBottom: 40 },
    formContainer: { paddingHorizontal: 24, gap: 24 },
    fieldContainer: { gap: 10 },
    labelSmall: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginLeft: 4 },
    required: { color: '#ef4444' },
    row: { flexDirection: 'row', gap: 16 },
    premiumInput: {
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52,
        fontWeight: '700',
        color: '#000'
    },
    amountInput: { fontSize: 18, color: '#ef4444' },
    textArea: { height: 100, textAlignVertical: 'top', paddingTop: 16 },
    selectTrigger: {
        height: 52,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    selectTriggerActive: { borderColor: '#000' },
    selectText: { fontSize: 15, fontWeight: '700', color: '#000' },
    optionsList: {
        position: 'absolute',
        top: 85,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#000',
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 15,
        zIndex: 9999,
        padding: 8
    },
    optionItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    optionText: { fontSize: 15, color: '#475569', fontWeight: '600' },
    optionTextActive: { color: '#000', fontWeight: '800' },

    existingReceipt: {
        padding: 20,
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        gap: 15
    },
    receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    attachedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    receiptLabelText: { fontSize: 11, fontWeight: '800', color: '#000', textTransform: 'uppercase' },
    viewLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    viewLinkText: { fontSize: 13, fontWeight: '800', color: '#000', textDecorationLine: 'underline' },
    replaceBtn: {
        height: 44,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff'
    },
    replaceBtnText: { fontSize: 12, fontWeight: '800', color: '#000', textTransform: 'uppercase' },

    footer: {
        flexDirection: 'row',
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1.5,
        borderTopColor: '#f1f5f9',
        gap: 12
    },
    cancelBtn: { flex: 1, height: 56, borderRadius: 18 },
    saveBtnFull: { flex: 2, height: 56, borderRadius: 18, backgroundColor: '#000' },

    previewContainer: { height: SCREEN_HEIGHT * 0.6, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', borderRadius: 24, overflow: 'hidden' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'contain' }
});

export default ExpenseModal;