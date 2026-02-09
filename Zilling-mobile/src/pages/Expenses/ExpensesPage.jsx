import React, { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Calendar,
  Receipt,
  FileText,
  TrendingDown,
  ChevronLeft,
  Download,
  Check,
  ArrowRight,
  Share2,
  TrendingUp,
  Wallet,
  PieChart,
  ArrowUpRight
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useExpenses } from '../../context/ExpenseContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import ExpenseModal from './ExpenseModal';
import { CategoryFilter } from '../../components/Expenses/CategoryFilter';
import { BulkActionsToolbar } from '../../components/Expenses/BulkActionsToolbar';
import { SAMPLE_CATEGORIES } from '../../utils/expenseConstants';
import { shareExpensesPDF } from '../../utils/exportUtils';
import { fetchAllTableData } from '../../services/database';
import { exportToDeviceFolders } from '../../services/backupservices';

const { width } = Dimensions.get('window');

const SummaryCard = ({ title, amount, icon: Icon, color, trend }) => (
  <View style={styles.summaryCard}>
    <View style={[styles.summaryIconContainer, { backgroundColor: color + '15' }]}>
      <Icon size={20} color={color} />
    </View>
    <View style={styles.summaryContent}>
      <Text style={styles.summaryLabel}>{title}</Text>
      <Text style={styles.summaryAmount}>₹{amount.toLocaleString()}</Text>
      {trend && (
        <View style={styles.trendRow}>
          <TrendingUp size={12} color="#22c55e" />
          <Text style={styles.trendText}>{trend}</Text>
        </View>
      )}
    </View>
  </View>
);

