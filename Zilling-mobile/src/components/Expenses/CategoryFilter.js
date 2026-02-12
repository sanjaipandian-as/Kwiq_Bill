import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';

export const CategoryFilter = ({ categories = [], selectedCategory, onCategoryChange }) => {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <TouchableOpacity
                    style={[styles.chip, !selectedCategory && styles.chipActive]}
                    onPress={() => onCategoryChange(null)}
                >
                    <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
                </TouchableOpacity>
                {categories.map((cat, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                        onPress={() => onCategoryChange(cat)}
                    >
                        <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    scrollContent: {
        paddingHorizontal: 24,
        gap: 10,
        paddingBottom: 8 // Add some padding for shadows if needed
    },
    chip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 0,
    },
    chipActive: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a',
        elevation: 2,
        shadowColor: '#0f172a',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    chipTextActive: {
        color: '#fff',
        fontWeight: '700'
    }
});
