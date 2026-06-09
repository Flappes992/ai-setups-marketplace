import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getServiceClient, getAuthedUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Account-Löschung (Apple 5.1.1(v) + DSGVO Art. 17).
 *
 * Sicherheit: Die zu löschende User-ID wird AUSSCHLIESSLICH aus dem verifizierten
 * Bearer-Token abgeleitet, nie aus dem Body — sonst könnte jeder jeden Account löschen.
 *
 * Strategie:
 *  - Persönliche Daten/UGC: hart löschen
 *  - setups: status='removed' (bleiben Referenz-Anker für purchases)
 *  - profiles: anonymisieren + deleted_at (Anker für purchases erhalten)
 *  - auth-User: bannen + E-Mail auf Tombstone (cascade-sicher; kein Hard-Delete,
 *    damit die anonymisierte profiles-Zeile + purchases erhalten bleiben)
 *  - purchases: unangetastet — Stripe ist Finanz-System-of-Record (GoBD)
 */
export async function POST(req: NextRequest) {
  try {
    const admin = getServiceClient();
    if (!admin) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    // 1. User-ID aus verifiziertem Bearer-Token (NIE aus dem Body → kein IDOR)
    const userId = await getAuthedUserId(req, admin);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Persönliche Daten löschen / setups & profile anonymisieren
    await deleteUserData(admin, userId);

    // 3. Auth-User unbrauchbar machen (bannen + E-Mail-Tombstone)
    const { error: banErr } = await admin.auth.admin.updateUserById(userId, {
      email: `deleted+${userId}@setiq.invalid`,
      ban_duration: '876000h', // ~100 Jahre = de facto permanent
      user_metadata: {},
    });
    if (banErr) {
      return NextResponse.json(
        { error: `auth disable failed: ${banErr.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function deleteUserData(db: SupabaseClient, userId: string) {
  // Reihenfolge: Kinder vor Eltern, damit keine FK-Verletzung auftritt.
  const step = async (label: string, p: PromiseLike<{ error: unknown }>) => {
    const { error } = await p;
    if (error) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error);
      throw new Error(`delete step "${label}" failed: ${msg}`);
    }
  };

  // Likes auf Kommentare (eigene), dann eigene Kommentare (cascadet Replies/comment_likes)
  await step('comment_likes', db.from('comment_likes').delete().eq('user_id', userId));
  await step('comments', db.from('comments').delete().eq('user_id', userId));

  // Setup-Interaktionen
  await step('likes', db.from('likes').delete().eq('user_id', userId));
  await step('saves', db.from('saves').delete().eq('user_id', userId));
  await step('reviews', db.from('reviews').delete().eq('user_id', userId));
  await step('user_achievements', db.from('user_achievements').delete().eq('user_id', userId));

  // Social-Graph (beide Richtungen)
  await step('follows', db.from('follows').delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`));
  await step('blocks', db.from('blocks').delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`));

  // Bewerbungen + eigene Reports
  await step('creator_applications', db.from('creator_applications').delete().eq('user_id', userId));
  await step('reports', db.from('reports').delete().eq('reporter_id', userId));

  // Direktnachrichten: erst Nachrichten in betroffenen Konversationen, dann Konversationen
  const { data: convs, error: convErr } = await db
    .from('conversations')
    .select('id')
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`);
  if (convErr) throw new Error(`load conversations failed: ${convErr.message}`);
  const convIds = (convs ?? []).map((c: { id: string }) => c.id);
  if (convIds.length > 0) {
    await step('messages(in convs)', db.from('messages').delete().in('conversation_id', convIds));
    await step('conversations', db.from('conversations').delete().in('id', convIds));
  }
  // Sicherheitsnetz: einzelne Nachrichten, die der User woanders gesendet hat
  await step('messages(by sender)', db.from('messages').delete().eq('sender_id', userId));

  // Bundles des Creators: erst bundle_items, dann bundles
  const { data: bundles, error: bundleErr } = await db
    .from('bundles')
    .select('id')
    .eq('creator_id', userId);
  if (bundleErr) throw new Error(`load bundles failed: ${bundleErr.message}`);
  const bundleIds = (bundles ?? []).map((b: { id: string }) => b.id);
  if (bundleIds.length > 0) {
    await step('bundle_items', db.from('bundle_items').delete().in('bundle_id', bundleIds));
    await step('bundles', db.from('bundles').delete().in('id', bundleIds));
  }

  // Setups vom Markt nehmen (NICHT löschen — purchases.setup_id bleibt gültig)
  await step('setups', db.from('setups').update({ status: 'removed' }).eq('creator_id', userId));

  // Profil anonymisieren (Zeile bleibt als Anker für purchases/removed setups)
  const short = userId.replace(/-/g, '').slice(0, 8);
  await step(
    'profiles',
    db
      .from('profiles')
      .update({
        username: `deleted_${short}`,
        display_name: 'Gelöschter Nutzer',
        bio: null,
        avatar_url: null,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', userId),
  );
}
