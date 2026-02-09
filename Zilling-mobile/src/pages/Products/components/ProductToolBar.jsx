import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Search, LayoutGrid, List } from 'lucide-react-native';

const FilterChip = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.chip, active && styles.chipActive]}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ProductToolbar = ({
  searchTerm,
  onSearchChange,
  categories = [],
  brands = [],
  categoryFilter,
  brandFilter,
  onCategoryChange,
  onBrandChange,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBox}>
        <Search size={18} color="#64748b" />
        <TextInput
          placeholder="Search product, SKU, barcode..."
          value={searchTerm}
          onChangeText={onSearchChange}
          style={styles.input}
        />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <FilterChip
          label="All"
          active={!categoryFilter}
          onPress={() => onCategoryChange(null)}
        />
        {categories.map(cat => (
          <FilterChip
            key={cat}
            label={cat}
            active={categoryFilter === cat}
            onPress={() => onCategoryChange(cat)}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <FilterChip
          label="All Brands"
          active={!brandFilter}
          onPress={() => onBrandChange(null)}
        />
        {brands.map(brand => (
          <FilterChip
            key={brand}
            label={brand}
            active={brandFilter === brand}
            onPress={() => onBrandChange(brand)}
          />
        ))}
      </ScrollView>

      {/* View Mode Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'compact' && styles.toggleActive]}
          onPress={() => onViewModeChange('compact')}
        >
          <List size={18} color={viewMode === 'compact' ? '#2563eb' : '#64748b'} />
          <Text style={styles.toggleText}>Compact</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'comfortable' && styles.toggleActive]}
          onPress={() => onViewModeChange('comfortable')}
        >
          <LayoutGrid size={18} color={viewMode === 'comfortable' ? '#2563eb' : '#64748b'} />
          <Text style={styles.toggleText}>Comfort</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProductToolbar;

const styles = StyleSheet.create({
  container: {
    marginBottom: 12
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10
  },
  input: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 8
  },
  chipActive: {
    backgroundColor: '#2563eb'
  },
  chipText: {
    fontSize: 12,
    color: '#334155'
  },
  chipTextActive: {
    color: '#fff'
  },
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 6,
    backgroundColor: '#f1f5f9'
  },
  toggleActive: {
    backgroundColor: '#dbeafe'
  },
  toggleText: {
    marginLeft: 4,
    fontSize: 12
  }
});
