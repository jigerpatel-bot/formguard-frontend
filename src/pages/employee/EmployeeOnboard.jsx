import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { forms, onboarding, demographics } from '../../api/client';
import { LoadingSpinner, InfoBox, Field } from '../../components/shared';

// This page is loaded by employees via their secure invite link.
// URL: /onboard?token=abc123...

export default function EmployeeOnboard() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState('loading'); // loading | info | w4 | demographics | i9 | docs | complete | error
  const [employee, setEmployee] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setStep('error'); setError('Invalid or missing invite link.'); return; }
    loadOnboarding();
  }, [token]);

  const loadOnboarding = async () => {
    try {
      const data = await onboarding.myChecklist(token);
      setEmployee(data.employee);
      setChecklist(data.checklist);
      setSteps(data.steps || []);
      // Find first incomplete required step
      const nextStep = (data.steps || []).find(s => s.status !== 'completed' && s.is_required);
      setStep(nextStep?.step_key || 'complete');
    } catch (err) {
      setStep('error');
      setError(err.message || 'This invite link is invalid or has expired.');
    }
  };

  const markStepComplete = async (stepKey, refId, refType) => {
    await onboarding.completeStep(token, stepKey, { referenceId: refId, referenceType: refType });
    await loadOnboarding();
  };

  if (step === 'loading') return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>
      <LoadingSpinner size={32} />
    </div>
  );

  if (step === 'error') return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', padding:24 }}>
      <div style={{ maxWidth:400, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
        <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Invalid link</div>
        <div style={{ fontSize:13, color:'#6b7280' }}>{error}</div>
      </div>
    </div>
  );

  if (step === 'complete') return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', padding:24, background:'#f4f5f7' }}>
      <div style={{ maxWidth:480, textAlign:'center' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'#E1F5EE', border:'2px solid #5DCAA5', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:32 }}>✓</div>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Onboarding complete!</div>
        <div style={{ fontSize:14, color:'#6b7280', marginBottom:24, lineHeight:1.6 }}>
          All your documents have been completed and signed. Your employer has been notified. Welcome to the team!
        </div>
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:16, textAlign:'left' }}>
          {steps.map(s => (
            <div key={s.step_key} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid #f3f4f6', fontSize:13 }}>
              <span style={{ color:'#1D9E75', fontSize:14 }}>{s.status==='completed'?'✓':'○'}</span>
              <span style={{ color: s.status==='completed'?'#6b7280':'#111' }}>{s.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Generic step handler — renders a simple form for each step
  return (
    <div style={{ minHeight:'100vh', background:'#f4f5f7', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:520 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center', marginBottom:28 }}>
          <div style={{ width:30, height:30, background:'#1D9E75', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#fff' }}>✓</div>
          <span style={{ fontSize:16, fontWeight:700 }}>FormGuard</span>
        </div>

        {/* Progress */}
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'12px 16px', marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>Onboarding — {employee?.firstName} {employee?.lastName}</div>
            <div style={{ fontSize:12, color:'#6b7280' }}>{checklist?.completed_steps || 0} / {checklist?.total_steps || 0}</div>
          </div>
          <div style={{ height:5, borderRadius:3, background:'#f3f4f6', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:3, background:'#1D9E75', width:`${checklist?.progress_pct || 0}%`, transition:'width 0.4s' }} />
          </div>
          <div style={{ fontSize:11, color:'#9ca3af', marginTop:5 }}>{employee?.companyName}</div>
        </div>

        {/* Step content */}
        <OnboardStep
          stepKey={step}
          steps={steps}
          token={token}
          employee={employee}
          onComplete={markStepComplete}
        />
      </div>
    </div>
  );
}

function OnboardStep({ stepKey, steps, token, employee, onComplete }) {
  const currentStep = steps.find(s => s.step_key === stepKey) || steps.find(s => s.status !== 'completed');
  const [submitting, setSubmitting] = useState(false);

  if (!currentStep) return null;

  const handleComplete = async (data = {}) => {
    setSubmitting(true);
    try {
      await onComplete(currentStep.step_key, data.referenceId, data.referenceType);
    } finally {
      setSubmitting(false);
    }
  };

  // W-4 Form
  if (stepKey.includes('w4') || currentStep.step_type === 'form' && currentStep.step_key.includes('w4')) {
    return <W4Form token={token} onComplete={() => handleComplete()} submitting={submitting} />;
  }

  // Demographics (voluntary)
  if (stepKey === 'demographics') {
    return <DemographicsForm token={token} onComplete={() => handleComplete()} onSkip={() => handleComplete()} />;
  }

  // Generic step (personal info, docs, etc.)
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:22 }}>
      <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>{currentStep.title}</div>
      <div style={{ fontSize:13, color:'#6b7280', marginBottom:20, lineHeight:1.6 }}>{currentStep.description}</div>
      <button
        style={{ width:'100%', padding:11, borderRadius:7, border:'none', background:'#1D9E75', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}
        onClick={() => handleComplete()}
        disabled={submitting}
      >
        {submitting ? 'Saving...' : 'Mark complete & continue →'}
      </button>
    </div>
  );
}

function W4Form({ token, onComplete, submitting }) {
  const [form, setForm] = useState({
    firstName:'', lastName:'', ssn:'', address:'', city:'', state:'', zip:'',
    filingStatus:'', multipleJobs:false, dependentAmount:0,
    extraWithholding:0, exempt:false,
    signatureName:'', signDate: new Date().toISOString().slice(0,10),
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await forms.submitW4(token, form);
      onComplete();
    } catch (err) {
      alert('Error submitting W-4: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:22 }}>
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {[1,2,3].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:2, background: step>=i?'#1D9E75':'#f3f4f6' }} />)}
      </div>
      <div style={{ fontSize:11, color:'#9ca3af', marginBottom:4 }}>Step {step} of 3</div>
      <div style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>
        {['Personal information','Withholding','Sign & submit'][step-1]}
      </div>

      {step === 1 && (
        <>
          <div className="grid-2"><Field label="First name"><input value={form.firstName} onChange={e=>set('firstName',e.target.value)} /></Field><Field label="Last name"><input value={form.lastName} onChange={e=>set('lastName',e.target.value)} /></Field></div>
          <Field label="Social Security Number (encrypted)"><input type="password" value={form.ssn} onChange={e=>set('ssn',e.target.value)} placeholder="XXX-XX-XXXX" /></Field>
          <Field label="Home address"><input value={form.address} onChange={e=>set('address',e.target.value)} /></Field>
          <div className="grid-2"><Field label="City"><input value={form.city} onChange={e=>set('city',e.target.value)} /></Field><Field label="State"><input value={form.state} onChange={e=>set('state',e.target.value)} maxLength={2} placeholder="TX" /></Field></div>
          <Field label="Filing status">
            <select value={form.filingStatus} onChange={e=>set('filingStatus',e.target.value)}>
              <option value="">Select...</option>
              <option>Single or Married filing separately</option>
              <option>Married filing jointly</option>
              <option>Head of household</option>
            </select>
          </Field>
        </>
      )}

      {step === 2 && (
        <>
          <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, cursor:'pointer', fontSize:13 }}>
            <input type="checkbox" checked={form.multipleJobs} onChange={e=>set('multipleJobs',e.target.checked)} style={{ width:'auto' }} />
            Multiple jobs or spouse also works
          </label>
          <Field label="Claim dependents ($)"><input type="number" value={form.dependentAmount} onChange={e=>set('dependentAmount',parseFloat(e.target.value)||0)} placeholder="0" /></Field>
          <Field label="Extra withholding per pay period ($)"><input type="number" value={form.extraWithholding} onChange={e=>set('extraWithholding',parseFloat(e.target.value)||0)} placeholder="0" /></Field>
          <div style={{ padding:'10px 13px', background:'#E1F5EE', borderRadius:7, fontSize:12, color:'#085041' }}>Leave fields blank if not applicable.</div>
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ background:'#f9fafb', borderRadius:8, padding:12, marginBottom:16 }}>
            {[['Name',`${form.firstName} ${form.lastName}`],['Filing status',form.filingStatus],['Multiple jobs',form.multipleJobs?'Yes':'No']].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:12 }}>
                <span style={{ color:'#6b7280' }}>{k}</span><span style={{ fontWeight:500 }}>{v||'—'}</span>
              </div>
            ))}
          </div>
          <Field label="Signature (full legal name)"><input style={{ fontStyle:'italic', fontSize:16 }} value={form.signatureName} onChange={e=>set('signatureName',e.target.value)} placeholder="Type your full legal name" /></Field>
          <Field label="Date"><input type="date" value={form.signDate} onChange={e=>set('signDate',e.target.value)} /></Field>
          <div style={{ padding:'10px 13px', background:'#E6F1FB', borderRadius:7, fontSize:11, color:'#042C53', marginBottom:4 }}>
            🔒 This signature is legally binding under the E-Sign Act. A timestamped record will be created.
          </div>
        </>
      )}

      <div style={{ display:'flex', gap:10, marginTop:18 }}>
        {step > 1 && <button style={{ flex:1, padding:9, borderRadius:7, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer' }} onClick={()=>setStep(s=>s-1)}>← Back</button>}
        <button
          style={{ flex:2, padding:9, borderRadius:7, border:'none', background:step<3?'#1D9E75':'#1D9E75', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}
          onClick={step<3?()=>setStep(s=>s+1):handleSubmit}
          disabled={saving || (step===3 && (!form.signatureName||!form.signDate))}
        >
          {saving ? 'Submitting...' : step < 3 ? 'Continue →' : 'Submit W-4 ✓'}
        </button>
      </div>
    </div>
  );
}

function DemographicsForm({ token, onComplete, onSkip }) {
  const [form, setForm] = useState({ gender:'', raceEthnicity:'', veteranStatus:'', disabilityStatus:'' });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (form.gender || form.raceEthnicity) {
        await demographics.selfIdentify(token, form);
      }
      onComplete();
    } catch (err) { onComplete(); } // never block on optional step
    finally { setSaving(false); }
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:22 }}>
      <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>Voluntary self-identification</div>
      <div style={{ fontSize:13, color:'#6b7280', marginBottom:16, lineHeight:1.6 }}>This information is used only for internal EEOC compliance reporting and is completely optional. You may skip this step at any time.</div>
      <div style={{ padding:'10px 13px', background:'#E1F5EE', borderRadius:7, fontSize:12, color:'#085041', marginBottom:16 }}>This information is kept separate from your employee record and is never shared with other employees.</div>
      <Field label="Gender">
        <select value={form.gender} onChange={e=>set('gender',e.target.value)}>
          <option value="">Prefer not to say / skip</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non_binary">Non-binary</option>
          <option value="self_describe">Prefer to self-describe</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </Field>
      <Field label="Race / ethnicity">
        <select value={form.raceEthnicity} onChange={e=>set('raceEthnicity',e.target.value)}>
          <option value="">Prefer not to say / skip</option>
          <option value="hispanic_latino">Hispanic or Latino</option>
          <option value="white">White (non-Hispanic)</option>
          <option value="black_african_american">Black or African American</option>
          <option value="asian">Asian</option>
          <option value="native_hawaiian_pacific_islander">Native Hawaiian / Pacific Islander</option>
          <option value="american_indian_alaska_native">American Indian / Alaska Native</option>
          <option value="two_or_more">Two or more races</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </Field>
      <div style={{ display:'flex', gap:10 }}>
        <button style={{ flex:1, padding:9, borderRadius:7, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer', fontSize:13 }} onClick={onSkip}>Skip this step</button>
        <button style={{ flex:2, padding:9, borderRadius:7, border:'none', background:'#1D9E75', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Save & continue →'}
        </button>
      </div>
    </div>
  );
}
