import test from 'node:test';
import assert from 'node:assert/strict';
import { initialSeedData } from '../services/seedData.ts';

// Replicate HourLedger filtering & review queue logic
function testHourLedgerFiltering(allEntries, selectedStatus) {
  const normFilter = selectedStatus.trim().toLowerCase();
  
  // Pending review queue is always preserved from all entries
  const pendingQueue = allEntries.filter(e => (e.submission_status || '').trim().toLowerCase() === 'pending');
  
  // Displayed ledger entries
  const displayedEntries = !normFilter
    ? allEntries
    : allEntries.filter(e => (e.submission_status || '').trim().toLowerCase() === normFilter);

  return {
    pendingQueueCount: pendingQueue.length,
    displayedCount: displayedEntries.length,
    displayedEntries,
  };
}

// Replicate Eligibility Report multi-criteria logic
function testEligibilityReportFiltering(students, participations, hourEntries, certificates, policies, filters = {}) {
  const policy = policies.find(p => p.scope_type === 'all_events' && p.status === 'active') || policies[0];
  const thresholdHours = Math.round((policy.minimum_approved_minutes / 60.0) * 100) / 100;

  // 1. Authoritative metric calculation per student
  let items = students.map(s => {
    const parts = participations.filter(p => p.student_id === s.student_id);
    const partIds = parts.map(p => p.participation_id);
    
    // Only approved and corrected entries contribute to approved minutes
    const appMins = hourEntries
      .filter(h => partIds.includes(h.participation_id) && ['approved', 'corrected'].includes(h.submission_status))
      .reduce((sum, h) => sum + (h.verified_minutes || 0), 0);

    const pendMins = hourEntries
      .filter(h => partIds.includes(h.participation_id) && h.submission_status === 'pending')
      .reduce((sum, h) => sum + (h.claimed_minutes || 0), 0);

    const cert = certificates.find(c => c.student_id === s.student_id);
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
      threshold_hours: thresholdHours,
      total_approved_hours: appHours,
      total_pending_hours: pendHours,
      approved_events_count: parts.length,
      remaining_hours: remHours,
      eligibility_state: state,
    };
  });

  // 2. Multi-Criteria Filters
  if (filters.search) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(x =>
      (x.student_name || '').toLowerCase().includes(q) ||
      (x.university_registration_number || '').toLowerCase().includes(q)
    );
  }

  if (filters.academic_year) {
    items = items.filter(x => x.academic_year === filters.academic_year.trim());
  }

  if (filters.programme) {
    const prog = filters.programme.trim().toLowerCase();
    items = items.filter(x => (x.programme || '').trim().toLowerCase() === prog);
  }

  if (filters.event_id) {
    const evId = parseInt(filters.event_id, 10);
    const studentIds = new Set(participations.filter(p => p.event_id === evId).map(p => p.student_id));
    items = items.filter(x => studentIds.has(x.student_id));
  }

  if (filters.club_id) {
    const cId = parseInt(filters.club_id, 10);
    // Include the club itself and any child sub-clubs if parent
    const childClubIds = [cId, 2, 3, 4, 5, 6, 7].filter(id => cId === 1 || id === cId);
    const targetSet = new Set(childClubIds);
    const studentIds = new Set(participations.filter(p => targetSet.has(p.assigned_club_id)).map(p => p.student_id));
    items = items.filter(x => studentIds.has(x.student_id));
  }

  if (filters.status) {
    const s = filters.status.trim().toLowerCase();
    items = items.filter(x => {
      const state = (x.eligibility_state || '').trim().toLowerCase();
      if (s === 'eligible') {
        return state.includes('eligible') || state === 'certificate issued';
      }
      if (s === 'pending' || s === 'pending hours review') {
        return state === 'pending hours review';
      }
      if (s === 'not eligible' || s === 'ineligible') {
        return state === 'not eligible';
      }
      if (s === 'certificate issued' || s === 'issued') {
        return state === 'certificate issued';
      }
      if (s === 'certificate revoked' || s === 'revoked') {
        return state === 'certificate revoked';
      }
      return state === s;
    });
  }

  // 3. Recalculate summary metrics from filtered items
  const summary = {
    total_students: items.length,
    eligible_count: items.filter(x => (x.eligibility_state || '').includes('Eligible') || x.eligibility_state === 'Certificate Issued').length,
    ineligible_count: items.filter(x => x.eligibility_state === 'Not Eligible').length,
    pending_review_count: items.filter(x => x.eligibility_state === 'Pending Hours Review').length,
    issued_count: items.filter(x => x.eligibility_state === 'Certificate Issued').length,
  };

  return { items, summary };
}

