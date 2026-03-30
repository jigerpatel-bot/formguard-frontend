/**
 * Stub pages — each loads real data from the API.
 * Full implementations follow the same pattern as DashboardPage and EmployeesPage.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/Layout';
import {
  Avatar, StatusPill, Card, CardHead, Modal, Field, LoadingSpinner,
  EmptyState, PageHeader, TabBar, StatGrid, InfoBox, ProgressBar,
} from '../components/shared';
import {
  employees as empApi, onboarding, writeups as wuApi,
  profiles, terminations, timeline as tlApi,
  compliance, forms, signatures, audit,
} from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

// ─── Employee Detail ──────────────────────────────────────────────────────
export function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [emp, setEmp] = useState(null);
  const [profile, setProfile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [showTermModal, setShowTermModal] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [eData, pData] = await Promise.all([
        empApi.get(id),
        profiles.get(id),
      ]);
      setEmp(eData);
      setProfile(pData.profile);
      setContacts(pData.emergencyContacts || []);
    } catch (err) { error('Failed to load employee'); }
    finally { setLoading(false); }
  };

  if (loading) return <AppShell><LoadingSpinner center /></AppShell>;
  if (!emp) return <AppShell><div className="page"><p>Employee not found.</p></div></AppShell>;

  const name = `${emp.first_name} ${emp.last_name}`;

  return (
    <AppShell>
      <PageHeader
        title={name}
        subtitle={`${emp.job_title} · ${emp.email}`}
        action={<>
          <button className="btn-ghost" onClick={() => navigate('/employees')}>← Back</button>
          <button className="btn-ghost" onClick={() => navigate(`/onboarding/${id}`)}>Onboarding</button>
          <button className="btn-ghost" onClick={() => navigate(`/timeline/${id}`)}>Timeline</button>
          {emp.employment_status === 'active' && (
            <button className="btn-danger" onClick={() => setShowTermModal(true)}>Terminate</button>
          )}
        </>}
      />
      <TabBar tabs={['Profile','Documents','Write-ups','Emergency contacts']} active={tab} onChange={setTab} />
      <div className="page">
        {tab === 0 && (
          <div className="grid-2">
            <Card>
              <CardHead title="Personal information" action={<button className="btn-ghost" style={{ fontSize:11, padding:'3px 8px' }}>Edit</button>} />
              <div style={{ padding:'12px 16px' }}>
                {[
                  ['Phone', profile?.phone || '—'],
                  ['Date of birth', profile?.dob ? new Date(profile.dob).toLocaleDateString() : '—'],
                  ['Address', profile?.address ? `${profile.address}, ${profile.city} ${profile.state}` : '—'],
                  ['Start date', profile?.start_date ? new Date(profile.start_date).toLocaleDateString() : '—'],
                  ['Employment type', profile?.employment_type?.replace(/_/g,' ') || '—'],
                  ['Department', profile?.department_name || '—'],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #f3f4f6', fontSize:12 }}>
                    <span style={{ color:'var(--muted)' }}>{k}</span>
                    <span style={{ fontWeight:500, textTransform:'capitalize' }}>{v}</span>
                  </div>
                ))}
              </div>
            </Card>
            <div>
              <Card style={{ marginBottom:12 }}>
                <CardHead title="Compliance status" />
                <div style={{ padding:'12px 16px' }}>
                  {[['W-4', emp.w4_status],['I-9', emp.i9_status]].map(([d,s]) => (
                    <div key={d} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid #f3f4f6' }}>
                      <span style={{ fontSize:12 }}>{d}</span>
                      <StatusPill status={s} />
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <CardHead title="HR notes (internal)" />
                <div style={{ padding:'12px 16px' }}>
                  <textarea
                    defaultValue={profile?.hr_notes || ''}
                    placeholder="Add internal HR notes..."
                    style={{ minHeight:80, border:'1px solid var(--border)', resize:'none' }}
                  />
                </div>
              </Card>
            </div>
          </div>
        )}
        {tab === 1 && (
          <Card>
            <CardHead title="Documents" />
            <div style={{ padding:'12px 16px' }}>
              <InfoBox type="teal">View all documents in the Document Library or employee's onboarding checklist.</InfoBox>
              <button className="btn-ghost" style={{ marginTop:12 }} onClick={() => navigate(`/onboarding/${id}`)}>View onboarding checklist →</button>
            </div>
          </Card>
        )}
        {tab === 2 && (
          <div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:10 }}>
              <button className="btn-primary" onClick={() => navigate('/writeups')}>+ New write-up</button>
            </div>
            <Card>
              <EmptyState icon="✎" title="No write-ups" subtitle="Create a write-up to document disciplinary actions." />
            </Card>
          </div>
        )}
        {tab === 3 && (
          <Card>
            <CardHead title="Emergency contacts" action={<button className="btn-primary" style={{ fontSize:11, padding:'4px 10px' }}>+ Add</button>} />
            {contacts.length === 0 ? (
              <EmptyState icon="👥" title="No emergency contacts" subtitle="Add an emergency contact for this employee." />
            ) : contacts.map(c => (
              <div key={c.id} style={{ padding:'12px 16px', borderBottom:'1px solid #f3f4f6' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:500 }}>{c.full_name}</span>
                  {c.is_primary && <span style={{ fontSize:10, background:'var(--teal-bg)', color:'var(--teal-text)', padding:'1px 6px', borderRadius:8, fontWeight:600 }}>PRIMARY</span>}
                </div>
                <div style={{ fontSize:11, color:'var(--muted)' }}>{c.relationship} · {c.phone_primary}</div>
                {c.email && <div style={{ fontSize:11, color:'var(--muted)' }}>{c.email}</div>}
              </div>
            ))}
          </Card>
        )}
      </div>
    </AppShell>
  );
}

// ─── Onboarding Page ──────────────────────────────────────────────────────
export function OnboardingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [data, setData] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(id ? 1 : 0);

  useEffect(() => {
    if (id) loadChecklist();
    else loadList();
  }, [id]);

  const loadList = async () => {
    try {
      const d = await onboarding.list();
      setList(d.checklists || []);
    } catch (e) { error('Failed to load'); }
    finally { setLoading(false); }
  };

  const loadChecklist = async () => {
    try {
      const d = await onboarding.getChecklist(id);
      setData(d);
    } catch (e) { error('Failed to load checklist'); }
    finally { setLoading(false); }
  };

  const handleRemind = async () => {
    try {
      await onboarding.remind(id);
      success('Reminder sent!');
    } catch (e) { error(e.message); }
  };

  const SC = { done:'step-done', prog:'step-prog', todo:'step-todo' };
  const sym = { done:'✓', prog:'~', todo:'○' };
  const stepStatus = (s) => s === 'completed' ? 'done' : s === 'in_progress' ? 'prog' : 'todo';

  if (loading) return <AppShell><LoadingSpinner center /></AppShell>;

  if (id && data) {
    const { checklist, steps } = data;
    const pct = checklist?.progress_pct || 0;
    return (
      <AppShell>
        <PageHeader
          title={`Onboarding — ${checklist?.first_name} ${checklist?.last_name}`}
          subtitle={`${checklist?.job_title} · Hired ${new Date(checklist?.hired_at).toLocaleDateString()}`}
          action={<><button className="btn-ghost" onClick={() => navigate('/onboarding')}>← Back</button><button className="btn-primary" onClick={handleRemind}>Send reminder</button></>}
        />
        <div className="page">
          <Card style={{ padding:'14px 16px', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div><div style={{ fontSize:13, fontWeight:600 }}>Onboarding progress</div><div style={{ fontSize:11, color:'var(--muted)' }}>{checklist?.completed_steps} of {checklist?.total_steps} steps complete</div></div>
              <div style={{ fontSize:22, fontWeight:600, color: pct===100?'var(--teal)':pct>50?'#BA7517':'#A32D2D' }}>{pct}%</div>
            </div>
            <ProgressBar pct={pct} />
          </Card>
          <Card style={{ padding:16 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--hint)', letterSpacing:'0.05em', marginBottom:12 }}>CHECKLIST</div>
            {(steps || []).map((s, i) => {
              const st = stepStatus(s.status);
              const last = i === steps.length - 1;
              return (
                <div key={s.id} className="tl-item">
                  <div className="tl-left">
                    <div className={`step-icon ${SC[st]}`}>{sym[st]}</div>
                    {!last && <div className="tl-line" />}
                  </div>
                  <div className="tl-body" style={last ? { paddingBottom:0 } : {}}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500 }}>{s.title}</div>
                        <div style={{ fontSize:11, color:'var(--muted)' }}>{s.description}</div>
                        {s.status === 'completed' && s.completed_at && <div style={{ fontSize:11, color:'var(--teal)', marginTop:2 }}>✓ Completed {new Date(s.completed_at).toLocaleDateString()} by {s.completed_by}</div>}
                        {s.status !== 'completed' && s.requires_employer_action && <button style={{ marginTop:4, fontSize:11, padding:'2px 8px', borderRadius:6, border:'1px solid #EF9F27', background:'#FAEEDA', color:'#633806', cursor:'pointer' }} onClick={() => success('Marking employer action complete...')}>Action needed →</button>}
                      </div>
                      <StatusPill status={s.status} />
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Onboarding" subtitle={`${list.length} checklists`} action={<button className="btn-primary" onClick={() => navigate('/employees?invite=1')}>+ Invite employee</button>} />
      <TabBar tabs={['In progress','Complete','All']} active={tab} onChange={setTab} />
      <div className="page">
        {list.length === 0 ? <EmptyState icon="◈" title="No onboarding in progress" subtitle="Invite employees to get started." /> : list.map(cl => {
          const pct = cl.progress_pct || 0;
          return (
            <Card key={cl.employee_id} style={{ marginBottom:10, padding:'14px 16px', cursor:'pointer' }} onClick={() => navigate(`/onboarding/${cl.employee_id}`)}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                <Avatar name={`${cl.first_name} ${cl.last_name}`} size={36} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{cl.first_name} {cl.last_name}</div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>{cl.job_title} · Hired {new Date(cl.hired_at).toLocaleDateString()}</div>
                </div>
                <StatusPill status={pct===100?'completed':pct>0?'in_progress':'not_started'} />
                <span style={{ fontSize:11, fontWeight:600, color: pct===100?'var(--teal)':pct>50?'#BA7517':'#A32D2D' }}>{pct}%</span>
              </div>
              <ProgressBar pct={pct} />
              {cl.next_step && <div style={{ fontSize:11, color:'var(--muted)', marginTop:5 }}>Next: {cl.next_step}</div>}
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}

// ─── Write-ups page ───────────────────────────────────────────────────────
export function WriteUpsPage() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [wus, setWus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | create

  useEffect(() => { loadWus(); }, []);

  const loadWus = async () => {
    try {
      const d = await wuApi.list();
      setWus(d.writeups || []);
    } catch (e) { error('Failed to load'); }
    finally { setLoading(false); }
  };

  if (loading) return <AppShell><LoadingSpinner center /></AppShell>;

  return (
    <AppShell>
      <PageHeader title="Write-ups" subtitle="Disciplinary records" action={<button className="btn-primary" onClick={() => setView('create')}>+ New write-up</button>} />
      <div className="page">
        {wus.length === 0 ? (
          <EmptyState icon="✎" title="No write-ups" subtitle="Document disciplinary actions when needed." action={<button className="btn-primary" onClick={() => setView('create')}>+ Create write-up</button>} />
        ) : (
          <Card>
            {wus.map((wu, i) => (
              <div key={wu.id} className="table-row" style={{ borderBottom: i < wus.length-1 ? '1px solid #f3f4f6' : 'none' }}>
                <Avatar name={`${wu.first_name} ${wu.last_name}`} size={30} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{wu.first_name} {wu.last_name}</div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>{wu.job_title} · {new Date(wu.incident_date).toLocaleDateString()} · {wu.incident_type?.replace(/_/g,' ')}</div>
                </div>
                <StatusPill status={wu.severity?.replace(/_/g,' ')} />
                <StatusPill status={wu.status} />
                {wu.status === 'draft' && <button className="btn-primary" style={{ fontSize:11, padding:'3px 8px' }} onClick={async () => { await wuApi.send(wu.id); success('Write-up sent!'); loadWus(); }}>Send</button>}
              </div>
            ))}
          </Card>
        )}
      </div>
    </AppShell>
  );
}

// ─── Documents page ───────────────────────────────────────────────────────
export function DocumentsPage() {
  const { error } = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newDoc, setNewDoc] = useState({ name:'', docType:'handbook', requiresSignature:true });

  useEffect(() => { loadDocs(); }, []);

  const loadDocs = async () => {
    try {
      const d = await onboarding.getCompanyDocs();
      setDocs(d.documents || []);
    } catch (e) { error('Failed to load'); }
    finally { setLoading(false); }
  };

  if (loading) return <AppShell><LoadingSpinner center /></AppShell>;

  return (
    <AppShell>
      <PageHeader title="Document library" subtitle="Company documents for employee signing" action={<button className="btn-primary" onClick={() => setShowAdd(true)}>+ Upload document</button>} />
      <div className="page">
        {docs.length === 0 ? (
          <EmptyState icon="📄" title="No documents yet" subtitle="Upload company documents like handbooks, NDAs, and policies." action={<button className="btn-primary" onClick={() => setShowAdd(true)}>+ Upload document</button>} />
        ) : (
          <Card>
            {docs.map((doc, i) => {
              const signed = parseInt(doc.total_signed) || 0;
              const total  = parseInt(doc.total_assigned) || 0;
              const pct    = total > 0 ? Math.round((signed/total)*100) : 0;
              return (
                <div key={doc.id} className="table-row" style={{ borderBottom: i < docs.length-1 ? '1px solid #f3f4f6':'none' }}>
                  <div style={{ width:32, height:32, borderRadius:7, background:'var(--teal-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>📄</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{doc.name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{doc.doc_type} · v{doc.version} · {doc.requires_signature ? 'E-signature required' : 'Acknowledgment'}</div>
                  </div>
                  <div style={{ width:100 }}>
                    <div style={{ fontSize:11, color:'var(--muted)' }}><span style={{ color:'var(--teal)', fontWeight:600 }}>{signed}</span>/{total} signed</div>
                    <ProgressBar pct={pct} color="var(--teal)" />
                  </div>
                  {total - signed > 0 && <StatusPill status="pending" />}
                </div>
              );
            })}
          </Card>
        )}

        {showAdd && (
          <Modal title="Add company document" onClose={() => setShowAdd(false)}>
            <Field label="Document name" required><input value={newDoc.name} onChange={e=>setNewDoc(p=>({...p,name:e.target.value}))} placeholder="Employee Handbook, NDA..." /></Field>
            <div className="grid-2">
              <Field label="Type">
                <select value={newDoc.docType} onChange={e=>setNewDoc(p=>({...p,docType:e.target.value}))}>
                  {[['handbook','Employee Handbook'],['nda','NDA'],['safety','Safety Policy'],['policy','Company Policy'],['custom','Other']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end', paddingBottom:14 }}>
                <label style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'var(--muted)', cursor:'pointer' }}>
                  <input type="checkbox" checked={newDoc.requiresSignature} onChange={e=>setNewDoc(p=>({...p,requiresSignature:e.target.checked}))} style={{ width:'auto' }} />
                  Require e-signature
                </label>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button className="btn-ghost" style={{ flex:1 }} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex:2 }} disabled={!newDoc.name} onClick={async () => { await onboarding.addCompanyDoc(newDoc); setShowAdd(false); loadDocs(); }}>Add document</button>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}

// ─── Compliance page ──────────────────────────────────────────────────────
export function CompliancePage() {
  const { success, error } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [format, setFormat] = useState('both');
  const [notes, setNotes] = useState('');
  const [generated, setGenerated] = useState(false);
  const [tab, setTab] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const d = await compliance.iceData();
      setData(d);
    } catch (e) { error('Failed to load compliance data'); }
    finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await compliance.generateIce({ format, notes });
      setGenerated(true);
      success('ICE audit package generated and logged.');
    } catch (e) { error(e.message); }
    finally { setGenerating(false); }
  };

  if (loading) return <AppShell><LoadingSpinner center /></AppShell>;

  return (
    <AppShell>
      <PageHeader title="Compliance center" subtitle="ICE audit · EEOC reports · Export history" />
      <TabBar tabs={['ICE / I-9 audit','EEOC report','Export history']} active={tab} onChange={setTab} />
      <div className="page">
        {tab === 0 && (
          <>
            <StatGrid stats={[
              { label:'Active employees', value: data?.totalActive || 0 },
              { label:'In retention window', value: data?.totalTerminated || 0 },
              { label:'Missing I-9', value: data?.missingI9 || 0, color: data?.missingI9 > 0 ? '#A32D2D' : undefined },
              { label:'Section 2 incomplete', value: data?.incompleteI9 || 0, color: data?.incompleteI9 > 0 ? '#BA7517' : undefined },
            ]} />
            <Card style={{ padding:16, marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>Generate I-9 audit package</div>
              <div className="grid-2" style={{ marginBottom:12 }}>
                <Field label="Output format">
                  <select value={format} onChange={e=>setFormat(e.target.value)}>
                    <option value="both">Both — PDF + ZIP</option>
                    <option value="single_pdf">Single PDF only</option>
                    <option value="zip">ZIP package only</option>
                  </select>
                </Field>
                <Field label="Notes (permanently logged)">
                  <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. ICE inspection — Agent name" />
                </Field>
              </div>
              <InfoBox type="teal" style={{ marginBottom:12 }}>
                Package includes {data?.totalActive || 0} active + {data?.totalTerminated || 0} terminated employees. Every export is permanently logged with timestamp and IP address as required by federal law.
              </InfoBox>
              {generated && <InfoBox type="teal" style={{ marginBottom:12 }}>✓ Package ready — click download below.</InfoBox>}
              <button className="btn-primary" style={{ width:'100%', padding:10 }} onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generating...' : 'Generate ICE audit package →'}
              </button>
            </Card>
            <Card>
              <CardHead title="Employee I-9 status" />
              {(data?.activeEmployees || []).slice(0,10).map(e => (
                <div key={e.id} className="table-row">
                  <Avatar name={`${e.first_name} ${e.last_name}`} size={28} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500 }}>{e.first_name} {e.last_name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{e.job_title}</div>
                  </div>
                  <StatusPill status={e.i9_id ? (e.section2_completed_at ? 'completed' : 'pending') : 'not_started'} />
                  {!e.i9_id && <span style={{ fontSize:11, color:'var(--red)', fontWeight:600 }}>⚠ No I-9</span>}
                </div>
              ))}
            </Card>
          </>
        )}
        {tab === 1 && (
          <InfoBox type="blue">EEOC report requires employees to complete voluntary self-identification during onboarding. Once enough data is collected, the full report will appear here.</InfoBox>
        )}
        {tab === 2 && (
          <Card>
            <CardHead title="Export history" />
            <InfoBox type="teal" style={{ margin:12 }}>Every compliance export is permanently logged and cannot be deleted. This log is required by federal law.</InfoBox>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

// ─── Timeline page ────────────────────────────────────────────────────────
export function TimelinePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [events, setEvents] = useState([]);
  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      // Sync first to get latest events
      await tlApi.sync(id);
      const [tl, e] = await Promise.all([tlApi.get(id), empApi.get(id)]);
      setEvents(tl.timeline || []);
      setEmp(e);
    } catch (e) { error('Failed to load timeline'); }
    finally { setLoading(false); }
  };

  const colorMap = {
    hired:              { bg:'#E6F1FB', bc:'#85B7EB', tc:'#042C53' },
    w4_signed:          { bg:'#E1F5EE', bc:'#5DCAA5', tc:'#085041' },
    i9_section1:        { bg:'#E1F5EE', bc:'#5DCAA5', tc:'#085041' },
    i9_completed:       { bg:'#E1F5EE', bc:'#5DCAA5', tc:'#085041' },
    id_uploaded:        { bg:'#E6F1FB', bc:'#85B7EB', tc:'#042C53' },
    id_verified:        { bg:'#E1F5EE', bc:'#5DCAA5', tc:'#085041' },
    document_signed:    { bg:'#E1F5EE', bc:'#5DCAA5', tc:'#085041' },
    writeup_issued:     { bg:'#FAEEDA', bc:'#EF9F27', tc:'#633806' },
    writeup_acknowledged:{ bg:'#E1F5EE', bc:'#5DCAA5', tc:'#085041' },
    writeup_declined:   { bg:'#FCEBEB', bc:'#F09595', tc:'#791F1F' },
    terminated:         { bg:'#FCEBEB', bc:'#F09595', tc:'#791F1F' },
    note_added:         { bg:'#f3f4f6', bc:'#d1d5db', tc:'#374151' },
  };

  if (loading) return <AppShell><LoadingSpinner center /></AppShell>;
  const name = emp ? `${emp.first_name} ${emp.last_name}` : 'Employee';

  return (
    <AppShell>
      <PageHeader
        title={`Timeline — ${name}`}
        subtitle={emp ? `${emp.job_title}` : ''}
        action={<>
          <button className="btn-ghost" onClick={() => navigate(`/employees/${id}`)}>← Employee</button>
          <button className="btn-ghost" onClick={() => setShowNote(true)}>+ Add note</button>
        </>}
      />
      <div className="page">
        {showNote && (
          <Card style={{ padding:14, marginBottom:14 }}>
            <Field label="Note">
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Promoted to Lead Cook, salary increase approved..." style={{ minHeight:70 }} />
            </Field>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-ghost" style={{ flex:1 }} onClick={() => setShowNote(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex:2 }} onClick={async () => { await tlApi.addNote(id, { eventTitle: note }); setNote(''); setShowNote(false); loadData(); success('Note added.'); }}>Save note</button>
            </div>
          </Card>
        )}
        <Card style={{ padding:16 }}>
          {events.length === 0 ? (
            <EmptyState icon="⊙" title="No timeline events" subtitle="Events are recorded as the employee completes onboarding steps." />
          ) : events.map((ev, i) => {
            const c = colorMap[ev.event_type] || { bg:'#f3f4f6', bc:'#d1d5db', tc:'#374151' };
            const last = i === events.length-1;
            return (
              <div key={ev.id} className="tl-item">
                <div className="tl-left">
                  <div className="tl-icon" style={{ background:c.bg, border:`1px solid ${c.bc}`, color:c.tc }}>●</div>
                  {!last && <div className="tl-line" />}
                </div>
                <div className="tl-body" style={last?{paddingBottom:0}:{}}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500 }}>{ev.event_title}</div>
                      {ev.event_detail && <div style={{ fontSize:11, color:'var(--muted)' }}>{ev.event_detail}</div>}
                      {ev.triggered_by && <div style={{ fontSize:10, color:'var(--hint)' }}>by {ev.triggered_by}</div>}
                    </div>
                    <span style={{ fontSize:11, color:'var(--muted)', whiteSpace:'nowrap' }}>
                      {new Date(ev.event_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </AppShell>
  );
}

// ─── AI Draft page ────────────────────────────────────────────────────────
export function AIDraftPage() {
  const { error } = useToast();
  const [emps, setEmps] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState('');
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    empApi.list({ status:'terminated' })
      .then(d => setEmps(d.employees || []))
      .catch(() => error('Failed to load employees'))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedEmp) return;
    setGenerating(true);
    try {
      const result = await wuApi.aiDraft(selectedEmp);
      setDraft(result.draft);
      setContext(result.context);
    } catch (e) { error(e.message); }
    finally { setGenerating(false); }
  };

  if (loading) return <AppShell><LoadingSpinner center /></AppShell>;

  return (
    <AppShell>
      <PageHeader title="AI unemployment response draft" subtitle="Powered by Claude · Based only on stored records" />
      <div className="page">
        <div className="grid-2" style={{ alignItems:'start' }}>
          <div>
            <Card style={{ padding:16, marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>Select terminated employee</div>
              <Field label="Employee">
                <select value={selectedEmp} onChange={e=>setSelectedEmp(e.target.value)}>
                  <option value="">Select employee...</option>
                  {emps.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} — {e.job_title}</option>)}
                </select>
              </Field>
              {emps.length === 0 && <InfoBox type="amber">No terminated employees found. Terminate an employee first to generate a draft.</InfoBox>}
            </Card>

            {context && (
              <Card style={{ padding:16, marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>Records used</div>
                {context.recordsUsed?.map(r => (
                  <div key={r} style={{ display:'flex', gap:7, marginBottom:5, fontSize:12, color:'var(--muted)' }}>
                    <span style={{ color:'var(--teal)', fontWeight:600 }}>✓</span>{r}
                  </div>
                ))}
                <InfoBox type="amber" style={{ marginTop:8 }}>The AI will not fabricate dates or incidents not in the record.</InfoBox>
              </Card>
            )}

            <button className="btn-primary" style={{ width:'100%', padding:10 }} onClick={handleGenerate} disabled={!selectedEmp || generating}>
              {generating ? 'Generating with Claude AI...' : 'Generate draft →'}
            </button>
          </div>

          <Card style={{ display:'flex', flexDirection:'column', minHeight:400 }}>
            <CardHead title="Draft — review and edit before submitting" action={draft && <button className="btn-ghost" style={{ fontSize:11, padding:'3px 8px' }} onClick={() => navigator.clipboard?.writeText(draft)}>Copy</button>} />
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              style={{ flex:1, border:'none', padding:'14px', fontSize:12, lineHeight:1.8, background:'transparent', resize:'none', minHeight:340, outline:'none' }}
              placeholder="Select a terminated employee and click generate..."
            />
            {draft && (
              <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', fontSize:11, color:'var(--hint)', lineHeight:1.5 }}>
                Always review for accuracy. FormGuard is not a law firm. Consult legal counsel before submitting to state agencies.
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Billing page ─────────────────────────────────────────────────────────
export function BillingPage() {
  const [billing, setBilling] = useState('monthly');
  const [selected, setSelected] = useState('growth');
  const { company } = useAuth();

  const plans = [
    { id:'starter', name:'Starter', m:19, a:15, per:'$4/emp', lim:'Up to 10 employees', c:'var(--text)',
      features:['W-4 & I-9 digital signing','Guided onboarding checklist','Document library (4 docs)','Email reminders','Compliance dashboard','1 business'] },
    { id:'growth',  name:'Growth',  m:39, a:31, per:'$3/emp', lim:'11–50 employees', c:'var(--blue)', pop:true,
      features:['Everything in Starter','Write-up & disciplinary module','AI unemployment response draft','ICE audit package','EEOC compliance reports','Up to 3 businesses'] },
    { id:'pro',     name:'Pro',     m:99, a:79, per:'$2/emp', lim:'51–300 employees', c:'#633806',
      features:['Everything in Growth','Unlimited businesses','Priority support','Custom document templates','Advanced compliance exports','Dedicated onboarding call'] },
  ];

  const handleSubscribe = async () => {
    // TODO: integrate Stripe checkout
    alert(`Redirecting to Stripe checkout for ${selected} plan (${billing})...`);
  };

  return (
    <AppShell>
      <PageHeader title="Billing & plans" subtitle="8 days remaining in free trial" />
      <div className="page">
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>Choose the right plan for your business</div>
          <div style={{ fontSize:13, color:'var(--muted)', marginBottom:16 }}>All plans include a 14-day free trial. No contracts, cancel anytime.</div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'6px 16px', background:'#f3f4f6', borderRadius:20, fontSize:13 }}>
            <span style={{ color: billing==='monthly'?'var(--text)':'var(--muted)' }}>Monthly</span>
            <div onClick={() => setBilling(b=>b==='monthly'?'annual':'monthly')} style={{ width:38, height:22, borderRadius:11, background:billing==='annual'?'var(--teal)':'#d1d5db', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
              <div style={{ position:'absolute', top:3, left:billing==='annual'?18:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
            </div>
            <span style={{ color: billing==='annual'?'var(--text)':'var(--muted)' }}>Annual</span>
            {billing==='annual' && <span style={{ background:'var(--teal-bg)', color:'var(--teal-text)', fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:10 }}>Save 20%</span>}
          </div>
        </div>

        <div className="grid-3" style={{ marginBottom:20 }}>
          {plans.map(p => (
            <div key={p.id} onClick={() => setSelected(p.id)} style={{
              background:'var(--surface)', padding:20, borderRadius:12, cursor:'pointer', position:'relative',
              border: selected===p.id ? `2px solid ${p.id==='growth'?'var(--blue)':p.id==='pro'?'#854F0B':'var(--border-mid)'}` : '1px solid var(--border)',
              transition:'all 0.15s',
            }}>
              {p.pop && <div style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', background:'var(--blue-bg)', color:'var(--blue-text)', fontSize:10, fontWeight:600, padding:'2px 10px', borderRadius:10, whiteSpace:'nowrap' }}>Most popular</div>}
              <div style={{ fontSize:15, fontWeight:700, color:p.c, marginBottom:4 }}>{p.name}</div>
              <div style={{ fontSize:26, fontWeight:700, margin:'8px 0 2px' }}>${billing==='annual'?p.a:p.m}<span style={{ fontSize:13, fontWeight:400, color:'var(--muted)' }}>/mo</span></div>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14 }}>{p.per} · {p.lim}</div>
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:12 }}>
                {p.features.map(f => <div key={f} style={{ display:'flex', gap:6, marginBottom:6, fontSize:12, color:'var(--muted)' }}><span style={{ color:'var(--teal)', fontWeight:600 }}>✓</span>{f}</div>)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:10, maxWidth:440, margin:'0 auto' }}>
          <button className="btn-primary" style={{ flex:2, padding:'11px', fontSize:14 }} onClick={handleSubscribe}>
            Start {plans.find(p=>p.id===selected)?.name} — ${billing==='annual'?plans.find(p=>p.id===selected)?.a:plans.find(p=>p.id===selected)?.m}/mo →
          </button>
          <button className="btn-ghost" style={{ flex:1, padding:'11px' }}>Maybe later</button>
        </div>
        <div style={{ textAlign:'center', marginTop:10, fontSize:12, color:'var(--hint)' }}>No contracts · Cancel anytime · All plans include 14-day free trial</div>
      </div>
    </AppShell>
  );
}

// ─── Setup wizard ─────────────────────────────────────────────────────────
export function SetupWizard() {
  const navigate = useNavigate();
  return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <Card style={{ padding:32, maxWidth:480, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚙️</div>
        <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Business setup wizard</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>Configure your business settings, required forms, and company documents.</div>
        <button className="btn-primary" style={{ width:'100%', padding:10 }} onClick={() => navigate('/dashboard')}>Continue to dashboard →</button>
      </Card>
    </div>
  );
}
