import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../../../components/ui/Button';

const BottomFunctionBar = ({ onFunctionClick }) => {
    const functions = [
        { key: 'F2', label: 'Qty' },
        { key: 'F3', label: 'Item Disc' },
        { key: 'F4', label: 'Remove' },
        { key: 'F6', label: 'Unit' },
        { key: 'F8', label: 'Charges' },
        { key: 'F9', label: 'Bill Disc' },
        { key: 'F10', label: 'Loyalty' },
        { key: 'F12', label: 'Remarks' },
    ];

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {functions.map((fn) => (
                    <Button
                        key={fn.key}
                        variant="outline"
                        style={styles.btn}
                        onPress={() => onFunctionClick(fn.key)}
                    >
                        <Text style={styles.btnText}>{fn.label}</Text>
                    </Button>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { backgroundColor: '#fff', borderTopWidth: 0.9, borderTopColor: '#e2e8f0', paddingTop: 5, paddingBottom: 0 },
    scroll: { paddingHorizontal: 8, gap: 8 },
    btn: { minWidth: 80, height: 40, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
    btnText: { color: '#0f172a', fontWeight: '600', fontSize: 13 }
});

export default BottomFunctionBar;