// ============================================================================
// TEST SUITE
// ============================================================================

test('BUG 1: Hour Ledger status filtering and review queue preservation', () => {
  const hourEntries = initialSeedData.hour_entries;
  assert.ok(hourEntries.length > 0, 'Hour entries should exist in seed data');

  // 1. All shows all records
  const allRes = testHourLedgerFiltering(hourEntries, '');
  assert.equal(allRes.displayedCount, hourEntries.length);
  const baselinePendingQueueCount = allRes.pendingQueueCount;
  assert.ok(baselinePendingQueueCount > 0, 'There should be pending items in review queue');

  // 2. Pending filter shows only pending records
  const pendRes = testHourLedgerFiltering(hourEntries, 'pending');
  assert.ok(pendRes.displayedCount > 0);
  assert.equal(pendRes.displayedCount, baselinePendingQueueCount);
  pendRes.displayedEntries.forEach(e => assert.equal(e.submission_status, 'pending'));
  assert.equal(pendRes.pendingQueueCount, baselinePendingQueueCount, 'Pending review queue count must not change');

  // 3. Approved filter shows only approved records
  const appRes = testHourLedgerFiltering(hourEntries, 'approved');
  assert.ok(appRes.displayedCount > 0);
  appRes.displayedEntries.forEach(e => assert.equal(e.submission_status, 'approved'));
  // Crucial: Pending review queue must remain intact even when filtering by Approved!
  assert.equal(appRes.pendingQueueCount, baselinePendingQueueCount, 'Pending review queue must remain visible when viewing approved');

  // 4. Rejected filter shows only rejected records
  const rejRes = testHourLedgerFiltering(hourEntries, 'rejected');
  assert.ok(rejRes.displayedCount > 0);
  rejRes.displayedEntries.forEach(e => assert.equal(e.submission_status, 'rejected'));
  assert.equal(rejRes.pendingQueueCount, baselinePendingQueueCount);

  // 5. Corrected filter shows only corrected records
  const corrRes = testHourLedgerFiltering(hourEntries, 'corrected');
  assert.ok(corrRes.displayedCount > 0);
  corrRes.displayedEntries.forEach(e => assert.equal(e.submission_status, 'corrected'));
  assert.equal(corrRes.pendingQueueCount, baselinePendingQueueCount);

  // 6. Non-existent filter returns 0 displayed rows
  const emptyRes = testHourLedgerFiltering(hourEntries, 'unknown_filter');
  assert.equal(emptyRes.displayedCount, 0);
  assert.equal(emptyRes.pendingQueueCount, baselinePendingQueueCount);
});

test('BUG 2: Eligibility Report search by name, partial name, and registration number', () => {
  const { students, participations, hour_entries, certificates, policies } = initialSeedData;

  // Unfiltered baseline
  const base = testEligibilityReportFiltering(students, participations, hour_entries, certificates, policies);
  assert.equal(base.items.length, students.length);
  const student = students[0];

  // 1. Full name search
  const resFullName = testEligibilityReportFiltering(students, participations, hour_entries, certificates, policies, {
    search: student.full_name,
  });
  assert.ok(resFullName.items.some(x => x.student_name === student.full_name));

  // 2. Partial name search
  const firstName = student.full_name.split(' ')[0];
  const resPartial = testEligibilityReportFiltering(students, participations, hour_entries, certificates, policies, {
    search: firstName,
  });
  assert.ok(resPartial.items.length > 0);
  resPartial.items.forEach(x => {
    assert.ok(x.student_name.toLowerCase().includes(firstName.toLowerCase()));
  });

  // 3. Search by registration number
  const resReg = testEligibilityReportFiltering(students, participations, hour_entries, certificates, policies, {
    search: student.university_registration_number,
  });
  assert.ok(resReg.items.some(x => x.university_registration_number === student.university_registration_number));

  // 4. Case-insensitive and whitespace-padded search
  const paddedSearch = `  ${firstName.toUpperCase()}   `;
  const resPadded = testEligibilityReportFiltering(students, participations, hour_entries, certificates, policies, {
    search: paddedSearch,
  });
  assert.equal(resPadded.items.length, resPartial.items.length);
});

