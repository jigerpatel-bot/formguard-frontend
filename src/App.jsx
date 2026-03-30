import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Pages
import LoginPage       from './pages/LoginPage';
import SignupPage      from './pages/SignupPage';
import DashboardPage   from './pages/DashboardPage';
import EmployeesPage   from './pages/EmployeesPage';

// Pages from stub-pages.jsx
import {
  EmployeeDetail,
  OnboardingPage,
  WriteUpsPage,
  DocumentsPage,
  CompliancePage,
  TimelinePage,
  AIDraftPage,
  BillingPage,
  SetupWizard,
} from './pages/stub-pages';

// Employee-facing public pages
import EmployeeOnboard from './pages/employee/EmployeeOnboard';
import WriteupAck      from './pages/employee/WriteupAck';

function PrivateRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>
      <div className="spinner" style={{ width:32, height:32 }} />
    </div>
  );
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  if (isLoggedIn) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* ── Public auth routes ──────────────────────── */}
          <Route path="/login"  element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

          {/* ── Employee-facing routes (no login needed) ─ */}
          <Route path="/onboard"           element={<EmployeeOnboard />} />
          <Route path="/writeup-response"  element={<WriteupAck />} />

          {/* ── Protected employer routes ───────────────── */}
          <Route path="/setup" element={<PrivateRoute><SetupWizard /></PrivateRoute>} />

          <Route path="/dashboard"         element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/employees"         element={<PrivateRoute><EmployeesPage /></PrivateRoute>} />
          <Route path="/employees/:id"     element={<PrivateRoute><EmployeeDetail /></PrivateRoute>} />
          <Route path="/onboarding"        element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
          <Route path="/onboarding/:id"    element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
          <Route path="/writeups"          element={<PrivateRoute><WriteUpsPage /></PrivateRoute>} />
          <Route path="/documents"         element={<PrivateRoute><DocumentsPage /></PrivateRoute>} />
          <Route path="/compliance"        element={<PrivateRoute><CompliancePage /></PrivateRoute>} />
          <Route path="/timeline/:id"      element={<PrivateRoute><TimelinePage /></PrivateRoute>} />
          <Route path="/ai-draft"          element={<PrivateRoute><AIDraftPage /></PrivateRoute>} />
          <Route path="/billing"           element={<PrivateRoute><BillingPage /></PrivateRoute>} />

          {/* ── Default redirect ────────────────────────── */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
