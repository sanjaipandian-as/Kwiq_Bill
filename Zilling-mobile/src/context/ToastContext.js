import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    // Use a ref to keep track of toast IDs to ensure uniqueness
    const toastIdRef = useRef(0);

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = toastIdRef.current++;
        const newToast = { id, message, type };

        setToasts((prev) => [...prev, newToast]);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <View style={styles.container} pointerEvents="box-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </View>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onRemove }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                friction: 6,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    // Handle manual removal animation
    const handleRemove = () => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -20,
                duration: 250,
                useNativeDriver: true,
            })
        ]).start(() => onRemove());
    };

    // Updated Premium Styles
    const getStyles = () => {
        switch (toast.type) {
            case 'error': return { iconColor: '#ef4444', icon: AlertCircle };
            case 'info': return { iconColor: '#3b82f6', icon: Info };
            case 'success':
            default: return { iconColor: '#22c55e', icon: CheckCircle2 };
        }
    };

    const styleConfig = getStyles();
    const Icon = styleConfig.icon;

    return (
        <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: styleConfig.iconColor + '20' }]}>
                    <Icon size={18} color={styleConfig.iconColor} strokeWidth={2.5} />
                </View>
                <Text style={styles.message}>{toast.message}</Text>
                <TouchableOpacity onPress={handleRemove} style={styles.closeBtn}>
                    <X size={14} color="#666" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10000,
        paddingHorizontal: 20
    },
    toast: {
        width: '100%',
        maxWidth: 400,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: '#1e1e1e', // Soft black/dark grey
        borderWidth: 1,
        borderColor: '#333',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    message: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.3
    },
    closeBtn: {
        padding: 6,
        marginLeft: 8,
        backgroundColor: '#333',
        borderRadius: 10
    }
});

export default ToastProvider;
