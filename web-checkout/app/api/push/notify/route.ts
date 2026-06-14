import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient, getAuthedUserId } from '@/lib/auth';
import { sendPushToUser } from '@/lib/push';

export const dynamic = 'force-dynamic';

/**
 * Push-Benachrichtigung für eine neue Nachricht.
 *
 * Sicherheit: Der Aufrufer wird per Bearer-JWT verifiziert UND muss Teilnehmer
 * der Konversation sein (sonst könnte jeder beliebige Push auslösen). Benachrichtigt
 * wird ausschließlich der ANDERE Teilnehmer der Konversation.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = getServiceClient();
    if (!admin) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const userId = await getAuthedUserId(req, admin);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as {
      conversationId?: string;
      preview?: string;
      senderName?: string;
    };
    if (!body.conversationId) {
      return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
    }

    const { data: conv } = await admin
      .from('conversations')
      .select('participant_a, participant_b')
      .eq('id', body.conversationId)
      .single();

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    if (conv.participant_a !== userId && conv.participant_b !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const recipient = conv.participant_a === userId ? conv.participant_b : conv.participant_a;
    await sendPushToUser(admin, recipient, {
      title: body.senderName ? `Neue Nachricht von ${body.senderName}` : 'Neue Nachricht',
      body: (body.preview ?? '').slice(0, 120) || 'Du hast eine neue Nachricht.',
      data: { type: 'message', conversationId: body.conversationId },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
