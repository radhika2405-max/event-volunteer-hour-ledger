const API_BASE = '/api/v1';

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getCurrentUser() {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}

export function setCurrentUser(user: any) {
  localStorage.setItem('user', JSON.stringify(user));
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/verify/')) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'An unexpected error occurred');
  }

  return data;
}

export const api = {
  // Auth
  login: async (creds: { email: string; password: string }) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(creds),
    });
    setToken(res.access_token);
    setCurrentUser(res.user);
    return res;
  },
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      clearToken();
    }
  },
  getMe: () => request('/auth/me'),

  // Students
  getStudents: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/students?${q}`);
  },
  getStudentDetail: (id: number) => request(`/students/${id}`),
  createStudent: (data: any) => request('/students', { method: 'POST', body: JSON.stringify(data) }),

  // Events
  getEvents: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/events?${q}`);
  },
  getEventDetail: (id: number) => request(`/events/${id}`),
  createEvent: (data: any) => request('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: number, data: any) => request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getEventVolunteers: (id: number) => request(`/events/${id}/volunteers`),

  // Clubs
  getClubs: () => request('/clubs'),
  getClubEvents: (id: number) => request(`/clubs/${id}/events`),

  // Participations
  registerVolunteer: (eventId: number, data: any) =>
    request(`/events/${eventId}/volunteers`, { method: 'POST', body: JSON.stringify(data) }),
  getParticipations: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/participations?${q}`);
  },

  // Hours
  submitHours: (data: any) => request('/hours', { method: 'POST', body: JSON.stringify(data) }),
  getHours: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/hours?${q}`);
  },
  getHourEntry: (id: number) => request(`/hours/${id}`),
  approveHours: (id: number) => request(`/hours/${id}/approve`, { method: 'POST' }),
  rejectHours: (id: number, reason: string) =>
    request(`/hours/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  correctHours: (id: number, data: { verified_minutes: number; correction_notes: string }) =>
    request(`/hours/${id}/correct`, { method: 'POST', body: JSON.stringify(data) }),

  // Eligibility
  getEligibility: () => request('/eligibility'),
  getStudentEligibility: (studentId: number) => request(`/eligibility/${studentId}`),

  // Reports
  getCertificateEligibilityReport: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/certificate-eligibility?${q}`);
  },
  getEventSummaryReport: () => request('/reports/event-summary'),
  getClubSummaryReport: () => request('/reports/club-summary'),
  getPendingApprovalsReport: () => request('/reports/pending-approvals'),

  // Certificates
  issueCertificate: (studentId: number, policyId: number = 1) =>
    request('/certificates/issue', { method: 'POST', body: JSON.stringify({ student_id: studentId, policy_id: policyId }) }),
  getCertificates: (studentId?: number) => {
    const q = studentId ? `?student_id=${studentId}` : '';
    return request(`/certificates${q}`);
  },
  downloadCertificateUrl: (certId: number) => `/api/v1/certificates/${certId}/download`,
  publicVerifyCertificate: (token: string) => request(`/certificates/verify/${token}`),
  revokeCertificate: (certId: number, reason: string) =>
    request(`/certificates/${certId}/revoke`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Admin
  getAuditLogs: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/admin/audit-logs?${q}`);
  },
  getCertificatePolicies: () => request('/admin/certificate-policies'),
  createCertificatePolicy: (data: any) =>
    request('/admin/certificate-policies', { method: 'POST', body: JSON.stringify(data) }),
  updateCertificatePolicy: (id: number, data: any) =>
    request(`/admin/certificate-policies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getDashboardStats: () => request('/admin/dashboard-stats'),
};
