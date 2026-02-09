import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { X, Package, TrendingUp, IndianRupee, Archive } from 'lucide-react-native';

const InfoRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const ProductInsights = ({ product, onClose }) => {
  if (!product) return null;

  const stockStatus =
    product.stock === 0
      ? 'Out of Stock'
      : product.stock <= (product.minStock || 10)
        ? 'Low Stock'
        : 'In Stock';

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{product.name}</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <IndianRupee size={22} color="#22c55e" />
              <Text style={styles.statValue}>₹{product.price}</Text>
              <Text style={styles.statLabel}>Price</Text>
            </View>

            <View style={styles.statCard}>
              <Package size={22} color="#000" />
              <Text style={styles.statValue}>{product.stock}</Text>
              <Text style={styles.statLabel}>Stock</Text>
            </View>

            <View style={styles.statCard}>
              <Archive size={22} color={product.stock <= (product.minStock || 10) ? "#ef4444" : "#000"} />
              <Text style={styles.statValue}>{stockStatus}</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <InfoRow label="Category" value={product.category || '—'} />
            <InfoRow label="Brand" value={product.brand || '—'} />
            <InfoRow label="SKU" value={product.sku || '—'} />
            <InfoRow label="Barcode" value={product.barcode || '—'} />
            <InfoRow label="Unit" value={product.unit || '—'} />
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <InfoRow label="Cost Price" value={`₹${product.costPrice || 0}`} />
            <InfoRow label="Selling Price" value={`₹${product.price}`} />
            <InfoRow
              label="Margin"
              value={`₹${(product.price - (product.costPrice || 0)).toFixed(2)}`}
            />
          </View>

          {/* Inventory */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inventory</Text>
            <InfoRow label="Min Stock Alert" value={product.minStock || 10} />
            <InfoRow label="Expiry Date" value={product.expiryDate || '—'} />
            <InfoRow label="Active" value={product.isActive ? 'Yes' : 'No'} />
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default ProductInsights;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0, top: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  statValue: {
    fontWeight: '800',
    fontSize: 15,
    marginTop: 6,
    color: '#000'
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2
  },
  section: {
    marginTop: 16,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#f1f5f9'
  },
  sectionTitle: {
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 12,
    color: '#000'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  label: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600'
  },
  value: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000'
  }
});
