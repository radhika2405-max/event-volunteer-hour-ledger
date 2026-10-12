import React, { useEffect, useState } from 'react';
import { 
  Users, Search, Filter, Plus, CheckCircle, Clock, 
  ExternalLink, UserCheck, Shield, ChevronRight, X 
} from 'lucide-react';
import { api, getCurrentUser } from '../services/api';

export const VolunteersPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [programme, setProgramme] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add student form
  const [regNo, setRegNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [progInput, setProgInput] = useState('B.Sc Data Science');
  const [yearInput, setYearInput] = useState('2025-2026');
  const [sectionInput, setSectionInput] = useState('A');
  const [addError, setAddError] = useState<string | null>(null);

  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      const cleanSearch = (debouncedSearch || '').trim();
      if (cleanSearch) params.search = cleanSearch;
      if (programme) params.programme = programme;
      if (academicYear) params.academic_year = academicYear;

      const res = await api.getStudents(params);
      setStudents(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [debouncedSearch, programme, academicYear]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
  };

  const openStudentDetail = async (id: number) => {
    setStudentDetailLoading(true);
    setSelectedStudent(null);
    try {
      const data = await api.getStudentDetail(id);
      setSelectedStudent(data);
    } catch (err: any) {
      alert(`Could not load details: ${err.message}`);
    } finally {
      setStudentDetailLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    try {
      await api.createStudent({
        university_registration_number: regNo,
        full_name: fullName,
        email,
        programme: progInput,
        academic_year: yearInput,
        section: sectionInput,
      });
      setShowAddModal(false);
      setRegNo('');
      setFullName('');
      setEmail('');
      loadStudents();
    } catch (err: any) {
      setAddError(err.message || 'Creation failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Student Volunteers Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Maintain institutional identities, academic programme enrollments, and verified service records
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll New Student</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, or registration number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={programme}
            onChange={(e) => setProgramme(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
          >
            <option value="">All Programmes</option>
            <option value="B.Sc Data Science">B.Sc Data Science</option>
            <option value="BCA">BCA</option>
            <option value="B.Sc Computer Science">B.Sc Computer Science</option>
            <option value="M.Sc Data Science">M.Sc Data Science</option>
            <option value="M.Sc Computer Science">M.Sc Computer Science</option>
          </select>

          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
          >
            <option value="">All Years</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2024-2025">2024-2025</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading student directory...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-700">No Volunteer Profiles Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Reg. No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Institutional Email</th>
                  <th className="py-3 px-4">Programme</th>
                  <th className="py-3 px-3 text-center">Year</th>
                  <th className="py-3 px-3 text-center">Section</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Service Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(s => (
                  <tr key={s.student_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {s.university_registration_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {s.full_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {s.email}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {s.programme}
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-500 font-medium">
                      {s.academic_year}
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-500 font-bold">
                      {s.section || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openStudentDetail(s.student_id)}
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition"
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Dossier Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  {selectedStudent.full_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Registration No: #{selectedStudent.university_registration_number} • {selectedStudent.programme}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
                <p className="text-[10px] font-bold uppercase text-blue-600">Total Approved</p>
                <p className="text-xl font-bold text-blue-900 mt-0.5">{selectedStudent.total_approved_hours}h</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
                <p className="text-[10px] font-bold uppercase text-amber-600">Pending Review</p>
                <p className="text-xl font-bold text-amber-900 mt-0.5">{selectedStudent.total_pending_hours}h</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <p className="text-[10px] font-bold uppercase text-slate-500">Events Attended</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{selectedStudent.participations?.length || 0}</p>
              </div>
            </div>

            {/* Participation Breakdown */}
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Event Participation & Verified Labor History
            </h4>

            {selectedStudent.participations?.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-xl">
                No event participation logged yet.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedStudent.participations?.map((part: any) => (
                  <div key={part.participation_id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900">{part.event_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                        {part.assigned_club_name || 'General'} • {part.assigned_role}
                      </span>
                    </div>

                    {/* Hour entries under this participation */}
                    <div className="mt-2 space-y-1">
                      {part.hours?.map((h: any) => (
                        <div key={h.hour_entry_id} className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-100 text-[11px]">
                          <span>{h.work_date} ({h.start_time?.slice(0, 5)} - {h.end_time?.slice(0, 5)})</span>
                          <span className="font-semibold text-slate-700">{h.claimed_hours}h claimed</span>
                          <span className={`px-2 py-0.2 rounded font-bold uppercase text-[9px] ${
                            h.submission_status === 'approved' || h.submission_status === 'corrected'
                              ? 'bg-emerald-100 text-emerald-800'
                              : h.submission_status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {h.submission_status} ({h.verified_hours}h)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal (Admin only) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">Enroll New Student</h3>
            <p className="text-xs text-slate-500 mb-4">Create academic profile and credentials</p>

            {addError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg mb-3">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2347130"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhika Bansal"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. radhika.b@christuniversity.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Programme</label>
                  <select
                    value={progInput}
                    onChange={(e) => setProgInput(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white"
                  >
                    <option value="B.Sc Data Science">B.Sc Data Science</option>
                    <option value="BCA">BCA</option>
                    <option value="B.Sc Computer Science">B.Sc Computer Science</option>
                    <option value="M.Sc Data Science">M.Sc Data Science</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={sectionInput}
                    onChange={(e) => setSectionInput(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
