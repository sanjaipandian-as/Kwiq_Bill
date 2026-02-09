import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
// Using legacy import to avoid SDK 54 deprecation error for readAsStringAsync
// See: https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';

const ImportProductModal = ({ visible, onClose, onImport }) => {
    const [step, setStep] = useState('guide'); // 'guide' | 'preview'
    const [parsedData, setParsedData] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleFilePick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/json',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                    'application/vnd.ms-excel', // .xls
                    'text/csv' // .csv
                ],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            setLoading(true);

            // Small timeout to allow UI to render the loading state
            setTimeout(async () => {
                try {
                    const asset = result.assets ? result.assets[0] : result;
                    const fileUri = asset.uri;
                    const fileName = asset.name.toLowerCase();

                    let data = [];

                    if (fileName.endsWith('.json')) {
                        const fileContent = await FileSystem.readAsStringAsync(fileUri);
                        try {
                            data = JSON.parse(fileContent);
                        } catch (e) {
                            Alert.alert("Error", "Invalid JSON file");
                            setLoading(false);
                            return;
                        }
                    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
                        try {
                            let workbook;
                            // Handle CSV as String (UTF8) to avoid potential Base64 encoding issues with text files
                            if (fileName.endsWith('.csv')) {
                                const fileContent = await FileSystem.readAsStringAsync(fileUri, {
                                    encoding: 'utf8'
                                });
                                workbook = XLSX.read(fileContent, { type: 'string' });
                            } else {
                                const fileContent = await FileSystem.readAsStringAsync(fileUri, {
                                    encoding: 'base64'
                                });
                                workbook = XLSX.read(fileContent, { type: 'base64' });
                            }

                            const firstSheetName = workbook.SheetNames[0];
                            const sheet = workbook.Sheets[firstSheetName];
                            const rawData = XLSX.utils.sheet_to_json(sheet);

                            // Normalize Data
                            // Normalize Data
                            data = rawData.map(row => {
                                // Create a normalized map of keys for this row to handle "Product Name", "product_name", "Item-Name" etc.
                                const rowKeys = Object.keys(row);
                                const normalizedRow = {};
                                rowKeys.forEach(key => {
                                    // Remove symbols, whitespace, and lowercase
                                    const cleanKey = key.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                                    normalizedRow[cleanKey] = row[key];
                                });

                                const getVal = (possibleKeys) => {
                                    for (let k of possibleKeys) {
                                        const cleanSearch = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                                        if (normalizedRow[cleanSearch] !== undefined) return normalizedRow[cleanSearch];
                                    }
                                    return undefined;
                                };

                                return {
                                    name: getVal(['name', 'productname', 'itemname', 'item', 'description', 'title', 'product']) || 'Unknown Product',
                                    price: getVal(['price', 'sellingprice', 'mrp', 'rate', 'amount', 'cost', 'unitprice', 'salesprice']),
                                    sku: getVal(['sku', 'barcode', 'code', 'id', 'productid', 'itemcode']),
                                    category: getVal(['category', 'group', 'department', 'cat', 'type']),
                                    stock: getVal(['stock', 'qty', 'quantity', 'inventory', 'balance', 'count']),
                                    unit: getVal(['unit', 'uom', 'measurement']) || 'pcs',
                                    taxRate: getVal(['tax', 'taxrate', 'gst', 'vat']),
                                    variant: getVal(['variant', 'size', 'color', 'option'])
                                };
                            });
                        } catch (e) {
                            console.error("File Parse Error:", e);
                            Alert.alert("Error", "Failed to parse file. " + (e.message || ""));
                            setLoading(false);
                            return;
                        }
                    } else {
                        Alert.alert("Error", "Unsupported file type");
                        setLoading(false);
                        return;
                    }

                    // Strict Validation for Name
                    const validData = data.filter(d => d.name && d.name !== 'Unknown Product');

                    if (validData.length === 0) {
                        // Debug helper for User
                        let foundHeaders = "None";
                        if (data.length > 0 && typeof rawData !== 'undefined' && rawData.length > 0) {
                            foundHeaders = Object.keys(rawData[0]).join(', ');
                        }

                        Alert.alert(
                            "Mapping Failed",
                            `Could not find 'Name' column. Please check your file headers.\nFound Headers: ${foundHeaders}`
                        );
                        setLoading(false);
                        return;
                    } else {
                        setParsedData(validData);
                    }

                    setStep('preview');
                } catch (err) {
                    console.error("Import error:", err);
                    Alert.alert("Error", "Failed to import products.");
                } finally {
                    setLoading(false);
                }
            }, 100);

        } catch (err) {
            console.error("Pick error:", err);
            Alert.alert("Error", "Failed to pick file.");
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        onImport(parsedData);
        setStep('guide');
        setParsedData([]);
        onClose();
    };

    const handleCancel = () => {
        setStep('guide');
        setParsedData([]);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {step === 'guide' ? 'Import Products Guide' : 'Preview Import'}
                        </Text>
                        <TouchableOpacity onPress={handleCancel}>
                            <X size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView style={styles.content}>
                        {step === 'guide' ? (
                            <View>
                                <Text style={styles.subtitle}>
                                    Please ensure your file (.xlsx, .csv, .json) follows this format:
                                </Text>

                                {/* Template Visual */}
                                {/* Template Visual */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginBottom: 20 }}>
                                    <View style={styles.tableContainer}>
                                        <View style={styles.tableHeader}>
                                            <Text style={[styles.cell, styles.headerCell, { width: 120 }]}>Name *</Text>
                                            <Text style={[styles.cell, styles.headerCell, { width: 100 }]}>SKU/Barcode *</Text>
                                            <Text style={[styles.cell, styles.headerCell, { width: 80 }]}>Price *</Text>
                                            <Text style={[styles.cell, styles.headerCell, { width: 100 }]}>Category</Text>
                                            <Text style={[styles.cell, styles.headerCell, { width: 80 }]}>Stock</Text>
                                            <Text style={[styles.cell, styles.headerCell, { width: 60 }]}>Unit</Text>
                                            <Text style={[styles.cell, styles.headerCell, { width: 60 }]}>Tax %</Text>
                                            <Text style={[styles.cell, styles.headerCell, { width: 100 }]}>Variant</Text>
                                        </View>
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.cell, { width: 120 }]}>Amul Milk</Text>
                                            <Text style={[styles.cell, { width: 100 }]}>MILK-001</Text>
                                            <Text style={[styles.cell, { width: 80 }]}>35</Text>
                                            <Text style={[styles.cell, { width: 100 }]}>Dairy</Text>
                                            <Text style={[styles.cell, { width: 80 }]}>50</Text>
                                            <Text style={[styles.cell, { width: 60 }]}>pc</Text>
                                            <Text style={[styles.cell, { width: 60 }]}>0</Text>
                                            <Text style={[styles.cell, { width: 100 }]}>500ml</Text>
                                        </View>
                                        <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]}>
                                            <Text style={[styles.cell, { width: 120 }]}>Product Name</Text>
                                            <Text style={[styles.cell, { width: 100 }]}>Barcode Value</Text>
                                            <Text style={[styles.cell, { width: 80 }]}>Price</Text>
                                            <Text style={[styles.cell, { width: 100 }]}>Category of product</Text>
                                            <Text style={[styles.cell, { width: 80 }]}>Stock</Text>
                                            <Text style={[styles.cell, { width: 60 }]}>Unit</Text>
                                            <Text style={[styles.cell, { width: 60 }]}>Tax %</Text>
                                            <Text style={[styles.cell, { width: 100 }]}>Variant</Text>
                                        </View>
                                    </View>
                                </ScrollView>

                                <View style={styles.infoBox}>
                                    <AlertCircle size={16} color="#0284c7" />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.infoText}>
                                            Required: <Text style={{ fontWeight: 'bold' }}>Name</Text>, <Text style={{ fontWeight: 'bold' }}>SKU</Text> (Must be Unique), <Text style={{ fontWeight: 'bold' }}>Price</Text>.
                                        </Text>
                                        <Text style={[styles.infoText, { marginTop: 4, fontSize: 11 }]}>
                                            Defaults: Stock (0), Unit (pc), Tax (0).
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.uploadBtn} onPress={handleFilePick}>
                                    <Upload size={20} color="#fff" />
                                    <Text style={styles.uploadBtnText}>Select File</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View>
                                <View style={styles.successBanner}>
                                    <CheckCircle2 size={24} color="#16a34a" />
                                    <Text style={styles.successText}>Found {parsedData.length} valid products!</Text>
                                </View>

                                <Text style={styles.previewTitle}>Preview of Data:</Text>

                                {parsedData.slice(0, 5).map((item, index) => (
                                    <View key={index} style={styles.previewCard}>
                                        <View style={styles.previewHeader}>
                                            <Text style={styles.previewName}>{item.name}</Text>
                                            <Text style={styles.previewPrice}>₹{item.price}</Text>
                                        </View>
                                        <View style={styles.previewDetails}>
                                            <Text style={styles.previewTag}>SKU: {item.sku || 'N/A'}</Text>
                                            <Text style={styles.previewTag}>Cat: {item.category || 'General'}</Text>
                                            <Text style={styles.previewTag}>Qty: {item.stock || 0}</Text>
                                        </View>
                                    </View>
                                ))}

                                {parsedData.length > 5 && (
                                    <Text style={styles.moreText}>...and {parsedData.length - 5} more</Text>
                                )}
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        {step === 'preview' ? (
                            <>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setStep('guide')}>
                                    <Text style={styles.cancelBtnText}>Back</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                                    <Text style={styles.confirmBtnText}>Import {parsedData.length} Products</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Loading Overlay */}
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#ffffff" />
                        <Text style={styles.loadingText}>Processing File...</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContainer: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: '#fff',
        borderRadius: 16,
        maxHeight: '80%',
        overflow: 'hidden'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    content: {
        padding: 20
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16
    },
    tableContainer: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 20
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0'
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    cell: {
        flex: 1,
        padding: 10,
        fontSize: 12,
        color: '#334155'
    },
    headerCell: {
        fontWeight: 'bold',
        color: '#0f172a'
    },
    infoBox: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: '#f0f9ff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20
    },
    infoText: {
        fontSize: 12,
        color: '#0369a1',
        flex: 1
    },
    uploadBtn: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8
    },
    uploadBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#dcfce7',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20
    },
    successText: {
        color: '#15803d',
        fontWeight: 'bold',
        fontSize: 14
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 10
    },
    previewCard: {
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    previewName: {
        fontWeight: 'bold',
        color: '#0f172a',
        fontSize: 14
    },
    previewPrice: {
        fontWeight: 'bold',
        color: '#2563eb'
    },
    previewDetails: {
        flexDirection: 'row',
        gap: 12
    },
    previewTag: {
        fontSize: 11,
        color: '#64748b',
        backgroundColor: '#e2e8f0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4
    },
    moreText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: 8
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'flex-end'
    },
    cancelBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#cbd5e1'
    },
    cancelBtnText: {
        color: '#64748b',
        fontWeight: '600'
    },
    confirmBtn: {
        backgroundColor: '#2563eb',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8
    },
    confirmBtnText: {
        color: '#fff',
        fontWeight: '600'
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
        borderRadius: 16
    },
    loadingText: {
        color: '#fff',
        marginTop: 12,
        fontSize: 14,
        fontWeight: 'bold'
    }
});

export default ImportProductModal;
