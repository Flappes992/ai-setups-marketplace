import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser } from '@/lib/push';

export const dynamic = 'force-dynamic';

/**
 * Setup-Moderation: ein eingereichtes Setup (status='review') freigeben oder ablehnen.
 * Geschützt über ADMIN_KEY (wie decide-application). Benachrichtigt den Creator per Push.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const key = form.get('key')?.toString();
  const setupId = form.get('setup_id')?.toString();
  const decision = form.get('decision')?.toString();

  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || key !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!setupId || !decision || !['approve', 'reject'].includes(decision)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const status = decision === 'approve' ? 'live' : 'removed';
  const { data: updated } = await supabase
    .from('setups')
    .update({ status })
    .eq('id', setupId)
    .eq('status', 'review') // nur eingereichte moderieren
    .select('title, creator_id')
    .single();

  if (updated?.creator_id) {
    await sendPushToUser(
      supabase,
      updated.creator_id,
      decision === 'approve'
        ? { title: 'Freigegeben ✅', body: `„${updated.title}" ist jetzt live.`, data: { type: 'moderation' } }
        : {
            title: 'Nicht freigegeben',
            body: `„${updated.title}" hat die Prüfung nicht bestanden.`,
            data: { type: 'moderation' },
          },
    );
  }

  return NextResponse.redirect(new URL(`/admin?key=${key}`, req.url));
}
