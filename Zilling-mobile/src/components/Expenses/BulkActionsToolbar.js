import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Trash2, Download, X, Tag, RefreshCw } from 'lucide-react-native';

export const BulkActionsToolbar = ({
    selectedCount,
    onClearSelection,
    onCategoryChange,
    onMarkRecurring,
    onExportCSV,
    onDelete,
    categories = []
}) => {
    if (selectedCount === 0) return null;

    return (
        <Animated.View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.selectionCount}>
                    <TouchableOpacity onPress={onClearSelection} style={styles.closeBtn}>
                        <X size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.countText}>{selectedCount} selected</Text>
                </View>
                <TouchableOpacity onPress={onExportCSV} style={styles.actionIcon}>
                    <Download size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsList}>
                <TouchableOpacity onPress={onDelete} style={[styles.actionBtn, styles.deleteBtn]}>
                    <Trash2 size={18} color="#fff" />
                    <Text style={styles.actionText}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onMarkRecurring} style={styles.actionBtn}>
                    <RefreshCw size={18} color="#fff" />
                    <Text style={styles.actionText}>Recurring</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <Text style={styles.label}>Set Category:</Text>
                {categories.slice(0, 5).map(cat => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => onCategoryChange(cat)}
                        style={styles.catBtn}
                    >
                        <Tag size={14} color="#fff" />
                        <Text style={styles.catText}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0f172a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 16,
        paddingBottom: 24,
        paddingHorizontal: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    selectionCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    closeBtn: {
        padding: 4,
    },
    countText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    actionIcon: {
        padding: 8,
    },
    actionsList: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#334155',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 8,
    },
    deleteBtn: {
        backgroundColor: '#ef4444',
    },
    actionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: '#475569',
        marginHorizontal: 4,
    },
    label: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
    },
    catBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563eb',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 6,
    },
    catText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
});
