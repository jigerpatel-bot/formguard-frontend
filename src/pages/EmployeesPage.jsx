import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/Layout';
import { Avatar, StatusPill, Card, Modal, Field, LoadingSpinner, EmptyState, PageHeader } from '../components/shared';
import { employees as empApi } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();

  const [emps, setEmps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [showInvite, setShowInvite] = useState(searchParams.get('invite') === '1');
  const [inviteForm, setInviteForm] = useState({ firstName:'', lastName:'', email:'', jobTitle:'' });
  const [inviting, setInviting] = useState(false);

  const TABS = ['Active', 'On leave', 'Terminated'];
  const STATUS_FILTER = ['active', 'on_leave', 'terminated'];

  useEffect(() => { loadEmps(); }, [activeTab]);

  const loadEmps = async () => {
    setLoading(true);
    try {
      const data = await empApi.list({
        search,
        status: STATUS_FILTER[activeTab] === 'active' ? undefined : STATUS_FILTER[activeTab],
      });
      setEmps(data.employees || []);
    } catch (err) {
      error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    // Debounce
    clearTimeout(window._searchTimeout);
    window._searchTimeout = setTimeout(loadEmps, 400);
  };

  const handleInvite = async () => {
    if (!inviteForm.firstName || !inviteForm.email) return;
    setInviting(true);
    try {
      await empApi.invite(inviteForm);
      success(`Invite sent to ${inviteForm.email}`);
      setShowInvite(false);
      setInviteForm({ firstName:'', lastName:'', email:'', jobTitle:'' });
      loadEmps();
    } catch (err) {
      error(err.message);
    } finally {
      setInviting(false);
    }
  };

  const setIF = (k, v) => setInviteForm(p => ({ ...p, [k]: v }));

  return (
    <AppShell>
      <PageHeader
        title="Employees"
        subtitle={`${emps.length} ${TABS[activeTab].toLowerCase()} employees`}
        action={<button className="btn-primary" onClick={() => setShowInvite(true)}>+ Invite employee</button>}
      />
      <div className="tab-bar">
        {TABS.map((t, i) => (
          <div key={t} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>
        ))}
      </div>
      <div className="page">
        <div style={{ marginBottom: 12 }}>
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={handleSearch}
            style={{ maxWidth: 280 }}
          />
        </div>

        {loading ? <LoadingSpinner center /> : (
          <Card>
            {/* Table header */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 80px', padding:'7px 16px', borderBottom:'1px solid var(--border)' }}>
              {['EMPLOYEE','DEPARTMENT','W-4','I-9',''].map(h => (
                <span key={h} style={{ fontSize:10, fontWeight:600, color:'var(--hint)', letterSpacing:'0.05em' }}>{h}</span>
              ))}
            </div>

            {emps.length === 0 ? (
              <EmptyState icon="👥" title="No employees yet" subtitle="Invite your first employee to get started." action={<button className="btn-primary" onClick={() => setShowInvite(true)}>+ Invite employee</button>} />
            ) : emps.map(e => (
              <div
                key={e.id}
                style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 80px', padding:'10px 16px', alignItems:'center', borderBottom:'1px solid #f3f4f6', cursor:'pointer' }}
                onClick={() => navigate(`/employees/${e.id}`)}
                onMouseEnter={ev => ev.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={ev => ev.currentTarget.style.background = ''}
              >
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Avatar name={`${e.first_name} ${e.last_name}`} size={30} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{e.first_name} {e.last_name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{e.job_title} · {e.email}</div>
                  </div>
                </div>
                <span style={{ fontSize:12, color:'var(--muted)' }}>{e.department_name || '—'}</span>
                <StatusPill status={e.w4_status} />
                <StatusPill status={e.i9_status} />
                <span style={{ fontSize:11, color:'var(--teal)' }}>View →</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <Modal title="Invite new employee" onClose={() => setShowInvite(false)}>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:18, lineHeight:1.6 }}>
            They'll receive a secure email link to complete their W-4, I-9, and company documents.
          </p>
          <div className="grid-2">
            <Field label="First name" required><input value={inviteForm.firstName} onChange={e=>setIF('firstName',e.target.value)} placeholder="Carlos" /></Field>
            <Field label="Last name"><input value={inviteForm.lastName} onChange={e=>setIF('lastName',e.target.value)} placeholder="Rivera" /></Field>
          </div>
          <Field label="Email address" required><input type="email" value={inviteForm.email} onChange={e=>setIF('email',e.target.value)} placeholder="carlos@email.com" /></Field>
          <Field label="Job title"><input value={inviteForm.jobTitle} onChange={e=>setIF('jobTitle',e.target.value)} placeholder="Server, Cook, Manager..." /></Field>

          <div className="info-box info-teal" style={{ marginBottom:18 }}>
            📧 Employee will receive a secure link valid for 72 hours. A complete onboarding checklist will be generated automatically based on your state requirements.
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button className="btn-ghost" style={{ flex:1 }} onClick={() => setShowInvite(false)}>Cancel</button>
            <button
              className="btn-primary"
              style={{ flex:2 }}
              onClick={handleInvite}
              disabled={inviting || !inviteForm.firstName || !inviteForm.email}
            >
              {inviting ? 'Sending...' : 'Send invite →'}
            </button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
