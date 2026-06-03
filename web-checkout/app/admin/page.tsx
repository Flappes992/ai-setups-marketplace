import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ key?: string }>;
}

interface ProfileLite {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  tier: string;
}

interface Application {
  user_id: string;
  status: string;
  note: string | null;
  created_at: string;
  profile?: ProfileLite;
}

interface Report {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  created_at: string;
  reporter?: ProfileLite;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || params.key !== adminKey) {
    return (
      <main style={pageStyle}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Setiq Admin</h1>
        <p style={{ marginTop: 10, opacity: 0.6 }}>
          Zugriff verweigert — Admin-Key fehlt in URL: <code>?key=…</code>
        </p>
      </main>
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return <main style={pageStyle}>Server not configured</main>;
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const [{ data: apps }, { data: reports }] = await Promise.all([
    supabase
      .from('creator_applications')
      .select('user_id, status, note, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('reports')
      .select('id, reporter_id, target_type, target_id, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const allUserIds = new Set<string>([
    ...((apps as Application[] | null) ?? []).map((a) => a.user_id),
    ...((reports as Report[] | null) ?? []).map((r) => r.reporter_id),
  ]);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, tier')
    .in('id', [...allUserIds]);
  const pmap = new Map<string, ProfileLite>();
  for (const p of (profiles as ProfileLite[] | null) ?? []) pmap.set(p.id, p);

  const applications = ((apps as Application[] | null) ?? []).map((a) => ({
    ...a,
    profile: pmap.get(a.user_id),
  }));
  const reportRows = ((reports as Report[] | null) ?? []).map((r) => ({
    ...r,
    reporter: pmap.get(r.reporter_id),
  }));

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <main style={pageStyle}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Setiq Admin</h1>
        <span style={{ fontSize: 12, opacity: 0.6 }}>
          {applications.length} apps · {pendingCount} pending · {reportRows.length} reports
        </span>
      </header>

      <section style={section}>
        <h2 style={h2}>Creator Applications</h2>
        {applications.length === 0 ? (
          <p style={{ opacity: 0.5 }}>Keine Anträge.</p>
        ) : (
          applications.map((a) => (
            <ApplicationRow key={a.user_id} app={a} adminKey={adminKey} />
          ))
        )}
      </section>

      <section style={section}>
        <h2 style={h2}>Reports</h2>
        {reportRows.length === 0 ? (
          <p style={{ opacity: 0.5 }}>Keine Reports.</p>
        ) : (
          reportRows.map((r) => <ReportRow key={r.id} report={r} />)
        )}
      </section>
    </main>
  );
}

function ApplicationRow({ app, adminKey }: { app: Application; adminKey: string }) {
  const statusColor =
    app.status === 'pending' ? '#fbbf24' : app.status === 'approved' ? '#2DD4BF' : '#ef4444';
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <strong>{app.profile?.display_name ?? '—'}</strong>{' '}
          <span style={{ opacity: 0.6 }}>@{app.profile?.username ?? 'unknown'}</span>
          <span
            style={{
              marginLeft: 12,
              padding: '2px 8px',
              borderRadius: 6,
              backgroundColor: statusColor,
              color: '#0b3b35',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {app.status}
          </span>
          <span style={{ marginLeft: 12, opacity: 0.5, fontSize: 12 }}>
            {new Date(app.created_at).toLocaleString('de-DE')}
          </span>
        </div>
        {app.status === 'pending' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <form action="/api/admin/decide-application" method="POST">
              <input type="hidden" name="key" value={adminKey} />
              <input type="hidden" name="user_id" value={app.user_id} />
              <input type="hidden" name="decision" value="approve" />
              <button type="submit" style={btnApprove}>Approve</button>
            </form>
            <form action="/api/admin/decide-application" method="POST">
              <input type="hidden" name="key" value={adminKey} />
              <input type="hidden" name="user_id" value={app.user_id} />
              <input type="hidden" name="decision" value="reject" />
              <button type="submit" style={btnReject}>Reject</button>
            </form>
          </div>
        )}
      </div>
      {app.note && (
        <p style={{ marginTop: 8, marginBottom: 0, fontSize: 13, lineHeight: 1.5 }}>{app.note}</p>
      )}
    </div>
  );
}

function ReportRow({ report }: { report: Report }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 6,
              backgroundColor: '#ef4444',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {report.target_type}
          </span>{' '}
          <code style={{ fontSize: 12, opacity: 0.7 }}>{report.target_id.slice(0, 12)}…</code>
        </div>
        <span style={{ opacity: 0.5, fontSize: 12 }}>
          {new Date(report.created_at).toLocaleString('de-DE')}
        </span>
      </div>
      <p style={{ marginTop: 8, marginBottom: 4, fontSize: 13 }}>
        {report.reason ?? '(kein Grund angegeben)'}
      </p>
      <small style={{ opacity: 0.6 }}>
        Reporter: @{report.reporter?.username ?? 'unknown'}
      </small>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: 32,
  fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  background: '#181B22',
  color: '#fff',
  maxWidth: 900,
  margin: '0 auto',
};
const section: React.CSSProperties = { marginTop: 32 };
const h2: React.CSSProperties = { fontSize: 16, margin: 0, marginBottom: 12, opacity: 0.7 };
const card: React.CSSProperties = {
  background: '#22262e',
  padding: 14,
  borderRadius: 10,
  marginBottom: 10,
};
const btnApprove: React.CSSProperties = {
  background: '#2DD4BF',
  color: '#0b3b35',
  border: 'none',
  padding: '6px 12px',
  borderRadius: 6,
  fontWeight: 800,
  fontSize: 12,
  cursor: 'pointer',
};
const btnReject: React.CSSProperties = {
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  padding: '6px 12px',
  borderRadius: 6,
  fontWeight: 800,
  fontSize: 12,
  cursor: 'pointer',
};
