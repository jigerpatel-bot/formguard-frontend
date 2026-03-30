import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { auth, businesses } from '../api/client';
import { Field } from '../components/shared';

const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],
  ['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],
  ['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],
  ['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],
  ['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],
  ['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],
  ['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],
  ['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],
  ['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],
  ['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],
  ['WI','Wisconsin'],['WY','Wyoming'],
];

const STATE_FORMS = {
  TX:['Texas New Hire Report (due 20 days)'],
  CA:['California DE 34 — New Employee Report','California DE 4 — State Withholding'],
  NY:['New York IT-2104 — State Withholding','New York New Hire Report'],
  FL:['Florida New Hire Report'],
  IL:['Illinois IL-W-4 — State Withholding','Illinois New Hire Report'],
  WA:['Washington New Hire Report'],
  GA:['Georgia New Hire Report (due 10 days)'],
  AZ:['Arizona New Hire Report'],
  CO:['Colorado New Hire Report'],
  NC:['North Carolina New Hire Report'],
};

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [acct, setAcct] = useState({ firstName:'', lastName:'', email:'', password:'' });
  const [biz,  setBiz]  = useState({ name:'', ein:'', state:'', address:'', city:'', zip:'', industry:'', size:'' });
  const [docs, setDocs] = useState([]);
  const [docIn, setDocIn] = useState({ name:'', type:'handbook', sign:true });
  const [createdCompanyId, setCreatedCompanyId] = useState(null);

  const setA = (k,v) => setAcct(p=>({...p,[k]:v}));
  const setB = (k,v) => setBiz(p=>({...p,[k]:v}));

  const stateForms = biz.state ? [
    'IRS Form W-4 (Federal)',
    'USCIS Form I-9 (Federal)',
    ...(STATE_FORMS[biz.state] || []),
  ] : [];

  const STEPS = ['Account','Business','Documents','First employee'];

  const handleStep1 = async () => {
    if (!acct.firstName || !acct.email || acct.password.length < 8) return;
    setLoading(true);
    try {
      // Register creates account + first company placeholder
      // We'll create the real company in step 2
      setStep(2);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (!biz.name || !biz.state) return;
    setLoading(true);
    try {
      // Register account + company together
      const data = await auth.register({
        firstName: acct.firstName,
        lastName: acct.lastName,
        email: acct.email,
        password: acct.password,
        companyName: biz.name,
        state: biz.state,
        ein: biz.ein,
        address: biz.address,
        city: biz.city,
        zip: biz.zip,
        industry: biz.industry,
        employeeCountRange: biz.size,
      });
      // Store token
      const { setToken, setStoredUser, setStoredCompany } = await import('../api/client');
      setToken(data.token);
      setStoredUser(data.user);
      setStoredCompany(data.company);
      setCreatedCompanyId(data.company.id);
      setStep(3);
    } catch (err) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = () => setStep(4);

  const handleFinish = async () => {
    navigate('/dashboard');
    success('Welcome to FormGuard! Your account is ready.');
  };

  const addDoc = () => {
    if (!docIn.name.trim() || docs.length >= 4) return;
    setDocs(p => [...p, { id: Date.now(), ...docIn }]);
    setDocIn({ name:'', type:'handbook', sign:true });
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', fontFamily:'inherit' }}>
      {/* Left panel */}
      <div style={{ width:260, background:'var(--surface)', borderRight:'1px solid var(--border)', padding:'28px 24px', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:36 }}>
          <div style={{ width:30, height:30, background:'var(--teal)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#fff' }}>✓</div>
          <span style={{ fontSize:16, fontWeight:700 }}>FormGuard</span>
        </div>

        {STEPS.map((s, i) => (
          <div key={i} style={{ display:'flex', gap:12, marginBottom:22, opacity:step < i+1 ? 0.4 : 1 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{
                width:24, height:24, borderRadius:'50%', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:600,
                background: step > i+1 ? 'var(--teal)' : step === i+1 ? 'var(--teal-bg)' : '#f3f4f6',
                color: step > i+1 ? '#fff' : step === i+1 ? 'var(--teal)' : 'var(--hint)',
                border: step === i+1 ? '2px solid var(--teal)' : 'none',
              }}>
                {step > i+1 ? '✓' : i+1}
              </div>
              {i < STEPS.length-1 && <div style={{ width:1, height:16, background:'var(--border)', margin:'3px 0' }} />}
            </div>
            <div style={{ paddingTop:3 }}>
              <div style={{ fontSize:13, fontWeight: step===i+1 ? 600 : 400 }}>{s}</div>
              <div style={{ fontSize:11, color:'var(--hint)' }}>
                {['Create your account','About your business','Upload company docs','Invite first employee'][i]}
              </div>
            </div>
          </div>
        ))}

        <div style={{ marginTop:'auto', borderTop:'1px solid var(--border)', paddingTop:16 }}>
          {['14-day free trial, no card needed','Auto-configured for your state','Legally binding e-signatures (ESIGN Act)'].map(t => (
            <div key={t} style={{ display:'flex', gap:7, marginBottom:8, fontSize:12, color:'var(--muted)' }}>
              <span style={{ color:'var(--teal)', fontWeight:600 }}>✓</span>{t}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex:1, padding:'32px 28px', overflowY:'auto', display:'flex', flexDirection:'column' }}>
        <div style={{ flex:1, maxWidth:480 }}>
          <div style={{ fontSize:12, color:'var(--hint)', marginBottom:4 }}>Step {step} of {STEPS.length}</div>
          <h2 style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>
            {['Create your account','About your business','Upload company documents','Invite your first employee'][step-1]}
          </h2>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:24, lineHeight:1.6 }}>
            {['Start your 14-day free trial. No credit card required.',`We'll auto-configure the right forms for your state.`,'Employees will sign these during onboarding. You can skip and add later.','They\'ll receive a secure link to complete their W-4, I-9, and company documents.'][step-1]}
          </p>

          {/* Step 1 */}
          {step === 1 && (
            <div className="card" style={{ padding:22 }}>
              <div className="grid-2">
                <Field label="First name" required><input value={acct.firstName} onChange={e=>setA('firstName',e.target.value)} placeholder="Maria" /></Field>
                <Field label="Last name"><input value={acct.lastName} onChange={e=>setA('lastName',e.target.value)} placeholder="Rodriguez" /></Field>
              </div>
              <Field label="Work email" required><input type="email" value={acct.email} onChange={e=>setA('email',e.target.value)} placeholder="maria@yourcompany.com" /></Field>
              <Field label="Password (min 8 characters)" required>
                <input type="password" value={acct.password} onChange={e=>setA('password',e.target.value)} placeholder="Create a strong password" />
                {acct.password.length > 0 && acct.password.length < 8 && <div style={{ fontSize:11, color:'var(--red)', marginTop:4 }}>Must be at least 8 characters</div>}
              </Field>
              <div className="info-box info-teal" style={{ marginTop:4 }}>Your data is encrypted with AES-256. SSNs are never stored in plain text.</div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="card" style={{ padding:22 }}>
              <Field label="Business / entity name" required><input value={biz.name} onChange={e=>setB('name',e.target.value)} placeholder="Taco Restaurant LLC" /></Field>
              <div className="grid-2">
                <Field label="State where you operate" required>
                  <select value={biz.state} onChange={e=>setB('state',e.target.value)}>
                    <option value="">Select state...</option>
                    {US_STATES.map(([c,n]) => <option key={c} value={c}>{n} ({c})</option>)}
                  </select>
                </Field>
                <Field label="EIN (optional)"><input value={biz.ein} onChange={e=>setB('ein',e.target.value)} placeholder="12-3456789" /></Field>
              </div>
              <Field label="Business address"><input value={biz.address} onChange={e=>setB('address',e.target.value)} placeholder="123 Main Street" /></Field>
              <div className="grid-2">
                <Field label="City"><input value={biz.city} onChange={e=>setB('city',e.target.value)} placeholder="Austin" /></Field>
                <Field label="ZIP"><input value={biz.zip} onChange={e=>setB('zip',e.target.value)} placeholder="78701" /></Field>
              </div>
              <div className="grid-2">
                <Field label="Industry">
                  <select value={biz.industry} onChange={e=>setB('industry',e.target.value)}>
                    <option value="">Select...</option>
                    {['Restaurant / Food Service','Retail','Construction','Healthcare','Hospitality','Transportation','Professional Services','Other'].map(i => <option key={i}>{i}</option>)}
                  </select>
                </Field>
                <Field label="Number of employees">
                  <select value={biz.size} onChange={e=>setB('size',e.target.value)}>
                    <option value="">Select...</option>
                    {['1-10','11-50','51-150','151-300'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              {biz.state && (
                <div className="info-box info-teal" style={{ marginTop:4 }}>
                  <strong>Auto-configured for {US_STATES.find(s=>s[0]===biz.state)?.[1]}:</strong><br/>
                  {stateForms.map(f => <div key={f} style={{ marginTop:3 }}>✓ {f}</div>)}
                </div>
              )}
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              {docs.map(doc => (
                <div key={doc.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:7, marginBottom:8 }}>
                  <span>📄</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{doc.name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{doc.sign ? 'E-signature required' : 'Acknowledgment only'}</div>
                  </div>
                  <button onClick={() => setDocs(p => p.filter(d => d.id !== doc.id))} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:16 }}>✕</button>
                </div>
              ))}
              {docs.length < 4 && (
                <div style={{ border:'1px dashed #5DCAA5', borderRadius:8, padding:16, marginBottom:14 }}>
                  <Field label="Document name"><input value={docIn.name} onChange={e=>setDocIn(p=>({...p,name:e.target.value}))} placeholder="Employee Handbook, NDA, Safety Policy..." /></Field>
                  <div className="grid-2" style={{ marginBottom:12 }}>
                    <Field label="Type">
                      <select value={docIn.type} onChange={e=>setDocIn(p=>({...p,type:e.target.value}))}>
                        {[['handbook','Employee Handbook'],['nda','NDA / Confidentiality'],['safety','Safety Policy'],['policy','Company Policy'],['custom','Other']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </Field>
                    <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end', paddingBottom:2 }}>
                      <label style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'var(--muted)', cursor:'pointer' }}>
                        <input type="checkbox" checked={docIn.sign} onChange={e=>setDocIn(p=>({...p,sign:e.target.checked}))} style={{ width:'auto' }} />
                        Require e-signature
                      </label>
                    </div>
                  </div>
                  <button className="btn-primary" style={{ width:'100%' }} onClick={addDoc} disabled={!docIn.name.trim()}>+ Add document</button>
                </div>
              )}
              <div className="info-box info-amber">
                Common documents: Employee Handbook, NDA, Safety Agreement, Uniform Policy. You can add more anytime from Document Settings.
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="card" style={{ padding:22 }}>
              <Field label="Employee full name"><input placeholder="Carlos Rivera" /></Field>
              <Field label="Email address"><input type="email" placeholder="carlos@email.com" /></Field>
              <Field label="Job title"><input placeholder="Server, Cook, Manager..." /></Field>
              <div className="info-box info-teal" style={{ marginTop:4 }}>
                <strong>They will be asked to complete:</strong>
                {['Personal information','Upload government-issued ID','Sign IRS Form W-4',...(biz.state && STATE_FORMS[biz.state] ? STATE_FORMS[biz.state] : []),'Complete Form I-9 (you verify Section 2)',...docs.map(d=>`Sign: ${d.name}`)].map(item => (
                  <div key={item} style={{ marginTop:3, fontSize:11 }}>→ {item}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div style={{ display:'flex', gap:10, marginTop:20, maxWidth:480 }}>
          {step > 1 && <button className="btn-ghost" style={{ flex:1 }} onClick={() => setStep(s=>s-1)}>← Back</button>}
          {step < 4 ? (
            <button
              className="btn-primary"
              style={{ flex:2, padding:'10px', fontSize:14 }}
              onClick={step===1?handleStep1:step===2?handleStep2:handleStep3}
              disabled={loading ||
                (step===1&&(!acct.firstName||!acct.email||acct.password.length<8)) ||
                (step===2&&(!biz.name||!biz.state))
              }
            >
              {loading ? 'Please wait...' : 'Continue →'}
            </button>
          ) : (
            <div style={{ flex:2, display:'flex', flexDirection:'column', gap:8 }}>
              <button className="btn-primary" style={{ width:'100%', padding:10, fontSize:14 }} onClick={handleFinish}>Send invite & go to dashboard →</button>
              <button className="btn-ghost" style={{ width:'100%', fontSize:13 }} onClick={handleFinish}>Skip — go to dashboard</button>
            </div>
          )}
        </div>
        <div style={{ textAlign:'center', marginTop:14, fontSize:12, color:'var(--muted)' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color:'var(--teal)', fontWeight:500 }}>Sign in</a>
        </div>
      </div>
    </div>
  );
}
