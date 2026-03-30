/**
 * FormGuard API Client
 * All HTTP calls to the backend go through here.
 * Automatically attaches JWT token and handles errors.
 */

const BASE = import.meta.env.VITE_API_URL || '/api';

// ── Token management ──────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('fg_token');
export const setToken = (t) => localStorage.setItem('fg_token', t);
export const clearToken = () => localStorage.removeItem('fg_token');

export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('fg_user') || 'null'); }
  catch { return null; }
};
export const setStoredUser = (u) => localStorage.setItem('fg_user', JSON.stringify(u));
export const getStoredCompany = () => {
  try { return JSON.parse(localStorage.getItem('fg_company') || 'null'); }
  catch { return null; }
};
export const setStoredCompany = (c) => localStorage.setItem('fg_company', JSON.stringify(c));

// ── Core fetch wrapper ────────────────────────────────────────────────────
const call = async (method, path, body = null, isPublic = false) => {
  const headers = { 'Content-Type': 'application/json' };
  if (!isPublic) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  // Token expired — force logout
  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    return;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.error || data?.errors?.[0]?.msg || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
};

const get  = (path, pub)      => call('GET',    path, null, pub);
const post = (path, body, pub) => call('POST',   path, body, pub);
const put  = (path, body)      => call('PUT',    path, body);
const del  = (path)            => call('DELETE', path);

// ════════════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════════════
export const auth = {
  register: (data) => post('/api/auth/register', data, true),
  login:    (data) => post('/api/auth/login', data, true),
  me:       ()     => get('/api/auth/me'),
};

// ════════════════════════════════════════════════════════════════════════════
// BUSINESSES
// ════════════════════════════════════════════════════════════════════════════
export const businesses = {
  list:           ()       => get('/api/businesses'),
  get:            (id)     => get(`/api/businesses/${id}`),
  create:         (data)   => post('/api/businesses', data),
  update:         (id, d)  => put(`/api/businesses/${id}`, d),
  switch:         (id)     => post(`/api/businesses/${id}/switch`),
  stateFormsLookup: (state) => get(`/api/businesses/state-forms/lookup?state=${state}`),
  saveSetupProgress: (id, d) => post(`/api/businesses/${id}/setup-progress`, d),
};

// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEES
// ════════════════════════════════════════════════════════════════════════════
export const employees = {
  list:         (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/api/employees${q ? '?' + q : ''}`);
  },
  stats:        ()      => get('/api/employees/stats'),
  get:          (id)    => get(`/api/employees/${id}`),
  invite:       (data)  => post('/api/employees/invite', data),
  resendInvite: (id)    => post(`/api/employees/${id}/resend-invite`),
  getAudit:     (id)    => get(`/api/employees/${id}/audit`),
  deactivate:   (id)    => del(`/api/employees/${id}`),
};

// ════════════════════════════════════════════════════════════════════════════
// ONBOARDING
// ════════════════════════════════════════════════════════════════════════════
export const onboarding = {
  list:            (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/api/onboarding${q ? '?' + q : ''}`);
  },
  getChecklist:    (empId)  => get(`/api/onboarding/${empId}`),
  generate:        (empId)  => post(`/api/onboarding/${empId}/generate`),
  remind:          (empId)  => post(`/api/onboarding/${empId}/remind`),
  employerComplete:(empId, stepKey, data) => post(`/api/onboarding/${empId}/steps/${stepKey}/employer-complete`, data),
  getIdUploads:    (empId)  => get(`/api/onboarding/${empId}/id-uploads`),
  verifyId:        (empId, uploadId, data) => post(`/api/onboarding/${empId}/id-uploads/${uploadId}/verify`, data),
  getCompanyDocs:  ()       => get('/api/onboarding/company-docs'),
  addCompanyDoc:   (data)   => post('/api/onboarding/company-docs', data),
  removeCompanyDoc:(id)     => del(`/api/onboarding/company-docs/${id}`),
  // Employee-facing (uses token param)
  myChecklist:     (token)  => get(`/api/onboarding/my-checklist?token=${token}`, true),
  completeStep:    (token, stepKey, data) => post(`/api/onboarding/steps/${stepKey}/complete?token=${token}`, data, true),
  uploadId:        (token, data) => post(`/api/onboarding/id-upload?token=${token}`, data, true),
};

