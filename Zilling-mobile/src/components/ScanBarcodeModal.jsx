import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    Vibration
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Maximize2, X } from 'lucide-react-native';
import { useProducts } from '../context/ProductContext';
import { addToBillingQueue } from '../services/billingQueue';
import { useToast } from '../context/ToastContext';

export default function ScanBarcodeModal({ visible, onClose, onScanned }) {
    const { products } = useProducts();
    const { showToast } = useToast();

    // Camera State
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (visible) {
            setScanned(false);
            if (!permission) {
                requestPermission();
            }
        }
    }, [visible, permission]);

    const handleBarCodeScanned = ({ type, data }) => {
        if (scanned) return;
        setScanned(true);
        console.log(`[Scanner] Scanned: ${data} (${type})`);

        // Feedback
        try {
            Vibration.vibrate();
        } catch (e) { }

        // Check if product exists - Normalized check
        const normalizedData = data.trim().toLowerCase();

        // Debug
        console.log(`[Scanner] Searching in ${products.length} products...`);

        const matchedProduct = products.find(p => {
            const sku = (p.sku || '').toLowerCase();
            const barcode = (p.barcode || '').toLowerCase(); // Ensure barcode field is checked
            return sku === normalizedData || barcode === normalizedData || p.id.toString() === data;
        });

        if (matchedProduct) {
            console.log(`[Scanner] Match found: ${matchedProduct.name}`);
            if (onScanned) {
                onScanned(matchedProduct);
            } else {
                addToBillingQueue(matchedProduct);
                showToast(`Added "${matchedProduct.name}"`, 'success');
            }

            // Auto-resume
            setTimeout(() => setScanned(false), 1500);

        } else {
            console.log(`[Scanner] No match found for: ${data}`);
            showToast(`Product not found: ${data}`, 'error');
            // Auto-resume
            setTimeout(() => setScanned(false), 2000);
        }
    };

    if (!visible) return null;

    if (!permission) {
        // Loading permission status
        return <View />;
    }

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>Camera permission is required to scan barcodes.</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Pressable onPress={requestPermission} style={styles.grantBtn}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Grant Permission</Text>
                        </Pressable>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Text style={{ color: 'white' }}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.cameraContainer}>
                <CameraView
                    key={visible ? 'active-cam' : 'inactive-cam'}
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"],
                    }}
                    onMountError={(error) => {
                        console.error('[Scanner] Mount Error:', error);
                        showToast('Camera failed to start', 'error');
                    }}
                />

                <SafeAreaView style={styles.cameraUi} edges={['top', 'left', 'right', 'bottom']}>
                    <View style={styles.camHeader}>
                        <Pressable onPress={onClose} style={styles.camCloseBtn}>
                            <X size={24} color="white" />
                        </Pressable>
                        <Text style={styles.camTitle}>Scan Product</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.camFocusArea}>
                        <View style={styles.laserLine} />
                        <Maximize2 size={260} color="rgba(255,255,255,0.5)" strokeWidth={1} />
                    </View>

                    <View style={styles.camFooter}>
                        <Text style={styles.camInstruction}>Align code within frame</Text>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    permissionContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    permissionText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20
    },
    grantBtn: {
        padding: 10,
        backgroundColor: '#2563eb',
        borderRadius: 8,
        marginRight: 10
    },
    closeBtn: {
        padding: 10,
        backgroundColor: '#ef4444',
        borderRadius: 8
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    cameraUi: {
        flex: 1,
        justifyContent: 'space-between',
    },
    camHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    camCloseBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    camTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    camFocusArea: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    laserLine: {
        width: '80%',
        height: 2,
        backgroundColor: '#ef4444',
        marginBottom: -1,
        zIndex: 10,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 5,
    },
    focusCorners: {
        opacity: 0.8,
    },
    camFooter: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    camInstruction: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '500',
    },
});
