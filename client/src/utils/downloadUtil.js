import * as FileSystem from 'expo-file-system/legacy';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import { supabase } from '@config/supabase_client';
import JSZip from 'jszip';
import { Buffer } from 'buffer';

// Helper to clean up an array of file URIs safely
const cleanupFiles = async (paths) => {
    await Promise.all(paths.map(p => FileSystem.deleteAsync(p, { idempotent: true }).catch(() => { })));
};

export const downloadToDownloadsDirectory = async (filePath, localFileName) => {
    try {
        // Generate a short-lived Signed URL from EvidenceVault
        const { data, error } = await supabase.storage
            .from('EvidenceVault')
            .createSignedUrl(filePath, 60);

        if (error) throw error;
        const signedUrl = data.signedUrl;

        // Define a temporary internal application route using legacy configuration
        const tempLocalUri = `${FileSystem.documentDirectory}${localFileName}`;

        // Download the asset into the app's internal sandbox area
        const downloadRes = await FileSystem.downloadAsync(signedUrl, tempLocalUri);
        console.log('Downloaded temporarily to:', downloadRes.uri);

        // Move to System Downloads Folder based on Platform
        if (Platform.OS === 'android') {
            const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

            if (permissions.granted) {
                const fileString = await FileSystem.readAsStringAsync(downloadRes.uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                const createdUri = await StorageAccessFramework.createFileAsync(
                    permissions.directoryUri,
                    localFileName,
                    'application/octet-stream'
                );

                await FileSystem.writeAsStringAsync(createdUri, fileString, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                // Clear temporary sandbox cache
                try {
                    await FileSystem.deleteAsync(downloadRes.uri, { idempotent: true });
                    console.log("Temporary sandbox cache cleared successfully.");
                } catch (cleanupError) {
                    console.warn("Non-blocking error cleaning up sandbox cache file:", cleanupError);
                }

                Alert.alert('Success', 'File saved directly to your selected folder.');
            } else {
                Alert.alert('Permission Denied', 'Cannot save file without folder access.');
            }
        } else {
            // iOS Implementation
            await Sharing.shareAsync(downloadRes.uri, {
                UTI: 'public.item',
                dialogTitle: 'Save File',
            });

            // Clear iOS temporary cache
            try {
                await FileSystem.deleteAsync(downloadRes.uri, { idempotent: true });
                console.log("Temporary iOS sandbox cache cleared successfully.");
            } catch (cleanupError) {
                console.warn("Non-blocking error cleaning up sandbox cache file:", cleanupError);
            }
        }

    } catch (error) {
        console.error('Download failed:', error);
        Alert.alert('Error', 'Failed to download file.');
        throw error;
    }
};

export const downloadFilesAsZip = async (files, zipFileName = "Evidence_Bundle.zip") => {
    const zip = new JSZip();
    const tempPaths = [];

    try {
        // Download and add files sequentially to cleanly allow UI text updates
        for (const file of files) {
            const { data, error } = await supabase.storage
                .from('EvidenceVault')
                .createSignedUrl(file.remotePath, 60);

            if (error) throw error;

            const tempUri = `${FileSystem.documentDirectory}${Date.now()}_${file.localName}`;
            tempPaths.push(tempUri);

            await FileSystem.downloadAsync(data.signedUrl, tempUri);
            const base64Data = await FileSystem.readAsStringAsync(tempUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            zip.file(file.localName, Buffer.from(base64Data, 'base64'));
            console.log(`Zipped file compiled internally: ${file.localName}`);
        }

        // Generate ZIP base64
        const zipBase64 = await zip.generateAsync({ type: 'base64' });
        const tempZipUri = `${FileSystem.documentDirectory}${zipFileName}`;
        tempPaths.push(tempZipUri);

        await FileSystem.writeAsStringAsync(tempZipUri, zipBase64, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Export based on platform
        if (Platform.OS === 'android') {
            const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!permissions.granted) throw new Error('Folder access permission denied.');

            const createdUri = await StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                zipFileName,
                'application/zip'
            );

            await FileSystem.writeAsStringAsync(createdUri, zipBase64, {
                encoding: FileSystem.EncodingType.Base64,
            });
            Alert.alert('Success', 'ZIP bundle saved successfully.');
        } else {
            await Sharing.shareAsync(tempZipUri, {
                UTI: 'com.pkware.zip',
                dialogTitle: 'Save Zip Bundle Archive',
            });
        }

        // Cleanup
        await cleanupFiles(tempPaths);
        return true;

    } catch (error) {
        console.error('ZIP compilation failed:', error);
        await cleanupFiles(tempPaths);
        Alert.alert('Error', 'Failed to compile and package the zipped download bundle.');
        throw error;
    }
};
