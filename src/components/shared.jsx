// ── Shared UI components used across all pages ───────────────────────────

export function Pill({ label, type = 'gray' }) {
  return (
    <span className={`pill pill-${type}`}>
      <span className="pill-dot" />
      {label}
    </span>
  );
}

export function StatusPill({ status }) {
  const map = {
    completed:   { label: 'Complete',     type: 'success' },
    pending:     { label: 'Pending',      type: 'warn' },
    not_started: { label: 'Not started',  type: 'gray' },
    in_progress: { label: 'In progress',  type: 'warn' },
    active:      { label: 'Active',       type: 'success' },
    terminated:  { label: 'Terminated',   type: 'danger' },
    on_leave:    { label: 'On leave',     type: 'warn' },
    draft:       { label: 'Draft',        type: 'gray' },
    sent:        { label: 'Sent',         type: 'info' },
    acknowledged:{ label: 'Acknowledged', type: 'success' },
    declined:    { label: 'Declined',     type: 'danger' },
    verified:    { label: 'Verified',     type: 'success' },
    needs_correction: { label: 'Needs correction', type: 'warn' },
  };
  const s = map[status] || { label: status, type: 'gray' };
  return <Pill label={s.label} type={s.type} />;
}

export function Avatar({ name, size = 30, bg = '#E1F5EE', color = '#085041' }) {
  const initials = (name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, background: bg, color, fontSize: size * 0.37 }}
    >
      {initials}
    </div>
  );
}

export function Card({ children, style = {} }) {
  return <div className="card" style={style}>{children}</div>;
}

export function CardHead({ title, action }) {
  return (
    <div className="card-head">
      <span className="card-title">{title}</span>
      {action}
    </div>
  );
}

export function LoadingSpinner({ size = 24, center = false }) {
  const spinner = (
    <div
      className="spinner"
      style={{ width: size, height: size, borderWidth: size / 10 }}
    />
  );
  if (center) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 48 }}>
        {spinner}
      </div>
    );
  }
  return spinner;
}

export function EmptyState({ icon = '📋', title, subtitle, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--hint)', marginBottom: 16 }}>{subtitle}</div>}
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="topbar">
      <div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{subtitle}</div>}
      </div>
      {action && <div style={{ display: 'flex', gap: 8 }}>{action}</div>}
    </div>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="tab-bar">
      {tabs.map((tab, i) => (
        <div
          key={i}
          className={`tab ${active === i ? 'active' : ''}`}
          onClick={() => onChange(i)}
        >
          {tab}
        </div>
      ))}
    </div>
  );
}

export function StatGrid({ stats }) {
  return (
    <div className="stat-grid">
      {stats.map((s, i) => (
        <div key={i} className="stat-card">
          <div className="stat-label">{s.label}</div>
          <div className="stat-value" style={s.color ? { color: s.color } : {}}>
            {s.value}
          </div>
          {s.sub && <div className="stat-sub">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}

export function InfoBox({ children, type = 'teal' }) {
  return <div className={`info-box info-${type}`}>{children}</div>;
}

export function ProgressBar({ pct, color }) {
  const c = color || (pct === 100 ? 'var(--teal)' : pct > 60 ? '#EF9F27' : '#E24B4A');
  return (
    <div className="pbar">
      <div className="pbar-fill" style={{ width: `${pct}%`, background: c }} />
    </div>
  );
}

export function Field({ label, children, required }) {
  return (
    <div className="field">
      <label>{label}{required && <span style={{ color: 'var(--red)' }}> *</span>}</label>
      {children}
    </div>
  );
}

export function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 1000, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 12,
          width: '100%', maxWidth: width,
          border: '1px solid var(--border)',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
          >✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '16px 18px' }}>{children}</div>
      </div>
    </div>
  );
}
