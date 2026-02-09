import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { X, Plus } from 'lucide-react-native';

export const TagsInput = ({ value = [], onChange, suggestions = [], placeholder = "Add tag..." }) => {
    const [text, setText] = useState('');

    const addTag = (tag) => {
        const trimmed = tag.trim();
        if (trimmed && !value.includes(trimmed)) {
            onChange([...value, trimmed]);
        }
        setText('');
    };

    const removeTag = (tag) => {
        onChange(value.filter(t => t !== tag));
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    onSubmitEditing={() => addTag(text)}
                    placeholder={placeholder}
                    placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity onPress={() => addTag(text)} style={styles.addBtn}>
                    <Plus size={20} color="#2563eb" />
                </TouchableOpacity>
            </View>

            {suggestions.length > 0 && text.length > 0 && (
                <View style={styles.suggestions}>
                    {suggestions
                        .filter(s => s.toLowerCase().includes(text.toLowerCase()) && !value.includes(s))
                        .slice(0, 5)
                        .map(s => (
                            <TouchableOpacity key={s} onPress={() => addTag(s)} style={styles.suggestionItem}>
                                <Text style={styles.suggestionText}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                </View>
            )}

            <View style={styles.tagList}>
                {value.map(tag => (
                    <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                        <TouchableOpacity onPress={() => removeTag(tag)} style={styles.removeBtn}>
                            <X size={14} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: 8 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingRight: 8,
    },
    input: {
        flex: 1,
        height: 40,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#0f172a',
    },
    addBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tagList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 4,
    },
    tagText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '500',
    },
    removeBtn: {
        padding: 2,
    },
    suggestions: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        marginTop: -4,
        overflow: 'hidden',
    },
    suggestionItem: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    suggestionText: {
        fontSize: 13,
        color: '#1e293b',
    },
});
