import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ShoppingCart, Plus, Minus, Trash2, Search } from 'lucide-react-native';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';

const ProductStep = ({ cart, updateQuantity, removeItem, onNext }) => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.total || 0), 0);

    const renderItem = ({ item }) => (
        <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
            </View>

            <View style={styles.controls}>
                <View style={styles.qtyBox}>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}>
                        <Minus size={16} color="#64748b" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                        <Plus size={16} color="#64748b" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                    <Trash2 size={18} color="#dc2626" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Cart Items</Text>
                    <Text style={styles.subtitle}>{totalItems} items in cart</Text>
                </View>
                <Button variant="outline" size="sm" style={styles.addMoreBtn}>
                    <Plus size={16} color="#2563eb" style={{ marginRight: 4 }} />
                    <Text style={styles.addMoreBtnText}>Add Items</Text>
                </Button>
            </View>

            <FlatList
                data={cart}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <ShoppingCart size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>Your cart is empty</Text>
                        <Button style={{ marginTop: 16 }}>Start Adding Items</Button>
                    </View>
                }
            />

            {cart.length > 0 && (
                <View style={styles.footer}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal</Text>
                        <Text style={styles.totalValue}>₹{subtotal.toFixed(2)}</Text>
                    </View>
                    <Button size="lg" onPress={onNext} style={styles.continueBtn}>
                        <Text style={styles.continueBtnText}>Checkout ₹{subtotal.toFixed(2)}</Text>
                    </Button>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
    subtitle: { fontSize: 13, color: '#64748b' },
    addMoreBtn: { borderRadius: 20, borderColor: '#2563eb' },
    addMoreBtnText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
    list: { padding: 16 },
    itemCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    itemPrice: { fontSize: 14, color: '#64748b', marginTop: 2 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4 },
    qtyBtn: { padding: 8 },
    qtyText: { fontSize: 15, fontWeight: 'bold', minWidth: 24, textAlign: 'center' },
    deleteBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },
    footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    totalLabel: { fontSize: 16, color: '#64748b' },
    totalValue: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
    continueBtn: { borderRadius: 12 },
    continueBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    empty: { padding: 60, alignItems: 'center' },
    emptyText: { marginTop: 12, color: '#94a3b8', fontSize: 16 }
});

export default ProductStep;
