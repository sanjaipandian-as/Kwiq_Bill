import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RefreshCw, Calendar } from 'lucide-react-native';

export const RecurringBadge = ({ frequency, nextDueDate }) => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <RefreshCw size={10} color="#1e40af" style={styles.icon} />
                <Text style={styles.text}>{frequency}</Text>
            </View>
            {nextDueDate && (
                <View style={[styles.content, styles.dateContent]}>
                    <Calendar size={10} color="#64748b" style={styles.icon} />
                    <Text style={styles.dateText}>Next: {new Date(nextDueDate).toLocaleDateString()}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dbeafe',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    dateContent: {
        backgroundColor: '#f1f5f9',
    },
    icon: {
        marginRight: 4,
    },
    text: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1e40af',
        textTransform: 'capitalize',
    },
    dateText: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '500',
    }
});
