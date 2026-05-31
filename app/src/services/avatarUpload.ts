import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/services/supabase';

/**
 * Lädt ein Avatar in setup-assets/avatars/<userId>/... hoch
 * und gibt die Public-URL zurück.
 */
export async function uploadAvatar(localUri: string, userId: string): Promise<string> {
  const extMatch = localUri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const path = `avatars/${userId}/${Date.now()}.${ext}`;

  const info = await FileSystem.getInfoAsync(localUri);
  if (!info.exists) throw new Error('Datei nicht gefunden');

  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const { error } = await supabase.storage
    .from('setup-assets')
    .upload(path, bytes, { contentType, upsert: false });
  if (error) throw new Error(error.message);

  return supabase.storage.from('setup-assets').getPublicUrl(path).data.publicUrl;
}
