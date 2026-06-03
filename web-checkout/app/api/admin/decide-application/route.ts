import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const key = form.get('key')?.toString();
  const userId = form.get('user_id')?.toString();
  const decision = form.get('decision')?.toString();

  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || key !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!userId || !decision || !['approve', 'reject'].includes(decision)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const status = decision === 'approve' ? 'approved' : 'rejected';
  await supabase
    .from('creator_applications')
    .update({ status, decided_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (decision === 'approve') {
    await supabase
      .from('profiles')
      .update({ tier: 'creator', tier_changed_at: new Date().toISOString() })
      .eq('id', userId);
  }

  return NextResponse.redirect(new URL(`/admin?key=${key}`, req.url));
}
