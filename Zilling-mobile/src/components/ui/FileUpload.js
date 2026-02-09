import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Upload, FileText, X, Image as ImageIcon } from 'lucide-react-native';

export const FileUpload = ({ value, onChange, accept, maxSize, onPress }) => {

    const handlePress = () => {
        if (onPress) {
            onPress();
            return;
        }
        Alert.alert(
            'Upload Receipt',
            'File picker integration required. Please install expo-document-picker or react-native-image-picker.',
            [
                { text: 'OK' }
            ]
        );
        // Simulation of file selection
        // In a real app:
        // const result = await DocumentPicker.getDocumentAsync({ type: accept });
        // if (!result.canceled) onChange(result.assets[0]);
    };

    // Normalize value to object if string
    const fileObj = typeof value === 'string' ? { uri: value, name: 'Attached Receipt' } : value;
    const isPdf = fileObj?.name?.toLowerCase().endsWith('.pdf') || fileObj?.mimeType === 'application/pdf' || fileObj?.uri?.toLowerCase().endsWith('.pdf');

    return (
        <View style={styles.container}>
            {!fileObj ? (
                <TouchableOpacity style={styles.dropzone} onPress={handlePress}>
                    <View style={styles.iconCircle}>
                        <Upload size={24} color="#2563eb" />
                    </View>
                    <Text style={styles.title}>Tap to upload receipt</Text>
                    <Text style={styles.subtitle}>Images or PDF up to 5MB</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                        <View style={styles.fileInfo}>
                            {isPdf ? (
                                <FileText size={20} color="#2563eb" />
                            ) : (
                                <ImageIcon size={20} color="#2563eb" />
                            )}
                            <Text style={styles.fileName} numberOfLines={1}>
                                {fileObj.name || 'Selected File'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => onChange(null)} style={styles.removeBtn}>
                            <X size={18} color="#ef4444" />
                        </TouchableOpacity>
                    </View>

                    {!isPdf && fileObj.uri && (
                        <Image source={{ uri: fileObj.uri }} style={styles.imagePreview} />
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    dropzone: {
        height: 120,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    previewCard: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    fileName: {
        fontSize: 13,
        fontWeight: '500',
        color: '#334155',
    },
    removeBtn: {
        padding: 4,
    },
    imagePreview: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
});
