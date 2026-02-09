import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  History,
  UserCog,
  Phone,
  Mail,
  User,
  Star,
  CircleDollarSign,
  CalendarDays,
  Trash2,
  Edit
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useCustomers } from '../../context/CustomerContext';
import { useTransactions } from '../../context/TransactionContext';
import CustomerModal from './CustomerModal';

export default function CustomersPage({ route }) {
  const navigation = useNavigation();
  const { customers, loading, refreshCustomers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { transactions } = useTransactions();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalTab, setModalTab] = useState('details');
  const [filterType, setFilterType] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    refreshCustomers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#000');
      }
    }, [])
  );

  useEffect(() => {
    if (route?.params?.editId && customers.length > 0) {
      const target = customers.find(c => c.id === route.params.editId || c._id === route.params.editId);
      if (target) {
        handleEdit(target);
        navigation.setParams({ editId: null });
      }
    }
  }, [route?.params?.editId, customers]);

  const getCustomerStats = useCallback((customerId) => {
    if (!transactions || !customerId) return { totalSpent: 0, totalVisits: 0, due: 0, lastVisit: null };

    // Robust ID matching (number vs string)
    const customerTx = transactions.filter(t =>
      t.customerId === customerId ||
      String(t.customerId) === String(customerId)
    );

    const totalSpent = customerTx.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
    const totalVisits = customerTx.length;

    // Calculate Due based on remaining balance
    const due = customerTx.reduce((sum, t) => {
      const total = parseFloat(t.total || 0);
      const received = parseFloat(t.amountReceived || 0);
      return sum + Math.max(0, total - received);
    }, 0);

    const lastVisit = customerTx.length > 0 ? customerTx[0].date : null;

    return { totalSpent, totalVisits, due, lastVisit };
  }, [transactions]);

  const stats = useMemo(() => {
    let revenue = 0;
    let due = 0;
    (customers || []).forEach(c => {
      const s = getCustomerStats(c.id);
      revenue += s.totalSpent;
      due += s.due;
    });
    const vips = (customers || []).filter(c => (c.tags || '').includes('VIP')).length;
    return {
      revenue: revenue > 1000 ? `₹${(revenue / 1000).toFixed(1)}k` : `₹${revenue.toFixed(0)}`,
      due: due > 1000 ? `₹${(due / 1000).toFixed(1)}k` : `₹${due.toFixed(0)}`,
      vips,
      total: customers.length
    };
  }, [customers, getCustomerStats]);

  const filteredCustomers = useMemo(() => {
    return (customers || []).filter(c => {
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '');
      const search = searchTerm.toLowerCase();
      const matchesSearch = name.includes(search) || phone.includes(search);

      if (filterType === 'VIP') return matchesSearch && (c.tags || '').includes('VIP');
      if (filterType === 'Individual') return matchesSearch && c.type === 'Individual';
      if (filterType === 'Business') return matchesSearch && c.type === 'Business';
      return matchesSearch;
    }).map(c => {
      const s = getCustomerStats(c.id);
      return { ...c, ...s, due: c.due || s.due };
    });
  }, [customers, searchTerm, filterType, getCustomerStats]);

  const handleEdit = (customer, tab = 'details') => {
    setSelectedCustomer(customer);
    setModalTab(tab);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setModalTab('details');
    setIsModalOpen(true);
  };

  const handleSave = async (data) => {
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, data);
      } else {
        await addCustomer(data);
      }
      setIsModalOpen(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save customer');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Customer', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteCustomer(id); setIsModalOpen(false); } catch (err) { Alert.alert('Error', 'Failed to delete'); }
        }
      }
    ]);
  };

  const renderCustomerItem = ({ item }) => {
    const isExpanded = expandedId === item.id;
    const isVIP = (item.tags || '').includes('VIP');

    return (
      <TouchableOpacity
        style={[styles.proCard, isExpanded && styles.proCardExpanded]}
        activeOpacity={0.9}
        onPress={() => isExpanded ? setExpandedId(null) : handleEdit(item)}
      >
        <View style={styles.cardMainContent}>
          <View style={styles.cardHeader}>
            <View style={[
              styles.avatarBox,
              {
                backgroundColor: item.type === 'Business' ? '#f0f9ff' : '#f0fdf4',
                borderColor: item.type === 'Business' ? '#bae6fd' : '#bbf7d0'
              }
            ]}>
              <Text style={[styles.avatarLabel, { color: item.type === 'Business' ? '#0369a1' : '#15803d' }]}>
                {(item.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.proName} numberOfLines={1}>{item.name}</Text>
                {isVIP && (
                  <View style={styles.vipBadge}>
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.vipText}>VIP</Text>
                  </View>
                )}
              </View>
              <View style={styles.tagRow}>
                <View style={styles.typeBadge}>
                  <Users size={12} color="#64748b" />
                  <Text style={styles.typeText}>{item.type ? item.type.toUpperCase() : 'INDIVIDUAL'}</Text>
                </View>
                {item.phone && (
                  <View style={styles.phoneBadge}>
                    <Phone size={12} color="#94a3b8" />
                    <Text style={styles.phoneText}>{item.phone}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Revenue</Text>
              <Text style={styles.metricValue}>₹{(item.totalSpent || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Pending Due</Text>
              <View style={styles.dueRow}>
                <Text style={[styles.metricValue, item.due > 0 ? styles.redText : styles.greenText]}>
                  ₹{(item.due || 0).toLocaleString()}
                </Text>
                {item.due > 0 && <AlertCircle size={16} color="#ef4444" />}
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.visitStat}>
              <CalendarDays size={14} color="#94a3b8" />
              <Text style={styles.visitText}>{item.totalVisits || 0} VISITS COMPLETED</Text>
            </View>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setExpandedId(isExpanded ? null : item.id);
              }}
              style={[styles.expandBtn, isExpanded && styles.expandBtnActive]}
            >
              <ChevronDown
                size={24}
                color={isExpanded ? "#fff" : "#000"}
                strokeWidth={2.5}
                style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>
          </View>

          {isExpanded && (
            <View style={styles.expandedActions}>
              <TouchableOpacity
                style={styles.miniAction}
                onPress={() => handleEdit(item, 'details')}
              >
                <UserCog size={18} color="#0f172a" />
                <Text style={styles.miniActionText}>EDIT PROFILE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.miniAction}
                onPress={() => handleEdit(item, 'history')}
              >
                <History size={18} color="#0f172a" />
                <Text style={styles.miniActionText}>VIEW HISTORY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
              >
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.mainHeader}>
          <View>
            <Text style={styles.mainTitle}>Customers</Text>
            <Text style={styles.subTitle}>{filteredCustomers.length} Verified Contacts</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <ChevronLeft color="#fff" size={24} strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddNew}>
              <UserPlus color="#fff" size={24} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={22} color="rgba(255,255,255,0.4)" strokeWidth={2.5} />
            <TextInput
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={styles.searchInput}
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
            {searchTerm !== '' && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <X size={20} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterAction, showFilters && styles.filterActionActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={22} color={showFilters ? "#000" : "#fff"} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {['All', 'Individual', 'Business', 'VIP'].map(f => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilterType(f)}
                  style={[styles.filterChip, filterType === f && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, filterType === f && styles.filterChipTextActive]}>{f.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>

      <FlatList
        data={filteredCustomers}
        keyExtractor={item => item.id}
        renderItem={renderCustomerItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={refreshCustomers}
        ListHeaderComponent={() => (
          <View style={styles.statsSection}>
            <View style={styles.featuredStatCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#f0fdfa', marginBottom: 0 }]}>
                <CircleDollarSign size={24} color="#14b8a6" strokeWidth={2.5} />
              </View>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={styles.statCardLabel}>Portfolio Value</Text>
                <Text style={[styles.featuredStatValue, { color: '#0f766e' }]}>{stats.revenue}</Text>
              </View>
              <View style={styles.trendBadge}>
                <TrendingUp size={14} color="#14b8a6" />
                <Text style={styles.trendText}>+12.5%</Text>
              </View>
            </View>

            <View style={styles.proStatsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: '#fef2f2' }]}>
                  <AlertCircle size={22} color="#ef4444" strokeWidth={2.5} />
                </View>
                <Text style={styles.statCardLabel}>Outstandings</Text>
                <Text style={[styles.statCardValue, { color: '#b91c1c' }]}>{stats.due}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: '#fffbeb' }]}>
                  <Award size={22} color="#f59e0b" strokeWidth={2.5} />
                </View>
                <Text style={styles.statCardLabel}>VIP Portfolio</Text>
                <Text style={[styles.statCardValue, { color: '#b45309' }]}>{stats.vips}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#000" style={{ marginTop: 60 }} />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Users size={64} color="#f1f5f9" strokeWidth={1} />
              <Text style={styles.emptyTitle}>NO CUSTOMERS FOUND</Text>
              <Text style={styles.emptyDesc}>Start growing your relationship with your customers today.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={handleAddNew}>
                <Text style={styles.emptyBtnText}>ADD FIRST CUSTOMER</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        initialTab={modalTab}
        onSave={handleSave}
        onDelete={() => handleDelete(selectedCustomer.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
  safeArea: { backgroundColor: '#000', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, paddingBottom: 24 },
  mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
  mainTitle: { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1.5 },
  subTitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '800', marginTop: -2, letterSpacing: 0.5, textTransform: 'uppercase' },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { width: 50, height: 50, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  addBtn: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },

  searchSection: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginTop: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', height: 56, borderRadius: 20, paddingHorizontal: 18, gap: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff' },
  filterAction: { width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  filterActionActive: { backgroundColor: '#fff', borderColor: '#fff' },

  filtersWrapper: { marginTop: 20 },
  filterScroll: { paddingHorizontal: 24, gap: 10 },
  filterChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
  filterChipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  filterChipText: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.8 },
  filterChipTextActive: { color: '#000' },

  statsSection: { paddingHorizontal: 24, marginTop: 24, marginBottom: 32, gap: 14 },
  featuredStatCard: { flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: 32, borderWidth: 1.5, backgroundColor: '#fff', borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 20, elevation: 3 },
  featuredStatValue: { fontSize: 28, fontWeight: '900', letterSpacing: -1.2, marginTop: 2 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdfa', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, alignSelf: 'flex-start' },
  trendText: { fontSize: 10, fontWeight: '900', color: '#14b8a6' },

  proStatsGrid: { flexDirection: 'row', gap: 14 },
  statCard: { flex: 1, padding: 22, borderRadius: 32, borderWidth: 1.5, backgroundColor: '#fff', borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 15, elevation: 2 },
  statIconBox: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  statCardLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 2, textTransform: 'uppercase' },
  statCardValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },

  listContent: { paddingBottom: 120 },
  proCard: { backgroundColor: '#fff', marginHorizontal: 24, borderRadius: 32, marginBottom: 16, borderWidth: 1.5, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 15, elevation: 1, overflow: 'hidden' },
  proCardExpanded: { borderColor: '#10b981', backgroundColor: '#fff' },
  cardMainContent: { padding: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  avatarBox: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  avatarLabel: { fontSize: 20, fontWeight: '900' },
  proName: { fontSize: 22, fontWeight: '900', color: '#000', letterSpacing: -0.8 },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vipBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fffbeb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#fef3c7' },
  vipText: { fontSize: 11, fontWeight: '900', color: '#d97706' },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  typeText: { fontSize: 10, fontWeight: '900', color: '#64748b', letterSpacing: 0.5 },
  phoneBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phoneText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },

  metricsGrid: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 24, marginTop: 20, padding: 18, gap: 12 },
  metricItem: { flex: 1, gap: 4 },
  metricDivider: { width: 1.5, backgroundColor: '#f1f5f9', marginVertical: 4 },
  metricLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase' },
  metricValue: { fontSize: 18, fontWeight: '900', color: '#000' },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1.5, borderTopColor: '#f1f5f9' },
  visitStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  visitText: { fontSize: 11, fontWeight: '900', color: '#64748b', letterSpacing: 0.5 },
  expandBtn: { width: 48, height: 48, borderRadius: 18, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#f1f5f9' },
  expandBtnActive: { backgroundColor: '#000', borderColor: '#000' },

  expandedActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#f1f5f9',
    alignItems: 'center'
  },
  miniAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#f1f5f9'
  },
  miniActionText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.4,
    textTransform: 'uppercase'
  },
  deleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fee2e2'
  },

  emptyStateContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#000', marginTop: 20 },
  emptyDesc: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8, lineHeight: 22, fontWeight: '600' },
  emptyBtn: { marginTop: 24, backgroundColor: '#000', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 18 },
  emptyBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },

  greenText: { color: '#10b981' },
  redText: { color: '#ef4444' }
});
