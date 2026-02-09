import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Package, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react-native';

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <View style={[styles.card, { backgroundColor: bg }]}>
    <View style={[styles.iconWrap, { backgroundColor: color }]}>
      <Icon size={18} color="#fff" />
    </View>
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.title}>{title}</Text>
  </View>
);

const ProductStats = ({ products = [] }) => {
  const total = products.length;
  const active = products.filter(p => p.isActive !== false).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 10)).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  return (
    <View style={styles.container}>
      <StatCard
        title="Total Products"
        value={total}
        icon={Package}
        color="#2563eb"
        bg="#eff6ff"
      />
      <StatCard
        title="Active"
        value={active}
        icon={CheckCircle2}
        color="#16a34a"
        bg="#ecfdf5"
      />
      <StatCard
        title="Low Stock"
        value={lowStock}
        icon={AlertTriangle}
        color="#f59e0b"
        bg="#fffbeb"
      />
      <StatCard
        title="Out of Stock"
        value={outOfStock}
        icon={XCircle}
        color="#dc2626"
        bg="#fef2f2"
      />
    </View>
  );
};

export default ProductStats;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  card: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  value: {
    fontSize: 20,
    fontWeight: '700'
  },
  title: {
    fontSize: 12,
    color: '#64748b'
  }
});
