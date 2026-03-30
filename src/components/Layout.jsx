import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './shared';

const NAV_ITEMS = [
  { path: '/dashboard',   label: 'Dashboard',   icon: '⊞' },
  { path: '/employees',   label: 'Employees',   icon: '⊡' },
  { path: '/onboarding',  label: 'Onboarding',  icon: '◈', badge: 'warn' },
  { path: '/writeups',    label: 'Write-ups',   icon: '✎' },
  { path: '/documents',   label: 'Documents',   icon: '⊟' },
  { path: '/compliance',  label: 'Compliance',  icon: '⊕', badge: 'danger' },
  { path: '/timeline',    label: 'Timeline',    icon: '⊙' },
  { path: '/ai-draft',    label: 'AI Draft',    icon: '✦' },
  { path: '/billing',     label: 'Billing',     icon: '◇' },
];

function BusinessSwitcher({ allBizs, company, onSwitch }) {
  const [open, setOpen] = useState(false);
  const colors = ['#E1F5EE','#E6F1FB','#FAEEDA','#FCEBEB'];
  const textColors = ['#085041','#185FA5','#633806','#791F1F'];

  return (
    <div style={{ position: 'relative' }}>
      <div
        className="biz-row"
        onClick={() => setOpen(!open)}
        style={{
          padding: '12px 14px', borderBottom: '1px solid var(--border)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: '#E1F5EE', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#085041',
        }}>
          {(company?.name || '?').slice(0,2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {company?.name || 'Select business'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>
            {company?.plan || 'free'} plan
          </div>
        </div>
        <span style={{ fontSize: 9, color: 'var(--hint)' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderTop: 'none', borderRadius: '0 0 var(--rad) var(--rad)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {allBizs.map((biz, i) => (
            <div
              key={biz.id}
              onClick={() => { onSwitch(biz.id); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px', cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                background: biz.id === company?.id ? '#f9fafb' : 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = biz.id === company?.id ? '#f9fafb' : 'transparent'}
            >
              <div style={{
                width: 24, height: 24, borderRadius: 5, flexShrink: 0,
                background: colors[i % colors.length],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 600, color: textColors[i % textColors.length],
              }}>
                {biz.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {biz.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                  {biz.employee_count || 0} employees
                </div>
              </div>
              {biz.id === company?.id && <span style={{ fontSize: 10, color: 'var(--teal)' }}>✓</span>}
            </div>
          ))}
          <div
            onClick={() => { setOpen(false); window.location.href = '/setup'; }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 12px', cursor: 'pointer', color: 'var(--teal)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 5, border: '1px dashed #5DCAA5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: 'var(--teal)',
            }}>+</div>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Add business</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ badgeCounts = {} }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, company, allBizs, switchBusiness } = useAuth();

  return (
    <div className="sidebar">
      <BusinessSwitcher
        allBizs={allBizs}
        company={company}
        onSwitch={switchBusiness}
      />

      {/* Trial banner */}
      <div style={{ margin: 8, padding: '9px 11px', background: '#FAEEDA', borderRadius: 7, border: '1px solid #EF9F27' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#633806', marginBottom: 2 }}>8 days left in trial</div>
        <div style={{ fontSize: 11, color: '#854F0B', marginBottom: 7, lineHeight: 1.4 }}>Upgrade to keep access.</div>
        <button className="btn-primary" style={{ width: '100%', padding: '5px', fontSize: 11 }} onClick={() => navigate('/billing')}>
          Upgrade now
        </button>
      </div>

      {/* Nav */}
      <div style={{ padding: 5, flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const active = location.pathname.startsWith(item.path);
          const badge  = badgeCounts[item.path];
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 7,
                margin: '1px 0', cursor: 'pointer',
                background: active ? 'var(--teal-bg)' : 'transparent',
                color: active ? 'var(--teal-text)' : 'var(--muted)',
                fontWeight: active ? 600 : 400,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f3f4f6'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span style={{ flex: 1, fontSize: 12 }}>{item.label}</span>
              {badge > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 9,
                  background: item.badge === 'danger' ? 'var(--red-bg)' : 'var(--amber-bg)',
                  color: item.badge === 'danger' ? 'var(--red-text)' : 'var(--amber-text)',
                }}>
                  {badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* User */}
      <div style={{ padding: '10px 13px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar name={`${user?.firstName || ''} ${user?.lastName || ''}`} size={26} bg="var(--blue-bg)" color="var(--blue-text)" />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{user?.firstName} {user?.lastName}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'capitalize' }}>{user?.role}</div>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children, badgeCounts }) {
  return (
    <div className="shell">
      <Sidebar badgeCounts={badgeCounts} />
      <div className="main">{children}</div>
    </div>
  );
}
