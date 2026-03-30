import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field } from '../components/shared';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      error(err.message || 'Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ width: 34, height: 34, background: 'var(--teal)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>✓</div>
          <span style={{ fontSize: 20, fontWeight: 700 }}>FormGuard</span>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Welcome back</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>Sign in to your account</p>

          <form onSubmit={handleSubmit}>
            <Field label="Email address" required>
              <input
                type="email" value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="you@yourcompany.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Password" required>
              <input
                type="password" value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
              />
            </Field>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !form.email || !form.password}
              style={{ width: '100%', padding: '10px', fontSize: 14, marginTop: 4 }}
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--teal)', fontWeight: 500 }}>
            Start free trial
          </Link>
        </div>

        {/* Dev helper */}
        {import.meta.env.DEV && (
          <div style={{ marginTop: 16, padding: 12, background: '#f3f4f6', borderRadius: 7, fontSize: 11, color: 'var(--muted)' }}>
            <strong>Dev login:</strong> admin@acme.com / Admin1234!
          </div>
        )}
      </div>
    </div>
  );
}
