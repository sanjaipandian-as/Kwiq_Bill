import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react-native';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    variant = "danger"
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
        >
            <View style={styles.container}>
                <View style={styles.iconWrapper}>
                    <AlertTriangle
                        size={48}
                        color={variant === 'danger' ? '#ef4444' : '#f59e0b'}
                    />
                </View>

                <Text style={styles.message}>{message}</Text>

                <View style={styles.footer}>
                    <Button
                        title="Cancel"
                        onPress={onClose}
                        variant="outline"
                        style={styles.btn}
                    />
                    <Button
                        title="Confirm"
                        onPress={() => {
                            onConfirm();
                            onClose();
                        }}
                        variant={variant === 'danger' ? 'destructive' : 'default'}
                        style={styles.sbtn}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
    },
    iconWrapper: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 50,
        backgroundColor: '#fef2f2',
    },
    message: {
        fontSize: 16,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    btn: {
        flex: 1,
        text:'black',
        
    },
    sbtn:{
        flex: 1,
        text:'black',
        backgroundColor:'blue',
        padding:10,
        borderRadius:10
    }
});

export default ConfirmationModal;
