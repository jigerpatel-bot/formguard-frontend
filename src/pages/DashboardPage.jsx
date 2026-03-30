import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/Layout';
import { StatGrid, Card, CardHead, Avatar, StatusPill, ProgressBar, LoadingSpinner, PageHeader } from '../components/shared';
import { employees as empApi, compliance, onboarding } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, c, cl] = await Promise.all([
        empApi.stats(),
        compliance.status(),
        onboarding.list({ status: 'in_progress', limit: 5 }),
      ]);
      setStats(s);
      setComplianceStatus(c);
      setChecklists(cl.checklists || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AppShell><LoadingSpinner center /></AppShell>;

  const statCards = [
    { label: 'Total employees', value: stats?.total_employees || 0, sub: '' },
    { label: 'Fully compliant', value: stats?.fully_complete || 0, color: 'var(--teal)', sub: 'All docs signed' },
    { label: 'Incomplete onboarding', value: stats?.in_progress || 0, color: '#BA7517', sub: 'Action needed' },
    { label: 'Missing documents', value: stats?.missing || 0, color: '#A32D2D', sub: 'I-9 not complete' },
  ];

  const alerts = [
    complianceStatus?.i9?.missing > 0 && {
      color: '#E24B4A', text: `${complianceStatus.i9.missing} employee(s) missing I-9`, action: 'View', dest: '/compliance',
    },
    complianceStatus?.w4?.missing > 0 && {
      color: '#E24B4A', text: `${complianceStatus.w4.missing} W-4 form(s) pending`, action: 'View', dest: '/onboarding',
    },
    complianceStatus?.i9?.pending > 0 && {
      color: '#EF9F27', text: `${complianceStatus.i9.pending} I-9 Section 2 awaiting employer`, action: 'Complete', dest: '/onboarding',
    },
  ].filter(Boolean);

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        subtitle={company?.name}
        action={<button className="btn-primary" onClick={() => navigate('/employees?invite=1')}>+ Add employee</button>}
      />
      <div className="tab-bar">
        {['Overview','This week','Reports'].map((t, i) => (
          <div key={t} className={`tab ${i === 0 ? 'active' : ''}`}>{t}</div>
        ))}
      </div>
      <div className="page">
        <StatGrid stats={statCards} />

        <div className="grid-2" style={{ gap: 14 }}>
          {/* Alerts */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 7 }}>Compliance alerts</div>
            <Card>
              {alerts.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
                  ✓ No active compliance issues
                </div>
              ) : alerts.map((a, i) => (
                <div key={i} className="table-row" onClick={() => navigate(a.dest)}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12 }}>{a.text}</div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--teal)', cursor: 'pointer' }}>{a.action} →</span>
                </div>
              ))}
            </Card>
          </div>

          {/* Onboarding progress */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 7 }}>Onboarding in progress</div>
            <Card>
              {checklists.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
                  No active onboarding
                </div>
              ) : checklists.map(cl => (
                <div key={cl.employee_id} className="table-row" onClick={() => navigate(`/onboarding/${cl.employee_id}`)}>
                  <Avatar name={`${cl.first_name} ${cl.last_name}`} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{cl.first_name} {cl.last_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{cl.job_title}</div>
                    <ProgressBar pct={cl.progress_pct || 0} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 32, textAlign: 'right' }}>
                    {cl.progress_pct || 0}%
                  </span>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