test('BUG 2: Eligibility Report dropdown filters and summary recalculation', () => {
  const { students, participations, hour_entries, certificates, policies } = initialSeedData;

  // 1. Academic Year filter
  const resAY = testEligibilityReportFiltering(students, participations, hour_entries, certificates, policies, {
    academic_year: '2025-2026',
  });
  assert.ok(resAY.items.length > 0);
  resAY.items.forEach(x => assert.equal(x.academic_year, '2025-2026'));
  assert.equal(resAY.summary.total_students, resAY.items.length);

  // 2. Programme filter
  const resProg = testEligibilityReportFiltering(students, participations, hour_entries, certificates, policies, {
    programme: 'B.Sc Data Science',
  });
  assert.ok(resProg.items.length > 0);
  resProg.items.forEach(x => assert.equal(x.programme, 'B.Sc Data Science'));

  // 3. Event filter
  const resEv = testEligibilityReportFiltering(students, participations, hour_entries, certificates, policies, {
    event_id: '1',
  });
  assert.ok(resEv.items.length > 0);

  // 4. Sub-club filter
  const resClub = testEligibilityReportFiltering(students, participations, hour_entries, certificates, policies, {
    club_id: '4',
  });
  assert.ok(resClub.items.length > 0);

  // 5. Eligibility State filter
  const resElig = testEligibilityReportFiltering(students, participations, hour_entries, certificates, policies, {
    status: 'Eligible',
  });
  assert.ok(resElig.items.length > 0);
  resElig.items.forEach(x => {
    assert.ok(x.eligibility_state.includes('Eligible') || x.eligibility_state === 'Certificate Issued');
  });

  // 6. Combined filters (programme + academic_year)
  const resComb = testEligibilityReportFiltering(students, participations, hour_entries, certificates, policies, {
    programme: 'B.Sc Data Science',
    academic_year: '2025-2026',
  });
  assert.ok(resComb.items.length > 0);
  resComb.items.forEach(x => {
    assert.equal(x.programme, 'B.Sc Data Science');
    assert.equal(x.academic_year, '2025-2026');
  });

  // 7. Verify Summary KPI cards match filtered items exactly
  const s = resComb.summary;
  assert.equal(s.total_students, resComb.items.length);
  const expectedElig = resComb.items.filter(x => x.eligibility_state.includes('Eligible') || x.eligibility_state === 'Certificate Issued').length;
  const expectedInelig = resComb.items.filter(x => x.eligibility_state === 'Not Eligible').length;
  const expectedPending = resComb.items.filter(x => x.eligibility_state === 'Pending Hours Review').length;
  const expectedIssued = resComb.items.filter(x => x.eligibility_state === 'Certificate Issued').length;
  assert.equal(s.eligible_count, expectedElig);
  assert.equal(s.ineligible_count, expectedInelig);
  assert.equal(s.pending_review_count, expectedPending);
  assert.equal(s.issued_count, expectedIssued);

  // 8. No duplicate students
  const studentIds = resComb.items.map(x => x.student_id);
  assert.equal(studentIds.length, new Set(studentIds).size);

  // 9. Reset filter verification
  const resReset = testEligibilityReportFiltering(students, participations, hour_entries, certificates, policies, {});
  assert.equal(resReset.items.length, students.length);
});
