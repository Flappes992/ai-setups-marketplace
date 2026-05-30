import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/services/supabase';

interface UploadResult {
  publicUrl: string;
  path: string;
}

function inferExtension(uri: string, fallback: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : fallback;
}

function inferContentType(ext: string): string {
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    m4v: 'video/x-m4v',
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
  };
  return map[ext] ?? 'application/octet-stream';
}

/**
 * Lädt eine lokale Datei (vom Picker/Cache) nach Supabase Storage.
 * Pfad: <userId>/<timestamp>-<random>.<ext>
 */
export async function uploadFileToStorage(
  bucket: 'setup-videos' | 'setup-assets',
  localUri: string,
  userId: string,
  fallbackExt: 'mp4' | 'pdf',
): Promise<UploadResult> {
  const ext = inferExtension(localUri, fallbackExt);
  const contentType = inferContentType(ext);
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const fileInfo = await FileSystem.getInfoAsync(localUri);
  if (!fileInfo.exists) {
    throw new Error('Datei nicht gefunden');
  }

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: 'base64',
  });
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(`Upload fehlgeschlagen: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}
