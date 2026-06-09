import { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadChatMedia, UploadedAttachment } from '@/services/chatMediaUpload';
import { useAuth } from '@/auth/useAuth';
import { useToast } from '@/components/Toast';

interface Props {
  allowFiles?: boolean;
  size?: number;
  onPicked: (a: UploadedAttachment) => void;
}

export function MediaPickerButton({ allowFiles = false, size = 38, onPicked }: Props) {
  const { session } = useAuth();
  const myId = session?.user?.id;
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  function openMenu() {
    if (!myId) return;
    Alert.alert(
      'Anhang',
      undefined,
      [
        {
          text: 'Foto / GIF aus Galerie',
          onPress: async () => pickFromLibrary(),
        },
        {
          text: 'Foto aufnehmen',
          onPress: async () => pickFromCamera(),
        },
        ...(allowFiles
          ? [
              {
                text: 'Datei',
                onPress: async () => pickFile(),
              },
            ]
          : []),
        { text: 'Abbrechen', style: 'cancel' as const },
      ],
      { cancelable: true },
    );
  }

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.show('Fotozugriff abgelehnt', 'error');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.85,
      allowsEditing: false,
    });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    const isGif = a.uri.toLowerCase().endsWith('.gif') || a.mimeType === 'image/gif';
    await handleUpload(a.uri, isGif ? 'gif' : 'image', a.fileName ?? undefined);
  }

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      toast.show('Kamera abgelehnt', 'error');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (res.canceled || !res.assets[0]) return;
    await handleUpload(res.assets[0].uri, 'image');
  }

  async function pickFile() {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    await handleUpload(a.uri, 'file', a.name);
  }

  async function handleUpload(uri: string, kind: 'image' | 'gif' | 'file', name?: string) {
    if (!myId) return;
    setUploading(true);
    try {
      const result = await uploadChatMedia(uri, myId, kind, name);
      onPicked(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload fehlgeschlagen';
      toast.show(msg, 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <TouchableOpacity
      onPress={openMenu}
      disabled={uploading}
      style={[styles.btn, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityLabel="attach-media"
    >
      {uploading ? <ActivityIndicator color="#666" size="small" /> : <Text style={styles.icon}>+</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22, color: '#444', fontWeight: '600', marginTop: -2 },
});