export default function ExpensesPage() {
  const navigation = useNavigation();
  const {
    expenses,
    loading,
    fetchExpenses,
    deleteExpense,
    bulkUpdateExpenses,
    bulkDeleteExpenses,
  } = useExpenses();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Selection Logic
  const toggleSelectExpense = (id) => {
    setSelectedExpenses(prev =>
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedExpenses([]);

  const handleBulkExport = async () => {
    setIsExporting(true);
    try {
      const allData = await fetchAllTableData();
      const result = await exportToDeviceFolders(allData);
      if (result.success) {
        Alert.alert("Success", "Expenses and business data saved to your device files!");
        setSelectedExpenses([]);
      }
    } catch (err) {
      Alert.alert('Export Error', 'Failed to save data to device folders.');
    } finally {
      setIsExporting(false);
    }
  };

  // Stats Logic
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const thisMonthTotal = expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const categories = {};
    expenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + (e.amount || 0);
    });
    const highestCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    return { total, thisMonthTotal, highestCategory };
  }, [expenses]);

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = (e.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !selectedCategory || e.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, selectedCategory]);

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          }
        }
      ]
    );
  };

  const handleMoreActions = (expense) => {
    Alert.alert(
      'Expense Actions',
      expense.title,
      [
        { text: 'Edit', onPress: () => handleEdit(expense) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(expense.id) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderExpenseItem = ({ item }) => {
    const isSelected = selectedExpenses.includes(item.id);
    const hasSelection = selectedExpenses.length > 0;

    return (
      <Pressable
        onPress={() => hasSelection ? toggleSelectExpense(item.id) : handleEdit(item)}
        onLongPress={() => toggleSelectExpense(item.id)}
        style={[styles.expenseCard, isSelected && styles.selectedCard]}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTitleInfo}>
            <View style={[styles.categoryBadge, { backgroundColor: '#f1f5f9' }]}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
            <Text style={styles.expenseTitle} numberOfLines={1}>{item.title}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.expenseAmount}>₹{item.amount.toLocaleString()}</Text>
            <Pressable onPress={() => handleMoreActions(item)} style={styles.cardMoreBtn}>
              <MoreVertical size={18} color="#94a3b8" />
            </Pressable>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBottom}>
          <View style={styles.metaItem}>
            <Calendar size={14} color="#64748b" />
            <Text style={styles.metaText}>{new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
          </View>
          <View style={styles.metaItem}>
            <Wallet size={14} color="#64748b" />
            <Text style={styles.metaText}>{item.paymentMethod}</Text>
          </View>
          {item.receiptUrl && (
            <View style={[styles.metaItem, styles.receiptBadge]}>
              <FileText size={14} color="#2563eb" />
              <Text style={[styles.metaText, { color: '#2563eb' }]}>Receipt</Text>
            </View>
          )}
        </View>

        {hasSelection && (
          <View style={[styles.selectionOverlay, isSelected && styles.selectionOverlaySelected]}>
            {isSelected && <Check size={16} color="#fff" />}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <ChevronLeft size={24} color="#000" />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Expenses</Text>
            <Text style={styles.headerSubtitle}>Manage Business Spends</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable onPress={() => shareExpensesPDF(filteredExpenses)} style={styles.headerActionBtn}>
            <Share2 size={20} color="#64748b" />
          </Pressable>
          <Pressable onPress={handleBulkExport} style={[styles.headerActionBtn, { marginLeft: 8 }]}>
            <Download size={20} color="#64748b" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={item => item.id}
        renderItem={renderExpenseItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchExpenses} />
        }
        ListHeaderComponent={
          <>
            {/* Quick Summary Cards */}
            <View style={styles.summaryGrid}>
              <SummaryCard
                title="This Month"
                amount={stats.thisMonthTotal}
                icon={TrendingDown}
                color="#ef4444"
                trend="+12%"
              />
              <SummaryCard
                title="Top Category"
                amount={stats.highestCategory[1]}
                icon={PieChart}
                color="#2563eb"
                trend={stats.highestCategory[0]}
              />
            </View>

            {/* Filter & Search Section */}
            <View style={styles.filterSection}>
              <View style={styles.searchWrapper}>
                <Search size={18} color="#94a3b8" />
                <Input
                  placeholder="Search title or category..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  style={styles.premiumSearchInput}
                />
              </View>

              <CategoryFilter
                categories={SAMPLE_CATEGORIES}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </View>

            <View style={styles.listHeaderRow}>
              <Text style={styles.listHeaderText}>All Transactions</Text>
              <Text style={styles.listHeaderCount}>{filteredExpenses.length} records</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Receipt size={48} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No Expenses Found</Text>
            <Text style={styles.emptySubtitle}>Start by adding your first business expense.</Text>
            <Button
              title="Add New Expense"
              onPress={handleAdd}
              style={styles.emptyActionBtn}
            />
          </View>
        }
      />

      {/* Floating Add Button */}
      {!selectedExpenses.length && (
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          style={styles.fabGradient}
        >
          <Pressable onPress={handleAdd} style={styles.fabBtn}>
            <Plus size={28} color="#fff" />
          </Pressable>
        </LinearGradient>
      )}

      {/* Bulk Actions Header (Replacement for Toolbar if desired, but Toolbar is fine) */}
      <BulkActionsToolbar
        selectedCount={selectedExpenses.length}
        onClearSelection={clearSelection}
        onCategoryChange={async (cat) => {
          try {
            await bulkUpdateExpenses(selectedExpenses, { category: cat });
            setSelectedExpenses([]);
            Alert.alert('Success', 'Updated Categories');
          } catch (e) {
            Alert.alert('Error', 'Update failed');
          }
        }}
        onMarkRecurring={() => { }}
        onExportCSV={handleBulkExport}
        onDelete={() => {
          Alert.alert('Delete', `Delete ${selectedExpenses.length} items?`, [
            { text: 'Cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                await bulkDeleteExpenses(selectedExpenses);
                setSelectedExpenses([]);
              }
            }
          ]);
        }}
        categories={SAMPLE_CATEGORIES}
      />

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        expense={editingExpense}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  headerBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  headerSubtitle: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerActionBtn: { padding: 10 },

  listContent: { paddingBottom: 120 },

  // Summary Grid
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#64748b',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: { flex: 1 },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  summaryAmount: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginVertical: 2 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 10, fontWeight: '700', color: '#22c55e' },

  // Filter Section
  filterSection: { paddingVertical: 10 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 54,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 15,
  },
  premiumSearchInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    fontSize: 15,
    height: '100%',
    marginLeft: 10,
    fontWeight: '600'
  },

  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginTop: 10,
    marginBottom: 12,
  },
  listHeaderText: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  listHeaderCount: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },

  // Expense Card
  expenseCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    elevation: 2,
    shadowColor: '#64748b',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  selectedCard: { borderColor: '#2563eb', backgroundColor: '#f0f7ff' },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleInfo: { flex: 1, gap: 8 },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  expenseTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  amountContainer: { alignItems: 'flex-end', flexDirection: 'row', gap: 4 },
  expenseAmount: { fontSize: 18, fontWeight: '800', color: '#ef4444' },
  cardMoreBtn: { padding: 4 },
  cardDivider: { height: 1, backgroundColor: '#f8fafc', marginVertical: 12 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  receiptBadge: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  selectionOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionOverlaySelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },

  // FAB
  fabGradient: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 8,
    shadowColor: '#2563eb',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBtn: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },

  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: '#1e293b' },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  emptyActionBtn: { marginTop: 30, paddingHorizontal: 40, height: 54, borderRadius: 16, backgroundColor: '#000' },
});

