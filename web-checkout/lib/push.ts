import type { SupabaseClient } from '@supabase/supabase-js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Push an alle Geräte eines Users senden (über die Expo Push API).
 * Best-effort: Fehler werden geschluckt, ein fehlender Token darf nie
 * den auslösenden Vorgang (Nachricht, Kauf) kippen.
 */
export async function sendPushToUser(
  admin: SupabaseClient,
  userId: string,
  payload: PushPayload,
): Promise<void> {
  try {
    const { data: tokens } = await admin
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId);

    const messages = (tokens ?? [])
      .map((t: { token: string }) => t.token)
      .filter(Boolean)
      .map((to: string) => ({
        to,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }));

    if (messages.length === 0) return;

    for (let i = 0; i < messages.length; i += 100) {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages.slice(i, i + 100)),
      }).catch(() => {});
    }
  } catch {
    // Push darf den auslösenden Vorgang nie kippen
  }
}
