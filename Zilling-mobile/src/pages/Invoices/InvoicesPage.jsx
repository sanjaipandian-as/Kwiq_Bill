import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Modal,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Search,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Download,
  Share2,
  Plus,
  X,
  Trash2,
  Eye
} from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSettings } from '../../context/SettingsContext';
import { printReceipt, shareReceiptPDF } from '../../utils/printUtils';
import { useTransactions } from '../../context/TransactionContext';
import { Card } from '../../components/ui/Card';

export default function InvoicesPage() {
  const navigation = useNavigation();
  const { transactions, loading, fetchTransactions, updateTransaction, addTransaction, deleteTransaction, clearAllTransactions } = useTransactions();
  // Using direct DB access for customer lookup to avoid context overhead or circular deps if any
  const { db } = require('../../services/database');
  const { settings } = useSettings(); // Get settings for print/share
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [])
  );

  const handlePreview = async (invoice) => {
    try {
      const billData = {
        ...invoice,
        id: invoice.id,
        weekly_sequence: invoice.weekly_sequence,
        cart: invoice.items || [],
        totals: {
          total: invoice.total || 0,
          subtotal: invoice.subtotal || 0,
          tax: invoice.tax || 0,
          discount: invoice.discount || 0,
          additionalCharges: invoice.additionalCharges || 0,
          roundOff: invoice.roundOff || 0
        },
        customer: {
          name: invoice.customerName
        },
        date: invoice.date
      };

      // Force A4 for System Preview (Invoice Mode)
      // This ensures we see the "Invoice Template" view, not the Thermal Bill view
      await printReceipt(billData, 'A4', settings);
    } catch (error) {
      console.error("Preview Error:", error);
      alert("Failed to preview invoice");
    }
  };

  const handleShare = async (invoice) => {
    try {
      // Map for print utility
      const billData = {
        ...invoice,
        id: invoice.id,
        weekly_sequence: invoice.weekly_sequence,
        cart: invoice.items || [],
        totals: {
          total: invoice.total || 0,
          subtotal: invoice.subtotal || 0,
          tax: invoice.tax || 0,
          discount: invoice.discount || 0,
          additionalCharges: invoice.additionalCharges || 0,
          roundOff: invoice.roundOff || 0
        },
        customer: {
          name: invoice.customerName
        },
        date: invoice.date
      };

      // Force A4/Template for Invoice Share (Internal Record)
      const invoiceSettings = {
        ...settings,
        invoice: {
          ...settings.invoice,
          paperSize: 'A4' // Force A4 to use the selected Template (Classic, GST, etc.)
        }
      };

      await shareReceiptPDF(billData, invoiceSettings);
    } catch (error) {
      console.error("Share Error:", error);
      alert("Failed to share invoice");
    }
  };

  const handleDelete = (invoice) => {
    // Confirmation
    // For simplicity using alert, but UI/Modal is better. 
    // Since we are in a modal workflow, let's use the native alert for confirmation before calling context.
    // If we had a custom ConfirmationModal component we could use that.

    // We can use the existing ConfirmationModal logic if available or just native Alert
    // Native Alert for speed as per standard React Native patterns
    const Alert = require('react-native').Alert;
    Alert.alert(
      "Delete Invoice",
      "Are you sure you want to delete this invoice? This action cannot be undone and will restore stock.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTransaction(invoice.id);
              setDetailModalVisible(false);
              // fetchTransactions(); // Context usually updates state automatically
            } catch (err) {
              alert("Failed to delete");
            }
          }
        }
      ]
    );
  };

  // ... (edit handlers remain same)

  const handleAddPress = () => {
    setEditingInvoice({
      id: `NEW-${Date.now()}`,
      customerName: '',
      total: 0,
      status: 'PAID',
      date: new Date().toISOString()
    });
    setEditModalVisible(true);
  };

  const handleInvoicePress = (invoice) => {
    // Lookup customer details if not present
    let fullCustomer = null;
    try {
      if (invoice.customerId) {
        const res = db.getAllSync('SELECT * FROM customers WHERE id = ?', [invoice.customerId]);
        if (res && res.length > 0) fullCustomer = res[0];
      } else if (invoice.customerName && invoice.customerName !== 'Walk-in Customer') {
        // Fallback by name
        const res = db.getAllSync('SELECT * FROM customers WHERE name = ?', [invoice.customerName]);
        if (res && res.length > 0) fullCustomer = res[0];
      }
    } catch (e) { console.log("Cust Lookup Error", e); }

    setSelectedInvoice({ ...invoice, fullCustomer });
    setDetailModalVisible(true);
  };

  const handleEditPress = (invoice) => {
    // If coming from details modal, close it first or keep it? 
    // Usually editing replaces details.
    setDetailModalVisible(false);
    setEditingInvoice({ ...invoice });
    setEditModalVisible(true);
  };

  // ... (handleSaveEdit remains same)
  const handleSaveEdit = async () => {
    try {
      const targetId = editingInvoice.id || editingInvoice._id;
      const isNew = !targetId || targetId.toString().startsWith('NEW-');

      // Ensure we have a clean string for the name
      const finalName = editingInvoice.customerName && editingInvoice.customerName.trim() !== ''
        ? editingInvoice.customerName
        : 'Walk-in Customer';

      if (isNew) {
        await addTransaction({
          ...editingInvoice,
          id: undefined, // Let DB generate ID
          customerName: finalName,
          date: new Date().toISOString()
        });
      } else {
        // Pass the object exactly as the Context expects it
        await updateTransaction({
          ...editingInvoice,
          id: targetId,
          customerName: finalName
        });
      }

      setEditModalVisible(false);
      fetchTransactions();
    } catch (error) {
      console.error("Save Error:", error);
      alert("Error saving: " + error.message);
    }
  };

  // ... filters ...
  const filteredInvoices = transactions.filter(inv => {
    const invId = inv.id || '';
    const weeklyNo = inv.weekly_sequence?.toString() || '';
    const customer = inv.customerName || inv.customer || '';
    const matchesSearch = invId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      weeklyNo.includes(searchTerm) ||
      customer.toLowerCase().includes(searchTerm.toLowerCase());
    const status = inv.status ? (inv.status.charAt(0) + inv.status.slice(1).toLowerCase()) : 'Pending';
    const matchesFilter = activeFilter === 'All' || status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return { bg: '#ffffff', border: '#10b981', text: '#10b981', icon: CheckCircle2, label: 'Paid' };
      case 'UNPAID': return { bg: '#ffffff', border: '#ef4444', text: '#ef4444', icon: Clock, label: 'Unpaid' };
      default: return { bg: '#ffffff', border: '#000000', text: '#000000', icon: FileText, label: status || 'Unknown' };
    }
  };

  const stats = [
    { label: 'Total Revenue', value: `₹${transactions.reduce((sum, t) => sum + (t.total || 0), 0).toLocaleString()}`, icon: TrendingUp, color: '#000000', bg: '#f8fafc' },
    { label: 'Unpaid', value: `₹${transactions.filter(t => t.status !== 'PAID').reduce((sum, t) => sum + (t.balance || 0), 0).toLocaleString()}`, icon: Clock, color: '#ef4444', bg: '#fffafa' },
    { label: 'Paid', value: `₹${transactions.filter(t => t.status === 'PAID').reduce((sum, t) => sum + (t.total || 0), 0).toLocaleString()}`, icon: CheckCircle2, color: '#10b981', bg: '#f0fdf4' },
  ];

  const handlePrint = async (invoice) => {
    try {
      // Adapt invoice data for print templates
      const billData = {
        ...invoice,
        id: invoice.id,
        weekly_sequence: invoice.weekly_sequence,
        items: invoice.items || [], // IMPORTANT
        customerName: invoice.customerName || 'Walk-in Customer',
        date: invoice.date,
        total: invoice.total,
        subtotal: invoice.subtotal || 0,
        tax: invoice.tax || 0,
        discount: invoice.discount || 0,
        additionalCharges: invoice.additionalCharges || 0,
        roundOff: invoice.roundOff || 0,
        internalNotes: invoice.internalNotes || '',
      };

      await printReceipt(billData, settings);
    } catch (err) {
      console.error('Print error', err);
      alert('Failed to print invoice');
    }
  };


  const renderInvoiceItem = ({ item }) => {
    const status = getStatusStyle(item.status);
    const StatusIcon = status.icon;

    return (
      <View style={styles.invoiceCard}>
        <Pressable style={styles.cardPressable} onPress={() => handleInvoicePress(item)}>
          <View style={styles.cardTopRow}>
            <View style={styles.invoiceInfo}>
              <Text style={styles.invoiceId}>{item.invoiceNumber || item._id?.toString().slice(-6).toUpperCase() || 'INV-TEMP'}</Text>
              <Text style={styles.customerName} numberOfLines={1}>{item.customerName || 'Walk-in Customer'}</Text>
              <Text style={styles.invoiceDate}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>

            <View style={styles.cardTopRight}>
              <Text style={styles.amount}>₹{(item.total || 0).toLocaleString()}</Text>
              <View style={styles.actionRowTop}>
                <Pressable onPress={() => handlePrint(item)} style={styles.miniActionBtn}>
                  <Download size={20} color="#000" strokeWidth={2} />
                </Pressable>
                <Pressable onPress={() => handleShare(item)} style={styles.miniActionBtn}>
                  <Share2 size={20} color="#000" strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.cardBottomRow}>
            <View style={[styles.statusBadge, { borderColor: status.border, height: 42 }]}>
              <StatusIcon size={16} color={status.text} strokeWidth={2.5} />
              <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
            </View>

            <TouchableOpacity
              onPress={() => handlePreview(item)}
              activeOpacity={0.7}
              style={[styles.previewActionBtn, { flex: 1, marginLeft: 12, height: 42 }]}
            >
              <Eye size={18} color="#000" strokeWidth={2} />
              <Text style={styles.previewActionText}>PREVIEW INVOICE</Text>
            </TouchableOpacity>
          </View>
        </Pressable >
      </View >
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}><ChevronLeft size={28} color="#000" /></Pressable>
            <Text style={styles.title}>Invoices</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={handleAddPress}><Plus size={24} color="#000" /></Pressable>
            <Pressable style={[styles.iconBtn, { borderColor: '#ef4444' }]} onPress={clearAllTransactions}>
              <Trash2 size={24} color="#ef4444" />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#64748b" strokeWidth={2.5} />
            <Input
              style={[styles.searchInputCustom, { borderWidth: 0, backgroundColor: 'transparent' }]}
              placeholder="Search by ID or customer name..."
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          {['All', 'Paid', 'Unpaid'].map(status => (
            <Pressable
              key={status}
              style={[styles.filterBtn, activeFilter === status && styles.filterBtnActive]}
              onPress={() => setActiveFilter(status)}
            >
              <Text style={[styles.filterText, activeFilter === status && styles.filterTextActive]}>{status}</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={filteredInvoices}
          keyExtractor={(item, index) => item.id ? item.id.toString() : `inv-${index}`}
          renderItem={renderInvoiceItem}
          contentContainerStyle={styles.listContainer}
        />

        {/* --- DETAILS MODAL --- */}
        <Modal visible={isDetailModalVisible} animationType="slide" transparent={true} onRequestClose={() => setDetailModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIndicator} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Invoice Summary</Text>
                <Pressable onPress={() => setDetailModalVisible(false)}><X size={24} color="#000" /></Pressable>
              </View>

              {selectedInvoice && (
                <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                  {/* Status & ID Header */}
                  <View style={styles.summaryTopCard}>
                    <View style={styles.summaryTopMain}>
                      <View>
                        <Text style={styles.summaryIdLabel}>INVOICE NO</Text>
                        <Text style={styles.summaryIdValue}>{selectedInvoice.invoiceNumber || selectedInvoice.id}</Text>
                      </View>
                      <View style={[
                        styles.modernStatusBadge,
                        { backgroundColor: selectedInvoice.status === 'PAID' ? '#ecfdf5' : '#fef2f2' }
                      ]}>
                        <View style={[
                          styles.statusDot,
                          { backgroundColor: selectedInvoice.status === 'PAID' ? '#10b981' : '#ef4444' }
                        ]} />
                        <Text style={[
                          styles.modernStatusText,
                          { color: selectedInvoice.status === 'PAID' ? '#059669' : '#dc2626' }
                        ]}>{selectedInvoice.status}</Text>
                      </View>
                    </View>

                    <View style={styles.summaryMetaRow}>
                      <View style={styles.metaItem}>
                        <Clock size={14} color="#64748b" />
                        <Text style={styles.metaText}>{new Date(selectedInvoice.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <TrendingUp size={14} color="#64748b" />
                        <Text style={styles.metaText}>Sales Category</Text>
                      </View>
                    </View>
                  </View>

                  {/* Customer Info */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Customer Details</Text>
                  </View>
                  <View style={styles.customerCard}>
                    <View style={styles.customerAvatar}>
                      <Text style={styles.avatarText}>{(selectedInvoice.customerName || 'W').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.customerInfo}>
                      <Text style={styles.customerNameMain}>{selectedInvoice.customerName || 'Walk-in Customer'}</Text>
                      {selectedInvoice.fullCustomer ? (
                        <View style={styles.customerMeta}>
                          <Text style={styles.customerSubText}>{selectedInvoice.fullCustomer.phone}</Text>
                          {selectedInvoice.fullCustomer.email && <Text style={styles.customerSubText}> • {selectedInvoice.fullCustomer.email}</Text>}
                        </View>
                      ) : (
                        <Text style={styles.customerSubText}>Standard Billing</Text>
                      )}
                    </View>
                  </View>

                  {/* Bill Items */}
                  <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                    <Text style={styles.sectionTitle}>Bill Items</Text>
                    <Text style={styles.itemCountText}>{selectedInvoice.items?.length || 0} Items</Text>
                  </View>

                  <View style={styles.itemsContainer}>
                    {selectedInvoice.items && selectedInvoice.items.map((item, index) => (
                      <View key={index} style={[styles.modernItemRow, index === selectedInvoice.items.length - 1 && { borderBottomWidth: 0 }]}>
                        <View style={styles.itemMainInfo}>
                          <Text style={styles.modernItemName}>{item.name}</Text>
                          <Text style={styles.modernItemPricePer}>₹{item.price?.toFixed(2)} × {item.quantity}</Text>
                        </View>
                        <Text style={styles.modernItemTotal}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Calculation Details */}
                  <View style={styles.modernTotalCard}>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Subtotal</Text>
                      <Text style={styles.calcValue}>₹{selectedInvoice.subtotal?.toFixed(2) || '0.00'}</Text>
                    </View>

                    {selectedInvoice.tax > 0 && (
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Tax (Included)</Text>
                        <Text style={styles.calcValue}>₹{selectedInvoice.tax.toFixed(2)}</Text>
                      </View>
                    )}

                    {selectedInvoice.discount > 0 && (
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Discount Saved</Text>
                        <Text style={[styles.calcValue, { color: '#ef4444' }]}>-₹{selectedInvoice.discount.toFixed(2)}</Text>
                      </View>
                    )}

                    {selectedInvoice.additionalCharges > 0 && (
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Extra Charges</Text>
                        <Text style={styles.calcValue}>+₹{selectedInvoice.additionalCharges.toFixed(2)}</Text>
                      </View>
                    )}

                    <View style={styles.modernNetTotalRow}>
                      <View>
                        <Text style={styles.netTotalLabel}>NET TOTAL</Text>
                        <Text style={styles.netTotalSub}>Inclusive of all taxes</Text>
                      </View>
                      <Text style={styles.netTotalValue}>₹{selectedInvoice.total?.toFixed(2)}</Text>
                    </View>
                  </View>

                  {selectedInvoice.internalNotes && selectedInvoice.internalNotes.trim() !== '' && (
                    <View style={styles.remarksBox}>
                      <View style={styles.remarksHeader}>
                        <FileText size={16} color="#854d0e" />
                        <Text style={styles.remarksTitle}>REMARKS</Text>
                      </View>
                      <Text style={styles.remarksText}>{selectedInvoice.internalNotes}</Text>
                    </View>
                  )}

                  <View style={styles.modernActionGrid}>
                    <TouchableOpacity style={styles.modernActionBtn} onPress={() => handleEditPress(selectedInvoice)}>
                      <View style={[styles.actionIconContainer, { backgroundColor: '#f1f5f9' }]}>
                        <FileText size={20} color="#000" />
                      </View>
                      <Text style={styles.modernActionText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.modernActionBtn} onPress={() => handlePrint(selectedInvoice)}>
                      <View style={[styles.actionIconContainer, { backgroundColor: '#f1f5f9' }]}>
                        <Download size={20} color="#000" />
                      </View>
                      <Text style={styles.modernActionText}>Save PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modernActionBtn}
                      onPress={() => handleDelete(selectedInvoice)}
                    >
                      <View style={[styles.actionIconContainer, { backgroundColor: '#fef2f2' }]}>
                        <Trash2 size={20} color="#ef4444" />
                      </View>
                      <Text style={[styles.modernActionText, { color: '#ef4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ height: 40 }} />
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalIndicator} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Modify Invoice</Text>
                <Pressable onPress={() => setEditModalVisible(false)}><X size={24} color="#000" /></Pressable>
              </View>

              {editingInvoice && (
                <>
                  <ScrollView style={styles.editForm} showsVerticalScrollIndicator={false}>
                    <Text style={styles.inputLabel}>Customer Name</Text>
                    <Input
                      value={editingInvoice.customerName}
                      onChangeText={(val) => setEditingInvoice({ ...editingInvoice, customerName: val })}
                      style={{ marginBottom: 20 }}
                      placeholder="e.g. John Doe"
                    />

                    <Text style={styles.inputLabel}>Total Amount (₹)</Text>
                    <Input
                      keyboardType="numeric"
                      value={editingInvoice.total?.toString()}
                      onChangeText={(val) => setEditingInvoice({ ...editingInvoice, total: parseFloat(val) || 0 })}
                      style={{ marginBottom: 20 }}
                    />

                    <Text style={styles.inputLabel}>Payment Status</Text>
                    <View style={styles.statusSelector}>
                      {['PAID', 'UNPAID'].map(status => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusOption,
                            editingInvoice.status === status && styles.statusOptionActive
                          ]}
                          onPress={() => setEditingInvoice({ ...editingInvoice, status })}
                        >
                          <Text style={[
                            styles.statusOptionText,
                            editingInvoice.status === status && styles.statusOptionTextActive
                          ]}>
                            {status === 'PAID' ? 'PAID' : 'UNPAID'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={{ height: 30 }} />
                  </ScrollView>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                      <Text style={{ color: '#000', fontWeight: '800' }}>DISCARD</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                      <Text style={styles.savetxt}>
                        {editingInvoice?.id?.toString().startsWith('NEW-') ? "CREATE INVOICE" : "UPDATE INVOICE"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 10
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { padding: 4 },
  title: { fontSize: 32, fontWeight: '900', color: '#000', letterSpacing: -1 },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000'
  },

  searchContainer: { marginBottom: 20 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    borderColor: '#e2e8f0',
    borderWidth: 1.5
  },
  searchInputCustom: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontWeight: '700',
    paddingLeft: 10,
    height: '100%'
  },

  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  filterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0'
  },
  filterBtnActive: { backgroundColor: '#000', borderColor: '#000' },
  filterText: { fontSize: 14, fontWeight: '800', color: '#64748b' },
  filterTextActive: { color: '#fff' },

  listContainer: { paddingBottom: 40 },
  invoiceCard: {
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff'
  },
  cardPressable: { padding: 18 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  invoiceInfo: { flex: 1, gap: 4 },
  cardTopRight: { alignItems: 'flex-end', gap: 10 },

  invoiceId: { fontSize: 11, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  customerName: { fontSize: 18, fontWeight: '900', color: '#000', letterSpacing: -0.5 },
  invoiceDate: { fontSize: 13, fontWeight: '600', color: '#cbd5e1' },

  amount: { fontSize: 22, fontWeight: '900', color: '#000' },

  actionRowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },

  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderTopColor: '#f8fafc',
    paddingTop: 16
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
    minWidth: 100,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },

  previewActionBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#000',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  previewActionText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.8
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    width: '100%',
    maxHeight: '90%',
    paddingTop: 8
  },
  modalIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1.5,
    borderColor: '#f1f5f9'
  },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#000' },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#000', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  editForm: { padding: 24 },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1.5,
    borderColor: '#f1f5f9',
    gap: 12,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000',
    borderRadius: 14,
    backgroundColor: 'white'
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  savetxt: { color: 'white', fontWeight: '800', fontSize: 16 },

  detailScroll: { padding: 20 },
  summaryTopCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryTopMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  summaryIdLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryIdValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -0.5,
  },
  modernStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modernStatusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#f8fafc',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 20,
    gap: 16,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  customerInfo: {
    flex: 1,
  },
  customerNameMain: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    marginBottom: 2,
  },
  customerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerSubText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },

  itemsContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  modernItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemMainInfo: {
    flex: 1,
    gap: 2,
  },
  modernItemName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
  modernItemPricePer: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  modernItemTotal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000',
  },

  modernTotalCard: {
    marginTop: 24,
    backgroundColor: '#fafafa',
    padding: 20,
    borderRadius: 24,
    gap: 12,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  calcValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  modernNetTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#e2e8f0',
  },
  netTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  netTotalSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  netTotalValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10b981',
  },

  remarksBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  remarksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  remarksTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#854d0e',
    letterSpacing: 1,
  },
  remarksText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  modernActionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  modernActionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  modernActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },

  statusSelector: { flexDirection: 'row', gap: 12, marginTop: 10 },
  statusOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0'
  },
  statusOptionActive: { backgroundColor: '#000', borderColor: '#000' },
  statusOptionText: { fontSize: 14, fontWeight: '800', color: '#64748b' },
  statusOptionTextActive: { color: '#fff' }
});