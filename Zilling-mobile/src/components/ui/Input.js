import React, { forwardRef } from 'react';
import { TextInput, View, StyleSheet } from 'react-native';

export const Input = forwardRef(({ className, style, ...props }, ref) => {
    return (
        <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor="#94a3b8"
            {...props}
        />
    );
});

const styles = StyleSheet.create({
    input: {
        height: 48,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        fontSize: 16,
        color: '#000',
        fontWeight: '600'
    },
});
