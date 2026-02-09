import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { Trash2, Plus, Minus, Percent, Search, Upload, Scan, Package, Tag, Award, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useProducts } from '../../../context/ProductContext';
// ImportProductModal removed
const BillingGrid = ({
    products,
    cart,
    updateQuantity,
    removeItem,
    selectedItemId,
    onRowClick,
    onDiscountClick,
    onAddQuickItem,
    onScanClick,
    additionalCharges = 0,
    loyaltyDiscount = 0,
    remarks = '',
    onChargesClick,
    onLoyaltyClick,
    onRemarksClick
}) => {

    const suggestedItems = products || [];
    const [searchQuery, setSearchQuery] = React.useState('');
    const [sortBy, setSortBy] = React.useState('name');
    const [sortOrder, setSortOrder] = React.useState('asc');

    const filteredSuggestions = suggestedItems
        .filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesSearch;
        })
        .sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
            else if (sortBy === 'price') comparison = a.price - b.price;
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    const renderItem = ({ item, index }) => {
        const isSelected = item.id === selectedItemId;

        return (
            <TouchableOpacity
                style={[styles.cartCard, isSelected && styles.selectedCartCard]}
                onPress={() => onRowClick(item.id)}
                activeOpacity={0.8}
            >
                <View style={styles.cardMain}>
                    <View style={styles.cardInfo}>
                        <Text style={styles.itemSku}>{item.sku || 'ITEM'}-{index + 1}</Text>
                        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.itemUnitPrice}>₹{item.price} • </Text>
                            <Text style={styles.taxBadge}>GST {item.taxRate}%</Text>
                        </View>
                    </View>

                    <View style={styles.cardRight}>
                        <View style={styles.qtyContainer}>
                            <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyAction}>
                                <Minus size={14} color="#000" />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{item.quantity}</Text>
                            <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyAction}>
                                <Plus size={14} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.itemTotal}>₹{(item.total || 0).toFixed(0)}</Text>
                    </View>
                </View>

                {isSelected && (
                    <View style={styles.cardActions}>
                        <TouchableOpacity onPress={() => onDiscountClick(item.id)} style={styles.actionPill}>
                            <Percent size={14} color="#000" />
                            <Text style={styles.actionPillText}>Discount</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeItem(item.id)} style={[styles.actionPill, { backgroundColor: '#fee2e2' }]}>
                            <Trash2 size={14} color="#ef4444" />
                            <Text style={[styles.actionPillText, { color: '#ef4444' }]}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Cart List Section */}
            <View style={styles.cartSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>CART ITEMS ({cart.length})</Text>
                    <TouchableOpacity onPress={onScanClick} style={styles.scanBtnMini}>
                        <Scan size={16} color="#000" />
                        <Text style={styles.scanBtnText}>SCAN</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={cart}
                    keyExtractor={(item, index) => (item.id && item.id !== 'null' ? item.id : `cart-item-${index}`)}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconBox}>
                                <Search size={32} color="#94a3b8" />
                            </View>
                            <Text style={styles.emptyText}>Empty Cart</Text>
                            <Text style={styles.emptySubText}>Add items from suggestions below</Text>
                        </View>
                    }
                />
            </View>

            {/* Suggestions/Search Section */}
            <View style={styles.suggestionSection}>
                <View style={styles.searchBarContainer}>
                    <View style={styles.searchBox}>
                        <Search size={20} color="#94a3b8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Find products..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.filterTrigger}
                        onPress={() => setSortBy(sortBy === 'name' ? 'price' : 'name')}
                    >
                        <Text style={styles.filterText}>{sortBy === 'name' ? 'A-Z' : '₹'}</Text>
                    </TouchableOpacity>
                </View>



                <FlatList
                    data={filteredSuggestions}
                    keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : `suggestion-${index}`}
                    numColumns={2}
                    columnWrapperStyle={{ gap: 12 }}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.suggestionItem}
                            onPress={() => onAddQuickItem && onAddQuickItem(item)}
                        >
                            <Text style={styles.suggestedName} numberOfLines={1}>{item.name}</Text>
                            <View style={styles.suggestedFooter}>
                                <Text style={styles.suggestedPrice}>₹{item.price}</Text>
                                <View style={styles.addBtnSmall}>
                                    <Plus size={14} color="#fff" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },

    // Cart Section
    cartSection: { flex: 1, marginBottom: 15 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 1.5 },
    scanBtnMini: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    scanBtnText: { fontSize: 10, fontWeight: '900', color: '#000' },

    // Cart Card
    cartCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    selectedCartCard: { borderColor: '#000', backgroundColor: '#f8fafc' },
    cardMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardInfo: { flex: 1 },
    itemSku: { fontSize: 11, fontWeight: '900', color: '#cbd5e1', letterSpacing: 0.5, marginBottom: 2 },
    itemName: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    itemUnitPrice: { fontSize: 13, color: '#64748b', fontWeight: '600' },
    taxBadge: { fontSize: 10, fontWeight: '800', color: '#22c55e', backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

    cardRight: { alignItems: 'flex-end', gap: 6 },
    qtyContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f1f5f9', padding: 4, borderRadius: 12 },
    qtyAction: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 1 },
    qtyText: { fontSize: 15, fontWeight: '900', color: '#000', minWidth: 22, textAlign: 'center' },
    itemTotal: { fontSize: 19, fontWeight: '900', color: '#000' },

    cardActions: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    actionPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    actionPillText: { fontSize: 11, fontWeight: '800', color: '#000' },

    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
    emptyIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    emptyText: { fontSize: 14, fontWeight: '800', color: '#94a3b8' },
    emptySubText: { fontSize: 10, color: '#cbd5e1', marginTop: 2 },

    // Suggestions Section
    suggestionSection: {
        flex: 1,
        backgroundColor: '#fff',
        marginHorizontal: -20,
        paddingHorizontal: 20,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingTop: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 15
    },
    searchBarContainer: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#f1f5f9' },
    searchInput: { flex: 1, fontSize: 13, color: '#000', fontWeight: '600', marginLeft: 8 },
    filterTrigger: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
    filterText: { color: '#fff', fontWeight: '900', fontSize: 11 },

    suggestionItem: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 10, borderWidth: 1.5, borderColor: '#f1f5f9', marginBottom: 8, minHeight: 80, justifyContent: 'space-between' },
    suggestedName: { fontSize: 12, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
    suggestedFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    suggestedPrice: { fontSize: 14, fontWeight: '900', color: '#000' },
    addBtnSmall: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
});

export default BillingGrid;