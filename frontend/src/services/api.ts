import { initialSeedData } from './seedData';

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

// Detect GitHub Pages, file protocol, or static host
export const isStaticDemo = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.hostname.includes('netlify') ||
  window.location.hostname.includes('vercel') ||
  window.location.protocol === 'file:' ||
  (!['5173', '5000'].includes(window.location.port) && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') ||
  localStorage.getItem('force_demo_mode') === 'true'
);

// In-memory demo store initialized from seed data and persisted in localStorage
function getDemoStore() {
  const key = 'adikala_demo_store_v1';
  const legacyKey = 'aadikala_demo_store_v1';
  const saved = localStorage.getItem(key) || localStorage.getItem(legacyKey);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  const fresh = JSON.parse(JSON.stringify(initialSeedData));
  localStorage.setItem(key, JSON.stringify(fresh));
  return fresh;
}

function saveDemoStore(store: any) {
  localStorage.setItem('adikala_demo_store_v1', JSON.stringify(store));
}

async function request(endpoint: string, options: RequestInit = {}) {
  // If explicitly on static host (like GitHub Pages), use demo store directly
  if (isStaticDemo) {
    return handleDemoRequest(endpoint, options);
  }

  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Check content-type to avoid "Unexpected token '<'" when receiving HTML 404
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.warn('Backend returned non-JSON response, falling back to client demo mode:', text.slice(0, 100));
      return handleDemoRequest(endpoint, options);
    }

    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/verify/')) {
      clearToken();
      window.location.hash = '#/login';
      throw new Error('Session expired');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'An unexpected error occurred');
    }

    return data;
  } catch (err: any) {
    // If backend is unreachable or threw HTML parsing error, fallback to demo mode
    if (err.message?.includes('Unexpected token') || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      console.warn('Backend unavailable, handling request via interactive demo store:', endpoint);
      return handleDemoRequest(endpoint, options);
    }
    throw err;
  }
}

