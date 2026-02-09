import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncUserDataToDrive } from './googleDriveservices';

const STORAGE_KEY_BACKUP_URI = '@kwiqbilling_backup_uri';
const STORAGE_KEY_FILE_URIS = '@kwiqbilling_file_uris';

export const exportToDeviceFolders = async (allData, user = null) => {
    try {
        // --- 1. Cloud Sync (Auto) ---
        if (user && user.id) {
            console.log("Starting Auto-Sync to Drive...");
            syncUserDataToDrive(user, allData).then(res => {
                if (res) console.log("Drive Sync Completed.");
            }).catch(e => console.error("Drive Sync Failed:", e));
        }

        // --- 2. Local Device Backup ---
        const tables = Object.keys(allData);
        const SAF = FileSystem.StorageAccessFramework;

        if (Platform.OS === 'android' && SAF) {
            console.log("Checking for saved backup folder...");
            let rootUri = await AsyncStorage.getItem(STORAGE_KEY_BACKUP_URI);
            let permissionsGranted = false;

            // Verify access
            if (rootUri) {
                try {
                    await SAF.readDirectoryAsync(rootUri);
                    permissionsGranted = true;
                } catch (e) {
                    rootUri = null;
                }
            }

            // Request access
            if (!rootUri) {
                const permissions = await SAF.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                    rootUri = permissions.directoryUri;
                    await AsyncStorage.setItem(STORAGE_KEY_BACKUP_URI, rootUri);
                    permissionsGranted = true;
                }
            }

            if (permissionsGranted && rootUri) {
                let targetUri = rootUri;

                // --- User Specific Folder Logic ---
                if (user && user.id) {
                    const folderName = `KwiqBilling-${user.id}`;
                    // Try to create subfolder or find it
                    try {
                        const files = await SAF.readDirectoryAsync(rootUri);
                        // Check if folder exists by looking for encoded name
                        // Note: SAF URIs are complex. Best bet is to try create and catch "exists" or just blindly create
                        // makeDirectoryAsync usually throws if exists or returns new URI?
                        // Actually, SAF.makeDirectoryAsync returns the URI of the new directory.
                        // If it exists, it might throw.

                        targetUri = await SAF.makeDirectoryAsync(rootUri, folderName).catch(async (e) => {
                            // If fails, maybe it exists? Try to construct URI or find it?
                            // Finding is hard.
                            // Alternative: Just use root if subfolder fails, OR assume simple write.
                            // Let's rely on standard flat file backup if folder creation fails, 
                            // OR try to find the folder in the list.
                            const found = files.find(u => decodeURIComponent(u).endsWith(folderName));
                            if (found) return found;
                            console.warn("Could not create user folder, using root.", e);
                            return rootUri;
                        });
                        console.log("Backing up to folder:", targetUri);
                    } catch (e) {
                        console.warn("Folder creation error", e);
                    }
                }

                // Write Files
                let savedCount = 0;
                for (const tableName of tables) {
                    if (allData[tableName] && allData[tableName].length > 0) {
                        const fileName = `${tableName}.json`;
                        const dataString = JSON.stringify(allData[tableName], null, 2);

                        // Check existence in TARGET uri
                        const existingFiles = await SAF.readDirectoryAsync(targetUri);
                        let fileUri = existingFiles.find(u => decodeURIComponent(u).endsWith(fileName));

                        if (!fileUri) {
                            fileUri = await SAF.createFileAsync(targetUri, fileName, 'application/json');
                        }

                        await SAF.writeAsStringAsync(fileUri, dataString, { encoding: FileSystem.EncodingType.UTF8 });
                        savedCount++;
                    }
                }

                return { success: true, method: 'SAF', count: savedCount };
            }
        }

        // 3. Fallback: Sharing (Zips or Single File)
        // For simplicity, we stick to single file for sharing fallback as handling multiple files in sharing is complex without zip.
        // Or we can try to zip? 'expo-file-system' doesn't support zip natively.
        // Stick to Master Backup JSON for fallback.
        console.log("Using Sharing Fallback...");
        const masterBackupUri = FileSystem.cacheDirectory + (user ? `KwiqBilling_Backup_${user.id}.json` : 'KwiqBilling_Master_Backup.json');
        await FileSystem.writeAsStringAsync(masterBackupUri, JSON.stringify(allData, null, 2));

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(masterBackupUri);
            return { success: true, method: 'SHARE' };
        }

        return { success: false, error: 'No storage method available' };
    } catch (error) {
        console.error("Critical Backup Error:", error);
        return { success: false, error: error.message };
    }
};