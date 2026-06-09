import type { NextRequest } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Service-Role-Client (umgeht RLS). null, wenn Env nicht konfiguriert.
 */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/**
 * Verifiziert das Bearer-JWT aus dem Authorization-Header und gibt die User-ID zurück.
 * SICHERHEIT: Aufrufende Routes MÜSSEN diese ID benutzen statt einer user_id aus dem Body,
 * sonst IDOR (jeder könnte fremde Accounts manipulieren).
 */
export async function getAuthedUserId(
  req: NextRequest,
  admin: SupabaseClient,
): Promise<string | null> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error) return null;
  return data?.user?.id ?? null;
}