// ----------------------------------------------------------------------------
// CLIENT-SIDE DEMO ENGINE (FOR GITHUB PAGES HOSTING)
// ----------------------------------------------------------------------------
function handleDemoRequest(endpoint: string, options: RequestInit = {}): any {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};
  const store = getDemoStore();
  const currentUser = getCurrentUser();

  const [urlPath, queryString] = endpoint.split('?');
  const queryParams = new URLSearchParams(queryString || '');

  // 1. Auth Login
  if (endpoint.startsWith('/auth/login') && method === 'POST') {
    const user = store.users.find((u: any) => u.email.toLowerCase() === body.email.toLowerCase());
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const token = `demo_jwt_${user.user_id}_${Date.now()}`;
    const student = store.students.find((s: any) => s.user_id === user.user_id);
    const userInfo = {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      student_id: student?.student_id || null,
      registration_number: student?.university_registration_number || null,
    };
    setToken(token);
    setCurrentUser(userInfo);
    return { access_token: token, user: userInfo };
  }

  // 2. Auth Logout
  if (endpoint.startsWith('/auth/logout')) {
    clearToken();
    return { message: 'Logged out successfully' };
  }

  // 3. Auth Me
  if (endpoint.startsWith('/auth/me')) {
    if (!currentUser) throw new Error('Unauthorized');
    const user = store.users.find((u: any) => u.user_id === currentUser.user_id);
    const student = store.students.find((s: any) => s.user_id === currentUser.user_id);
    return { user, student };
  }

  // 4. Dashboard Stats
  if (endpoint.startsWith('/admin/dashboard-stats')) {
    const approvedMins = store.hour_entries
      .filter((h: any) => ['approved', 'corrected'].includes(h.submission_status))
      .reduce((sum: number, h: any) => sum + (h.verified_minutes || 0), 0);
    const pendingCount = store.hour_entries.filter((h: any) => h.submission_status === 'pending').length;
    const certsCount = store.certificates.filter((c: any) => c.certificate_status === 'issued').length;

    return {
      total_volunteers: store.students.length,
      total_events: store.events.length,
      total_approved_hours: Math.round((approvedMins / 60.0) * 100) / 100,
      pending_hour_approvals: pendingCount,
      certificates_issued: certsCount,
    };
  }

  // 5. Events List & CRUD
  if (endpoint === '/events' && method === 'GET') {
    const items = store.events.map((e: any) => {
      const parts = store.participations.filter((p: any) => p.event_id === e.event_id);
      const partIds = parts.map((p: any) => p.participation_id);
      const appMins = store.hour_entries
        .filter((h: any) => partIds.includes(h.participation_id) && ['approved', 'corrected'].includes(h.submission_status))
        .reduce((sum: number, h: any) => sum + h.verified_minutes, 0);

      return {
        ...e,
        volunteer_count: parts.length,
        approved_hours: Math.round((appMins / 60.0) * 100) / 100,
      };
    });
    return { items, total: items.length };
  }

  if (endpoint === '/events' && method === 'POST') {
    const newId = Math.max(...store.events.map((e: any) => e.event_id), 0) + 1;
    const subClubs = store.clubs.filter((c: any) => (body.sub_club_ids || []).includes(c.club_id));
    const newEv = {
      event_id: newId,
      event_name: body.event_name,
      event_code: body.event_code,
      venue: body.venue,
      description: body.description,
      start_datetime: body.start_datetime,
      end_datetime: body.end_datetime,
      event_status: 'published',
      sub_clubs: subClubs,
    };
    store.events.unshift(newEv);
    saveDemoStore(store);
    return newEv;
  }

  // 6. Clubs
  if (endpoint.startsWith('/clubs') && method === 'GET') {
    return { items: store.clubs, total: store.clubs.length };
  }

  // 7. Students List & Detail
  if (endpoint.startsWith('/students') && method === 'GET') {
    const matchId = endpoint.match(/\/students\/(\d+)/);
    if (matchId) {
      const sId = parseInt(matchId[1]);
      const s = store.students.find((item: any) => item.student_id === sId);
      if (!s) throw new Error('Student not found');

      const parts = store.participations.filter((p: any) => p.student_id === sId).map((p: any) => {
        const ev = store.events.find((e: any) => e.event_id === p.event_id);
        const hours = store.hour_entries.filter((h: any) => h.participation_id === p.participation_id);
        return {
          ...p,
          event_name: ev?.event_name || 'Campus Event',
          hours: hours.map((h: any) => ({
            ...h,
            claimed_hours: Math.round((h.claimed_minutes / 60.0) * 100) / 100,
            verified_hours: Math.round((h.verified_minutes / 60.0) * 100) / 100,
          })),
        };
      });

      const appMins = store.hour_entries
        .filter((h: any) => parts.some((p: any) => p.participation_id === h.participation_id) && ['approved', 'corrected'].includes(h.submission_status))
        .reduce((sum: number, h: any) => sum + h.verified_minutes, 0);

      const pendMins = store.hour_entries
        .filter((h: any) => parts.some((p: any) => p.participation_id === h.participation_id) && h.submission_status === 'pending')
        .reduce((sum: number, h: any) => sum + h.claimed_minutes, 0);

      return {
        ...s,
        total_approved_minutes: appMins,
        total_approved_hours: Math.round((appMins / 60.0) * 100) / 100,
        total_pending_minutes: pendMins,
        total_pending_hours: Math.round((pendMins / 60.0) * 100) / 100,
        participations: parts,
      };
    }

    return { items: store.students, total: store.students.length };
  }

  if (endpoint === '/students' && method === 'POST') {
    const newUId = Math.max(...store.users.map((u: any) => u.user_id), 0) + 1;
    const newSId = Math.max(...store.students.map((s: any) => s.student_id), 0) + 1;
    const newU = {
      user_id: newUId,
      full_name: body.full_name,
      email: body.email,
      role: 'volunteer',
      account_status: 'active',
    };
    const newS = {
      student_id: newSId,
      user_id: newUId,
      full_name: body.full_name,
      email: body.email,
      university_registration_number: body.university_registration_number,
      programme: body.programme,
      academic_year: body.academic_year || '2025-2026',
      section: body.section || 'A',
      status: 'active',
    };
    store.users.push(newU);
    store.students.push(newS);
    saveDemoStore(store);
    return newS;
  }

  // 8. Participations
  if (endpoint.startsWith('/participations') && method === 'GET') {
    const items = store.participations.map((p: any) => {
      const s = store.students.find((item: any) => item.student_id === p.student_id);
      const ev = store.events.find((item: any) => item.event_id === p.event_id);
      return {
        ...p,
        student_name: s?.full_name || 'Student',
        registration_number: s?.university_registration_number || 'N/A',
        event_name: ev?.event_name || 'Event',
      };
    });
    return { items, total: items.length };
  }

  if (endpoint.includes('/volunteers') && method === 'POST') {
    const evId = parseInt(endpoint.split('/')[2]);
    const newPId = Math.max(...store.participations.map((p: any) => p.participation_id), 0) + 1;
    const s = store.students.find((item: any) => item.student_id === body.student_id);
    const cl = store.clubs.find((item: any) => item.club_id === body.assigned_club_id);
    const newP = {
      participation_id: newPId,
      event_id: evId,
      student_id: body.student_id,
      assigned_club_id: body.assigned_club_id,
      assigned_club_name: cl?.club_name || 'General',
      assigned_role: body.assigned_role || 'Volunteer',
      registration_status: 'registered',
      student_name: s?.full_name,
      registration_number: s?.university_registration_number,
    };
    store.participations.push(newP);
    saveDemoStore(store);
    return newP;
  }

  // 9. Hours Ledger & Approvals
  if ((urlPath === '/hours' || endpoint.startsWith('/hours')) && method === 'GET') {
    const statusParam = (queryParams.get('status') || '').trim().toLowerCase();
    const studentIdParam = queryParams.get('student_id');
    const eventIdParam = queryParams.get('event_id');

    let rawEntries = store.hour_entries;
    if (statusParam) {
      rawEntries = rawEntries.filter((h: any) => (h.submission_status || '').toLowerCase() === statusParam);
    }
    if (studentIdParam) {
      const sId = parseInt(studentIdParam, 10);
      const partIds = store.participations.filter((p: any) => p.student_id === sId).map((p: any) => p.participation_id);
      rawEntries = rawEntries.filter((h: any) => partIds.includes(h.participation_id));
    }
    if (eventIdParam) {
      const eId = parseInt(eventIdParam, 10);
      const partIds = store.participations.filter((p: any) => p.event_id === eId).map((p: any) => p.participation_id);
      rawEntries = rawEntries.filter((h: any) => partIds.includes(h.participation_id));
    }

    const items = rawEntries.map((h: any) => {
      const p = store.participations.find((item: any) => item.participation_id === h.participation_id);
      const s = store.students.find((item: any) => item.student_id === p?.student_id);
      const ev = store.events.find((item: any) => item.event_id === p?.event_id);
      return {
        ...h,
        student_id: s?.student_id,
        student_name: s?.full_name || 'Student',
        registration_number: s?.university_registration_number || 'N/A',
        event_name: ev?.event_name || 'Event',
        claimed_hours: Math.round((h.claimed_minutes / 60.0) * 100) / 100,
        verified_hours: Math.round((h.verified_minutes / 60.0) * 100) / 100,
      };
    });
    return { items, total: items.length };
  }

  if (endpoint === '/hours' && method === 'POST') {
    const newHId = Math.max(...store.hour_entries.map((h: any) => h.hour_entry_id), 0) + 1;
    const diffMins = 420; // default interval duration minus break
    const newH = {
      hour_entry_id: newHId,
      participation_id: body.participation_id,
      work_date: body.work_date,
      start_time: body.start_time,
      end_time: body.end_time,
      break_minutes: body.break_minutes || 0,
      claimed_minutes: 420,
      verified_minutes: 0,
      submission_status: 'pending',
      submitted_by: currentUser?.user_id || 2,
    };
    store.hour_entries.unshift(newH);
    saveDemoStore(store);
    return newH;
  }

  if (endpoint.match(/\/hours\/(\d+)\/approve/) && method === 'POST') {
    const hId = parseInt(endpoint.split('/')[2]);
    const h = store.hour_entries.find((item: any) => item.hour_entry_id === hId);
    if (!h) throw new Error('Entry not found');
    h.submission_status = 'approved';
    h.verified_minutes = h.claimed_minutes;
    h.reviewed_by = currentUser?.user_id || 3;
    h.reviewed_at = new Date().toISOString();
    saveDemoStore(store);
    return h;
  }

  if (endpoint.match(/\/hours\/(\d+)\/reject/) && method === 'POST') {
    const hId = parseInt(endpoint.split('/')[2]);
    const h = store.hour_entries.find((item: any) => item.hour_entry_id === hId);
    if (!h) throw new Error('Entry not found');
    h.submission_status = 'rejected';
    h.verified_minutes = 0;
    h.rejection_reason = body.reason || 'Rejected by faculty approver';
    h.reviewed_by = currentUser?.user_id || 3;
    h.reviewed_at = new Date().toISOString();
    saveDemoStore(store);
    return h;
  }

  if (endpoint.match(/\/hours\/(\d+)\/correct/) && method === 'POST') {
    const hId = parseInt(endpoint.split('/')[2]);
    const h = store.hour_entries.find((item: any) => item.hour_entry_id === hId);
    if (!h) throw new Error('Entry not found');
    h.submission_status = 'corrected';
    h.verified_minutes = body.verified_minutes;
    h.correction_notes = body.correction_notes;
    h.reviewed_by = currentUser?.user_id || 1;
    saveDemoStore(store);
    return h;
  }

  // 10. Eligibility & Signature Report
  if (endpoint.startsWith('/reports/certificate-eligibility') || endpoint.startsWith('/eligibility')) {
    const policy = store.policies.find((p: any) => p.scope_type === 'all_events' && p.status === 'active') || store.policies[0];
    const thresholdHours = Math.round((policy.minimum_approved_minutes / 60.0) * 100) / 100;

    let items = store.students.map((s: any) => {
      const parts = store.participations.filter((p: any) => p.student_id === s.student_id);
      const partIds = parts.map((p: any) => p.participation_id);
      const appMins = store.hour_entries
        .filter((h: any) => partIds.includes(h.participation_id) && ['approved', 'corrected'].includes(h.submission_status))
        .reduce((sum: number, h: any) => sum + h.verified_minutes, 0);

      const pendMins = store.hour_entries
        .filter((h: any) => partIds.includes(h.participation_id) && h.submission_status === 'pending')
        .reduce((sum: number, h: any) => sum + h.claimed_minutes, 0);

      const cert = store.certificates.find((c: any) => c.student_id === s.student_id);
      const appHours = Math.round((appMins / 60.0) * 100) / 100;
      const pendHours = Math.round((pendMins / 60.0) * 100) / 100;
      const remHours = Math.max(0, Math.round((thresholdHours - appHours) * 100) / 100);

      let state = 'Not Eligible';
      if (cert?.certificate_status === 'issued') {
        state = 'Certificate Issued';
      } else if (cert?.certificate_status === 'revoked') {
        state = 'Certificate Revoked';
      } else if (appMins >= policy.minimum_approved_minutes) {
        state = 'Eligible - Awaiting Certificate Approval';
      } else if (appMins + pendMins >= policy.minimum_approved_minutes) {
        state = 'Pending Hours Review';
      }

      return {
        student_id: s.student_id,
        university_registration_number: s.university_registration_number,
        student_name: s.full_name,
        programme: s.programme,
        academic_year: s.academic_year,
        policy_id: policy.policy_id,
        policy_name: policy.policy_name,
        threshold_hours: thresholdHours,
        total_approved_hours: appHours,
        total_pending_hours: pendHours,
        approved_events_count: parts.length,
        remaining_hours: remHours,
        eligibility_state: state,
        certificate_number: cert?.certificate_number || null,
        certificate_status: cert?.certificate_status || null,
        certificate_issued_at: cert?.issued_at || null,
        verification_token: cert?.verification_token || null,
      };
    });

    // Check single student query
    const matchStudent = urlPath.match(/\/eligibility\/(\d+)/);
    if (matchStudent) {
      const sId = parseInt(matchStudent[1]);
      const found = items.find((item: any) => item.student_id === sId);
      if (!found) throw new Error('Student eligibility not found');
      return found;
    }

    // Multi-Criteria Filters:
    const searchParam = (queryParams.get('search') || '').trim().toLowerCase();
    if (searchParam) {
      items = items.filter((x: any) =>
        (x.student_name || '').toLowerCase().includes(searchParam) ||
        (x.university_registration_number || '').toLowerCase().includes(searchParam)
      );
    }

    const ayParam = (queryParams.get('academic_year') || '').trim();
    if (ayParam) {
      items = items.filter((x: any) => x.academic_year === ayParam);
    }

    const progParam = (queryParams.get('programme') || '').trim().toLowerCase();
    if (progParam) {
      items = items.filter((x: any) => (x.programme || '').trim().toLowerCase() === progParam);
    }

    const evIdParam = queryParams.get('event_id');
    if (evIdParam) {
      const eId = parseInt(evIdParam, 10);
      const studentIdsInEvent = new Set(
        store.participations.filter((p: any) => p.event_id === eId).map((p: any) => p.student_id)
      );
      items = items.filter((x: any) => studentIdsInEvent.has(x.student_id));
    }

    const clubIdParam = queryParams.get('club_id');
    if (clubIdParam) {
      const cId = parseInt(clubIdParam, 10);
      const childClubs = store.clubs.filter((c: any) => c.parent_club_id === cId).map((c: any) => c.club_id);
      const targetClubIds = new Set([cId, ...childClubs]);
      const studentIdsInClub = new Set(
        store.participations.filter((p: any) => targetClubIds.has(p.assigned_club_id)).map((p: any) => p.student_id)
      );
      items = items.filter((x: any) => studentIdsInClub.has(x.student_id));
    }

    const statusParam = (queryParams.get('status') || '').trim().toLowerCase();
    if (statusParam) {
      items = items.filter((x: any) => {
        const itemState = (x.eligibility_state || '').trim().toLowerCase();
        if (statusParam === 'eligible') {
          return itemState.includes('eligible') || itemState === 'certificate issued';
        }
        if (statusParam === 'pending' || statusParam === 'pending hours review') {
          return itemState === 'pending hours review';
        }
        if (statusParam === 'not eligible' || statusParam === 'ineligible') {
          return itemState === 'not eligible';
        }
        if (statusParam === 'certificate issued' || statusParam === 'issued') {
          return itemState === 'certificate issued';
        }
        if (statusParam === 'certificate revoked' || statusParam === 'revoked') {
          return itemState === 'certificate revoked';
        }
        return itemState === statusParam;
      });
    }

    const minHoursParam = queryParams.get('min_hours');
    if (minHoursParam) {
      const minH = parseFloat(minHoursParam);
      if (!isNaN(minH)) {
        items = items.filter((x: any) => (x.total_approved_hours || 0) >= minH);
      }
    }

    const summary = {
      total_students: items.length,
      eligible_count: items.filter((x: any) => (x.eligibility_state || '').includes('Eligible') || x.eligibility_state === 'Certificate Issued').length,
      ineligible_count: items.filter((x: any) => x.eligibility_state === 'Not Eligible').length,
      pending_review_count: items.filter((x: any) => x.eligibility_state === 'Pending Hours Review').length,
      issued_count: items.filter((x: any) => x.eligibility_state === 'Certificate Issued').length,
    };

    return {
      report_metadata: {
        institution: 'CHRIST (Deemed to be University), Delhi NCR Campus',
        school: 'School of Sciences',
        organization: 'ADIKALA Volunteer Honor Ledger',
        generated_at: new Date().toISOString(),
      },
      summary,
      items,
    };
  }

  // 11. Certificates & Issuance
  if (endpoint === '/certificates' && method === 'GET') {
    return { items: store.certificates, total: store.certificates.length };
  }

  if (endpoint === '/certificates/issue' && method === 'POST') {
    const sId = body.student_id;
    const student = store.students.find((s: any) => s.student_id === sId);
    const certNum = `CHRIST/ADIKALA/2026/${String(sId).padStart(4, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const newCert = {
      certificate_id: Math.max(...store.certificates.map((c: any) => c.certificate_id), 0) + 1,
      student_id: sId,
      student_name: student?.full_name,
      registration_number: student?.university_registration_number,
      programme: student?.programme,
      policy_id: 1,
      policy_name: 'All-Events Volunteer Honors Policy',
      certificate_number: certNum,
      eligibility_snapshot_minutes: 1200,
      eligibility_snapshot_hours: 20.0,
      issued_at: new Date().toISOString(),
      certificate_status: 'issued',
      verification_token: token,
    };
    store.certificates.unshift(newCert);
    saveDemoStore(store);
    return { message: 'Certificate successfully issued', certificate: newCert };
  }

  if (endpoint.startsWith('/certificates/verify/')) {
    const token = endpoint.split('/')[3];
    const cert = store.certificates.find((c: any) => c.verification_token === token);
    if (!cert) {
      return {
        verification_status: 'NOT_FOUND',
        message: 'No certificate corresponds to this verification token.',
      };
    }
    return {
      verification_status: cert.certificate_status === 'issued' ? 'VALID' : 'REVOKED',
      certificate_number: cert.certificate_number,
      student_name: cert.student_name,
      programme: cert.programme,
      institution: 'CHRIST (Deemed to be University), Delhi NCR Campus',
      school: 'School of Sciences',
      organization: 'ADIKALA Volunteer Honor Ledger',
      policy_name: cert.policy_name,
      verified_volunteer_hours: cert.eligibility_snapshot_hours,
      issued_at: cert.issued_at.slice(0, 10),
      certificate_status: cert.certificate_status,
      revocation_reason: cert.revocation_reason || null,
    };
  }

  if (endpoint.match(/\/certificates\/(\d+)\/revoke/) && method === 'POST') {
    const certId = parseInt(endpoint.split('/')[2]);
    const cert = store.certificates.find((c: any) => c.certificate_id === certId);
    if (!cert) throw new Error('Certificate not found');
    cert.certificate_status = 'revoked';
    cert.revocation_reason = body.reason || 'Revoked per administrative audit';
    saveDemoStore(store);
    return { message: 'Certificate revoked successfully', certificate: cert };
  }

  // 12. Policies & Audit
  if (endpoint === '/admin/certificate-policies' && method === 'GET') {
    return { items: store.policies, total: store.policies.length };
  }

  if (endpoint === '/admin/audit-logs' && method === 'GET') {
    return { items: store.audit_logs, total: store.audit_logs.length };
  }

  if (endpoint === '/reports/event-summary') {
    return { items: store.events.map((e: any) => ({ ...e, total_registered_volunteers: 3, total_approved_hours: 15 })) };
  }

  if (endpoint === '/reports/club-summary') {
    return {
      items: store.clubs.filter((c: any) => c.parent_club_id !== null).map((c: any) => ({
        club_id: c.club_id,
        sub_club: c.club_name,
        verified_hours_contributed: 18.0,
      })),
    };
  }

  return { items: [], total: 0 };
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
  downloadCertificateUrl: (certId: number) => {
    if (isStaticDemo) {
      const store = getDemoStore();
      const cert = store.certificates.find((c: any) => c.certificate_id === certId);
      if (cert) {
        const html = `<!DOCTYPE html><html><head><title>Certificate - ${cert.certificate_number}</title><meta charset="utf-8"/><link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet"><style>body{font-family:'Outfit',sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#0c0e14;color:#1e293b;padding:24px;} .cert{width:820px;border:8px double #e5b842;padding:45px;text-align:center;background:#fff;box-shadow:0 0 40px rgba(229,184,66,0.35);position:relative;border-radius:12px;} .header{font-family:'Cinzel',serif;color:#0f172a;font-size:22px;font-weight:700;letter-spacing:1px;text-transform:uppercase;} .subhead{color:#d97706;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;} .tagline{font-size:10px;color:#78350f;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:6px 0 14px 0;} .cert-title{font-family:'Cinzel',serif;color:#1e293b;font-size:23px;font-weight:800;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:8px 0;margin:10px 0;} .presented{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-top:10px;} .name{font-family:'Cinzel',serif;font-size:28px;font-weight:700;color:#1e3a8a;margin:8px 0;border-bottom:2px solid #e5b842;display:inline-block;padding:0 25px;} .reg{font-size:12px;color:#475569;margin-bottom:12px;font-family:monospace;} p{font-size:13.5px;line-height:1.6;color:#334155;margin:12px auto;max-width:640px;} .hours-badge{display:inline-block;background:#fef3c7;color:#92400e;border:1px solid #f59e0b;padding:5px 16px;border-radius:30px;font-weight:700;font-size:13px;margin:8px 0;} .meta{margin-top:25px;display:flex;justify-content:space-between;border-top:1px dashed #cbd5e1;padding-top:14px;font-size:11.5px;color:#64748b;text-align:left;} .badge{position:absolute;top:25px;right:25px;background:#10b981;color:#fff;padding:4px 12px;border-radius:20px;font-weight:700;font-size:10px;letter-spacing:1px;} .print-btn{margin-top:20px;padding:9px 24px;background:#d97706;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700;font-size:12px;font-family:sans-serif;} .print-btn:hover{background:#b45309;} @media print{body{background:#fff;padding:0;} .cert{box-shadow:none;border-width:6px;} .print-btn{display:none;}}</style></head><body><div class="cert"><div class="badge">${cert.certificate_status.toUpperCase()}</div><div class="header">CHRIST (Deemed to be University)</div><div class="subhead">Delhi NCR Campus • School of Sciences</div><div class="tagline">ADIKALA • IZHAAR KALA KA</div><div class="cert-title">Certificate of Volunteer Contribution</div><div class="presented">This is proudly awarded to</div><div class="name">${cert.student_name}</div><div class="reg">Registration No: <strong>${cert.registration_number || 'N/A'}</strong> ${cert.programme ? '• ' + cert.programme : ''}</div><p>for dedicated and exemplary volunteer service completed across institutional initiatives under the <em>${cert.policy_name}</em>.</p><div class="hours-badge">★ ${cert.eligibility_snapshot_hours} Verified Hours Completed ★</div><div class="meta"><div><strong>Certificate No:</strong> ${cert.certificate_number}<br><strong>Verification Token:</strong> ${cert.verification_token.slice(0, 18)}...</div><div style="text-align:right;"><strong>Status:</strong> ${cert.certificate_status.toUpperCase()}<br><strong>Issued Date:</strong> ${cert.issued_at.slice(0, 10)}<br><span style="color:#10b981;">✓ Cryptographically Verified</span></div></div><div><button class="print-btn" onclick="window.print()">Print / Save as PDF</button></div></div></body></html>`;
        return URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      }
    }
    const token = getToken();
    const q = token ? `?token=${encodeURIComponent(token)}` : '';
    return `/api/v1/certificates/${certId}/download${q}`;
  },
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