// ════════════════════════════════════════════════════════════════════════════
// PROFILES
// ════════════════════════════════════════════════════════════════════════════
export const profiles = {
  get:              (empId) => get(`/api/profiles/${empId}`),
  update:           (empId, data) => put(`/api/profiles/${empId}`, data),
  getContacts:      (empId) => get(`/api/profiles/${empId}/emergency-contacts`),
  addContact:       (empId, data) => post(`/api/profiles/${empId}/emergency-contacts`, data),
  updateContact:    (empId, cId, data) => put(`/api/profiles/${empId}/emergency-contacts/${cId}`, data),
  deleteContact:    (empId, cId) => del(`/api/profiles/${empId}/emergency-contacts/${cId}`),
  listDepartments:  () => get('/api/profiles/departments/list'),
  createDepartment: (data) => post('/api/profiles/departments/create', data),
};

// ════════════════════════════════════════════════════════════════════════════
// FORMS (W-4, I-9)
// ════════════════════════════════════════════════════════════════════════════
export const forms = {
  onboardInfo:  (token)  => get(`/api/forms/onboard-info?token=${token}`, true),
  submitW4:     (token, data) => post(`/api/forms/w4?token=${token}`, data, true),
  submitI9s1:   (token, data) => post(`/api/forms/i9/section1?token=${token}`, data, true),
  submitI9s2:   (i9Id, data)  => post(`/api/forms/i9/${i9Id}/section2`, data),
  getEmployeeForms: (empId)   => get(`/api/forms/employee/${empId}`),
};

// ════════════════════════════════════════════════════════════════════════════
// SIGNATURES
// ════════════════════════════════════════════════════════════════════════════
export const signatures = {
  requestW4:        (token, data) => post(`/api/signatures/w4/request?token=${token}`, data, true),
  requestI9:        (token, data) => post(`/api/signatures/i9/request?token=${token}`, data, true),
  employerI9SignUrl:(empId) => get(`/api/signatures/i9/${empId}/employer-url`),
  getStatus:        (reqId) => get(`/api/signatures/${reqId}/status`),
};

// ════════════════════════════════════════════════════════════════════════════
// WRITE-UPS
// ════════════════════════════════════════════════════════════════════════════
export const writeups = {
  list:       (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/api/writeups${q ? '?' + q : ''}`);
  },
  getForEmployee: (empId) => get(`/api/writeups/${empId}`),
  create:         (empId, data) => post(`/api/writeups/${empId}`, data),
  send:           (wuId)  => post(`/api/writeups/${wuId}/send`),
  aiDraft:        (empId) => post(`/api/writeups/${empId}/ai-draft`),
  // Employee-facing
  getAck:         (token) => get(`/api/writeups/acknowledge?token=${token}`, true),
  submitAck:      (token, data) => post(`/api/writeups/acknowledge?token=${token}`, data, true),
};

// ════════════════════════════════════════════════════════════════════════════
// TERMINATIONS
// ════════════════════════════════════════════════════════════════════════════
export const terminations = {
  terminate:        (empId, data) => post(`/api/terminations/${empId}`, data),
  get:              (empId) => get(`/api/terminations/${empId}`),
  update:           (empId, data) => put(`/api/terminations/${empId}`, data),
  list:             () => get('/api/terminations'),
};

// ════════════════════════════════════════════════════════════════════════════
// COMPLIANCE
// ════════════════════════════════════════════════════════════════════════════
export const compliance = {
  status:       () => get('/api/compliance/status'),
  iceData:      () => get('/api/compliance/ice/data'),
  generateIce:  (data) => post('/api/compliance/ice/generate', data),
  eeocReport:   () => get('/api/compliance/eeoc/report'),
  exportHistory:() => get('/api/compliance/exports/history'),
};

// ════════════════════════════════════════════════════════════════════════════
// TIMELINE
// ════════════════════════════════════════════════════════════════════════════
export const timeline = {
  get:   (empId)      => get(`/api/timeline/${empId}`),
  sync:  (empId)      => post(`/api/timeline/${empId}/sync`),
  addNote:(empId, data) => post(`/api/timeline/${empId}/note`, data),
};

// ════════════════════════════════════════════════════════════════════════════
// AUDIT
// ════════════════════════════════════════════════════════════════════════════
export const audit = {
  list:   (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/api/audit${q ? '?' + q : ''}`);
  },
  export: () => `${BASE}/api/audit/export`,  // direct download URL
};

// ════════════════════════════════════════════════════════════════════════════
// DEMOGRAPHICS
// ════════════════════════════════════════════════════════════════════════════
export const demographics = {
  selfIdentify: (token, data) => post(`/api/demographics/self-identify?token=${token}`, data, true),
  get:          (empId) => get(`/api/demographics/${empId}`),
  updateEEO1:   (empId, data) => put(`/api/demographics/${empId}/eeo1`, data),
};
