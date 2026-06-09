import * as FileSystem from 'expo-file-system/legacy';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import { supabase } from '@/services/supabase';

export type AttachmentKind = 'image' | 'gif' | 'file';

export interface UploadedAttachment {
  url: string;
  type: AttachmentKind;
  name: string;
  sizeBytes: number;
}

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function guessMime(name: string, kind: AttachmentKind): string {
  const ext = extOf(name);
  if (kind === 'gif') return 'image/gif';
  if (kind === 'image') {
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'heic') return 'image/heic';
    return 'image/jpeg';
  }
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'mov') return 'video/quicktime';
  return 'application/octet-stream';
}

export async function uploadChatMedia(
  localUri: string,
  userId: string,
  kind: AttachmentKind,
  originalName?: string,
): Promise<UploadedAttachment> {
  const fileName = originalName ?? `${Date.now()}.${kind === 'gif' ? 'gif' : kind === 'image' ? 'jpg' : 'bin'}`;
  const path = `${userId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const contentType = guessMime(fileName, kind);

  const info = await FileSystem.getInfoAsync(localUri);
  const sizeBytes = (info as { size?: number }).size ?? 0;

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const arrayBuffer = decodeBase64(base64);

  const { error } = await supabase.storage
    .from('chat-media')
    .upload(path, arrayBuffer, { contentType, upsert: false });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
  return { url: data.publicUrl, type: kind, name: fileName, sizeBytes };
}
