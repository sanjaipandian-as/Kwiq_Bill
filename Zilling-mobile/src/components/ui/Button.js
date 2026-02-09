import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';

export const Button = ({
    children,
    title,
    icon,
    onPress,
    variant = 'default', // default, outline, ghost, destructive
    size = 'default', // default, sm, lg, icon
    className = '',
    isLoading = false,
    disabled = false,
    ...props
}) => {
    const getVariantStyle = () => {
        switch (variant) {
            case 'outline': return styles.outline;
            case 'ghost': return styles.ghost;
            case 'destructive': return styles.destructive;
            default: return styles.default;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'outline': return styles.textOutline;
            case 'ghost': return styles.textGhost;
            case 'destructive': return styles.textDestructive;
            default: return styles.textDefault;
        }
    };

    const getSizeStyle = () => {
        switch (size) {
            case 'sm': return styles.sizeSm;
            case 'lg': return styles.sizeLg;
            case 'icon': return styles.sizeIcon;
            default: return styles.sizeDefault;
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <ActivityIndicator color={variant === 'default' ? '#fff' : '#2563eb'} />;
        }

        const label = title || (typeof children === 'string' ? children : null);
        const otherChildren = !title && typeof children !== 'string' ? children : null;

        return (
            <View style={styles.contentWrapper}>
                {icon && <View style={(label || otherChildren) ? { marginRight: 8 } : {}}>{icon}</View>}
                {label && <Text style={[styles.textBase, getTextStyle()]}>{label}</Text>}
                {otherChildren}
            </View>
        );
    };

    return (
        <TouchableOpacity
            style={[
                styles.base,
                getVariantStyle(),
                getSizeStyle(),
                disabled && styles.disabled,
                props.style
            ]}
            onPress={onPress}
            disabled={disabled || isLoading}
            activeOpacity={0.7}
            {...props}
        >
            {renderContent()}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    contentWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    default: { backgroundColor: '#000000' },
    outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#000000' },
    ghost: { backgroundColor: 'transparent' },
    destructive: { backgroundColor: '#ef4444' },

    disabled: { opacity: 0.5, backgroundColor: '#e2e8f0' },

    sizeDefault: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
    sizeSm: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
    sizeLg: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14 },
    sizeIcon: { padding: 8, width: 44, height: 44, borderRadius: 12 },

    textBase: { fontWeight: '800', fontSize: 15, letterSpacing: -0.2 },
    textDefault: { color: '#ffffff' },
    textOutline: { color: '#000000' },
    textGhost: { color: '#000000' },
    textDestructive: { color: '#ffffff' },
});
