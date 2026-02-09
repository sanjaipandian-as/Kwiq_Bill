import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal
} from 'react-native';
import { Search, Tag, X, ChevronRight } from 'lucide-react-native';

const CategoryWizard = ({ visible, categories = [], onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(categories);

  useEffect(() => {
    setFiltered(
      categories.filter(c =>
        c.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, categories]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <View style={styles.iconWrap}>
        <Tag size={16} color="#64748b" strokeWidth={2.5} />
      </View>
      <Text style={styles.itemText}>{item.toUpperCase()}</Text>
      <ChevronRight size={16} color="#cbd5e1" />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.modalIndicator} />
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Filter Category</Text>
              <Text style={styles.subTitle}>{categories.length} segments found</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#000" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <Search size={18} color="#94a3b8" strokeWidth={2.5} />
            <TextInput
              placeholder="Search category segments..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              placeholderTextColor="#cbd5e1"
            />
          </View>

          {/* All */}
          <TouchableOpacity
            style={[styles.item, styles.allItem]}
            onPress={() => {
              onSelect(null);
              onClose();
            }}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#000' }]}>
              <Tag size={16} color="#fff" strokeWidth={2.5} />
            </View>
            <Text style={[styles.itemText, { fontWeight: '900' }]}>ALL PRODUCTS</Text>
            <ChevronRight size={16} color="#cbd5e1" />
          </TouchableOpacity>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item, i) => i.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

export default CategoryWizard;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    maxHeight: '80%',
  },
  modalIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: -8
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -0.5
  },
  subTitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 2
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#f1f5f9'
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    height: 54
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#000'
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1.5,
    borderColor: '#f8fafc',
    paddingHorizontal: 4
  },
  allItem: {
    borderBottomWidth: 2,
    borderColor: '#f1f5f9',
  },
  iconWrap: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 12,
    marginRight: 16
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5
  }
});
