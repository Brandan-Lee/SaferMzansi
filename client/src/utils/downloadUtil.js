import * as FileSystem from 'expo-file-system/legacy';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { supabase } from '@config/supabase_client';
import JSZip from 'jszip';
import { Buffer } from 'buffer';

const EVIDENCE_BUCKET = 'EvidenceVault';

const cleanupFiles = async (paths) => {
    await Promise.all(paths.map(p => FileSystem.deleteAsync(p, { idempotent: true }).catch(() => { })));
};

export const downloadToDownloadsDirectory = async (filePath, localFileName) => {
    try {
        const signedUrl = await getDownloadUrl(filePath);

        const tempLocalUri = `${FileSystem.documentDirectory}${localFileName}`;
        const downloadRes = await FileSystem.downloadAsync(signedUrl, tempLocalUri);

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

                await FileSystem.deleteAsync(downloadRes.uri, { idempotent: true }).catch(() => { });
            } else {
                throw new Error('Folder access permission denied.');
            }
        } else {
            await Sharing.shareAsync(downloadRes.uri, {
                UTI: 'public.item',
                dialogTitle: 'Save File',
            });

            await FileSystem.deleteAsync(downloadRes.uri, { idempotent: true }).catch(() => { });
        }
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
};

export const downloadFilesAsZip = async (files, zipFileName = "Evidence_Bundle.zip") => {
    const zip = new JSZip();
    const tempPaths = [];
    let androidDirectoryUri = null;

    try {
        if (Platform.OS === 'android') {
            const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!permissions.granted) {
                throw new Error('Folder access permission denied.');
            }
            androidDirectoryUri = permissions.directoryUri;
        }

        for (const file of files) {
            const signedUrl = await getDownloadUrl(file.remotePath);

            const tempUri = `${FileSystem.documentDirectory}${Date.now()}_${file.localName}`;
            tempPaths.push(tempUri);

            await FileSystem.downloadAsync(signedUrl, tempUri);
            const base64Data = await FileSystem.readAsStringAsync(tempUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            zip.file(file.localName, Buffer.from(base64Data, 'base64'));
        }

        const zipBase64 = await zip.generateAsync({ type: 'base64' });
        const tempZipUri = `${FileSystem.documentDirectory}${zipFileName}`;
        tempPaths.push(tempZipUri);

        await FileSystem.writeAsStringAsync(tempZipUri, zipBase64, {
            encoding: FileSystem.EncodingType.Base64,
        });

        if (Platform.OS === 'android') {
            const createdUri = await StorageAccessFramework.createFileAsync(
                androidDirectoryUri,
                zipFileName,
                'application/zip'
            );

            await FileSystem.writeAsStringAsync(createdUri, zipBase64, {
                encoding: FileSystem.EncodingType.Base64,
            });
        } else {
            await Sharing.shareAsync(tempZipUri, {
                UTI: 'com.pkware.zip',
                dialogTitle: 'Save Zip Bundle Archive',
            });
        }

        await cleanupFiles(tempPaths);
        return true;

    } catch (error) {
        console.error('ZIP compilation failed:', error);
        await cleanupFiles(tempPaths);
        throw error;
    }
};

const getDownloadUrl = async (filePath) => {
    if (filePath.startsWith("http")) return filePath;

    const { data, error } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .createSignedUrl(filePath, 60);
    if (error) throw error;
    return data.signedUrl;
};
