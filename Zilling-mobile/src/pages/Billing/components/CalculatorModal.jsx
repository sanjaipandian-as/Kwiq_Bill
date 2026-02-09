import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Modal } from '../../../components/ui/Modal';
import { Delete, Divide, X as Multiply, Minus, Plus, Equal } from 'lucide-react-native';

const CalculatorModal = ({ isOpen, onClose }) => {
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');
    const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

    const handleNumber = (num) => {
        if (display === '0' || shouldResetDisplay) {
            setDisplay(num.toString());
            setShouldResetDisplay(false);
        } else {
            if (display.length < 10) setDisplay(display + num.toString());
        }
    };

    const handleOperator = (op) => {
        setEquation(display + ' ' + op + ' ');
        setShouldResetDisplay(true);
    };

    const handleEqual = () => {
        try {
            if (!equation) return;
            const fullEquation = equation + display;
            // Simplified and safer evaluation
            const sanitized = fullEquation.replace(/[^-()\d/*+.]/g, '');
            const result = new Function('return ' + sanitized)();

            setDisplay(String(Number(result).toFixed(2)).replace(/\.00$/, ''));
            setEquation('');
            setShouldResetDisplay(true);
        } catch (error) {
            setDisplay('Error');
            setShouldResetDisplay(true);
            setEquation('');
        }
    };

    const handleClear = () => {
        setDisplay('0');
        setEquation('');
        setShouldResetDisplay(false);
    };

    const handleBackspace = () => {
        if (display.length === 1) setDisplay('0');
        else setDisplay(display.slice(0, -1));
    };

    const handleDecimal = () => {
        if (!display.includes('.')) {
            setDisplay(display + '.');
            setShouldResetDisplay(false);
        }
    };

    const KeyBtn = ({ children, onPress, type = 'num', flex = 1, style }) => {
        const bg = type === 'op' ? '#f8fafc' : type === 'action' ? '#000' : '#fff';
        const color = type === 'action' ? '#fff' : '#000';
        const border = type === 'num' ? '#f1f5f9' : 'transparent';

        return (
            <TouchableOpacity
                onPress={onPress}
                style={[styles.key, { flex, backgroundColor: bg, borderColor: border, borderWidth: border === 'transparent' ? 0 : 1.5 }, style]}
                activeOpacity={0.6}
            >
                {typeof children === 'string' ?
                    <Text style={[styles.keyText, { color }]}>{children}</Text> : children}
            </TouchableOpacity>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Calculator">
            <View style={styles.calcWrapper}>
                <View style={styles.displayArea}>
                    <Text style={styles.equationText}>{equation}</Text>
                    <Text style={styles.mainDisplayText}>{display}</Text>
                </View>

                <View style={styles.keypadGrid}>
                    <View style={styles.keyRow}>
                        <KeyBtn onPress={handleClear} type="op"><Text style={{ color: '#ef4444', fontWeight: '900' }}>AC</Text></KeyBtn>
                        <KeyBtn onPress={handleBackspace} type="op"><Delete size={20} color="#000" /></KeyBtn>
                        <KeyBtn onPress={() => handleOperator('/')} type="op"><Divide size={20} color="#000" /></KeyBtn>
                        <KeyBtn onPress={() => handleOperator('*')} type="op"><Multiply size={20} color="#000" /></KeyBtn>
                    </View>

                    <View style={styles.keyRow}>
                        <KeyBtn onPress={() => handleNumber(7)}>7</KeyBtn>
                        <KeyBtn onPress={() => handleNumber(8)}>8</KeyBtn>
                        <KeyBtn onPress={() => handleNumber(9)}>9</KeyBtn>
                        <KeyBtn onPress={() => handleOperator('-')} type="op"><Minus size={20} color="#000" /></KeyBtn>
                    </View>

                    <View style={styles.keyRow}>
                        <KeyBtn onPress={() => handleNumber(4)}>4</KeyBtn>
                        <KeyBtn onPress={() => handleNumber(5)}>5</KeyBtn>
                        <KeyBtn onPress={() => handleNumber(6)}>6</KeyBtn>
                        <KeyBtn onPress={() => handleOperator('+')} type="op"><Plus size={20} color="#000" /></KeyBtn>
                    </View>

                    <View style={styles.keyRow}>
                        <KeyBtn onPress={() => handleNumber(1)}>1</KeyBtn>
                        <KeyBtn onPress={() => handleNumber(2)}>2</KeyBtn>
                        <KeyBtn onPress={() => handleNumber(3)}>3</KeyBtn>
                        <KeyBtn onPress={handleEqual} style={{ backgroundColor: '#22c55e' }}>
                            <Equal size={20} color="#fff" />
                        </KeyBtn>
                    </View>

                    <View style={styles.keyRow}>
                        <KeyBtn onPress={() => handleNumber(0)} flex={2}>0</KeyBtn>
                        <KeyBtn onPress={handleDecimal}>.</KeyBtn>
                        <KeyBtn onPress={onClose} type="action">DONE</KeyBtn>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    calcWrapper: { width: '100%', padding: 4 },
    displayArea: { backgroundColor: '#f8fafc', padding: 32, borderRadius: 32, alignItems: 'flex-end', marginBottom: 24, borderWidth: 1.5, borderColor: '#f1f5f9' },
    equationText: { color: '#94a3b8', fontSize: 14, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
    mainDisplayText: { color: '#000', fontSize: 48, fontWeight: '900' },

    keypadGrid: { gap: 12 },
    keyRow: { flexDirection: 'row', gap: 12 },
    key: { height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    keyText: { fontSize: 20, fontWeight: '800' }
});

export default CalculatorModal;
