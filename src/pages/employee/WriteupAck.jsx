import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { writeups } from '../../api/client';
import { LoadingSpinner } from '../../components/shared';

// Employee receives email with link: /writeup-response?token=abc...
// They can view the notice, add a response, and sign or decline.

export default function WriteupAck() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState('loading'); // loading | review | complete | error
  const [writeup, setWriteup] = useState(null);
  const [error, setError] = useState('');
  const [response, setResponse] = useState('');
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!token) { setStep('error'); setError('Invalid link.'); return; }
    loadWriteup();
  }, [token]);

  const loadWriteup = async () => {
    try {
      const data = await writeups.getAck(token);
      setWriteup(data.writeup);
      setStep('review');
    } catch (err) {
      setStep('error');
      setError(err.message || 'This link is invalid or has expired.');
    }
  };

  const handleSubmit = async (action) => {
    if (action === 'signed' && !signature.trim()) return;
    setSubmitting(true);
    try {
      await writeups.submitAck(token, { action, signatureName: signature, employeeResponse: response });
      setResult(action);
      setStep('complete');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const s = { fontFamily:'-apple-system,sans-serif', fontSize:13 };

  if (step === 'loading') return (
    <div style={{ ...s, display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>
      <LoadingSpinner size={32} />
    </div>
  );

  if (step === 'error') return (
    <div style={{ ...s, display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', padding:24, background:'#f4f5f7' }}>
      <div style={{ maxWidth:420, textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
        <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Unable to load notice</div>
        <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.6 }}>{error}</div>
      </div>
    </div>
  );

  if (step === 'complete') return (
    <div style={{ ...s, display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', padding:24, background:'#f4f5f7' }}>
      <div style={{ maxWidth:480, textAlign:'center' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background: result==='signed'?'#E1F5EE':'#FCEBEB', border:`2px solid ${result==='signed'?'#5DCAA5':'#F09595'}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:28 }}>
          {result==='signed'?'✓':'✗'}
        </div>
        <div style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>
          {result === 'signed' ? 'Acknowledgment received' : 'Refusal recorded'}
        </div>
        <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.6, marginBottom:24 }}>
          {result === 'signed'
            ? 'Your acknowledgment has been recorded with a timestamp. Your employer has been notified.'
            : 'Your refusal to sign has been recorded. The notice remains valid. Your employer has been notified.'}
        </div>
        <div style={{ padding:'12px 16px', background:'#f3f4f6', borderRadius:8, fontSize:12, color:'#6b7280', textAlign:'left' }}>
          <div style={{ marginBottom:4 }}><strong>Notice:</strong> {writeup?.incident_type?.replace(/_/g,' ')}</div>
          <div style={{ marginBottom:4 }}><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
          <div><strong>Status:</strong> {result === 'signed' ? 'Acknowledged' : 'Declined to sign'}</div>
        </div>
      </div>
    </div>
  );

  // Review step
  const sev = { verbal_warning:'Verbal warning', written_warning:'Written warning', final_warning:'Final warning', suspension:'Suspension' };

  return (
    <div style={{ ...s, minHeight:'100vh', background:'#f4f5f7', padding:'24px 16px' }}>
      <div style={{ maxWidth:540, margin:'0 auto' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center', marginBottom:24 }}>
          <div style={{ width:28, height:28, background:'#1D9E75', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff' }}>✓</div>
          <span style={{ fontSize:15, fontWeight:700 }}>FormGuard</span>
        </div>

        {/* Warning */}
        <div style={{ background:'#FAEEDA', border:'1px solid #EF9F27', borderRadius:8, padding:'11px 14px', marginBottom:14, fontSize:12, color:'#633806', lineHeight:1.5 }}>
          <strong>Important:</strong> Acknowledging this notice does not mean you agree with its contents. It only confirms that you received and read it. You may add your own written response below.
        </div>

        {/* Notice details */}
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, marginBottom:12, overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', borderBottom:'1px solid #e5e7eb', fontWeight:600, fontSize:13 }}>
            Disciplinary notice — {sev[writeup?.severity] || writeup?.severity?.replace(/_/g,' ')}
          </div>
          <div style={{ padding:'13px 16px' }}>
            {[['Employee',`${writeup?.first_name} ${writeup?.last_name}`],['Date',writeup?.incident_date ? new Date(writeup.incident_date).toLocaleDateString() : ''],['Type',writeup?.incident_type?.replace(/_/g,' ')],['Issued by',writeup?.company_name]].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #f3f4f6', fontSize:12 }}>
                <span style={{ color:'#6b7280' }}>{k}</span>
                <span style={{ fontWeight:500, textTransform:'capitalize' }}>{v}</span>
              </div>
            ))}
            {writeup?.incident_description && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:4, letterSpacing:'0.05em' }}>INCIDENT</div>
                <p style={{ fontSize:12, lineHeight:1.6, margin:0, color:'#374151' }}>{writeup.incident_description}</p>
              </div>
            )}
            {writeup?.improvement_plan && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:4, letterSpacing:'0.05em' }}>IMPROVEMENT PLAN</div>
                <p style={{ fontSize:12, lineHeight:1.6, margin:0, color:'#374151' }}>{writeup.improvement_plan}</p>
              </div>
            )}
            {writeup?.consequences && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:4, letterSpacing:'0.05em' }}>CONSEQUENCES IF NOT IMPROVED</div>
                <p style={{ fontSize:12, lineHeight:1.6, margin:0, color:'#374151' }}>{writeup.consequences}</p>
              </div>
            )}
          </div>
        </div>

        {/* Employee response */}
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'13px 16px', marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Your response (optional)</div>
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            style={{ minHeight:90, border:'1px solid #d1d5db', borderRadius:7, padding:'8px 10px', width:'100%', fontSize:12, lineHeight:1.6, outline:'none', resize:'vertical', fontFamily:'inherit' }}
            placeholder="You may add your own statement, perspective, or rebuttal here. This will be attached to the record alongside this notice..."
          />
        </div>

        {/* Signature and actions */}
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'13px 16px' }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Your acknowledgment</div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:'#6b7280', fontWeight:500, display:'block', marginBottom:4 }}>Sign with your full legal name</label>
            <input
              style={{ fontStyle:'italic', fontSize:16, padding:'8px 10px', borderRadius:7, border:'1px solid #d1d5db', width:'100%', outline:'none', fontFamily:'Georgia,serif' }}
              placeholder="Type your full legal name"
              value={signature}
              onChange={e => setSignature(e.target.value)}
            />
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button
              style={{ flex:1, padding:10, borderRadius:7, border:'1px solid #F09595', background:'#FCEBEB', color:'#A32D2D', cursor:'pointer', fontWeight:600, fontSize:13, fontFamily:'inherit' }}
              onClick={() => handleSubmit('declined')}
              disabled={submitting}
            >
              {submitting ? '...' : 'Decline to sign'}
            </button>
            <button
              style={{ flex:2, padding:10, borderRadius:7, border:'none', background: signature.trim() ? '#1D9E75' : '#d1d5db', color:'#fff', cursor: signature.trim() ? 'pointer' : 'not-allowed', fontWeight:600, fontSize:13, fontFamily:'inherit' }}
              onClick={() => handleSubmit('signed')}
              disabled={submitting || !signature.trim()}
            >
              {submitting ? 'Saving...' : 'Sign & acknowledge →'}
            </button>
          </div>

          <div style={{ fontSize:11, color:'#9ca3af', textAlign:'center', marginTop:8, lineHeight:1.4 }}>
            Declining is also recorded with timestamp. The notice remains legally valid regardless of your decision.
          </div>
        </div>

        {error && (
          <div style={{ marginTop:12, padding:10, background:'#FCEBEB', border:'1px solid #F09595', borderRadius:7, fontSize:12, color:'#A32D2D' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
