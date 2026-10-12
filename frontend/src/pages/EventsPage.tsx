import React, { useEffect, useState } from 'react';
import { 
  Calendar, MapPin, Users, Plus, CheckCircle, Clock, 
  ExternalLink, ChevronRight, X, AlertCircle 
} from 'lucide-react';
import { api, getCurrentUser } from '../services/api';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Volunteer registration modal
  const [registeringEvent, setRegisteringEvent] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assignedClubId, setAssignedClubId] = useState('');
  const [assignedRole, setAssignedRole] = useState('Volunteer');
  const [regError, setRegError] = useState<string | null>(null);

  // Create event form
  const [eventName, setEventName] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [startDt, setStartDt] = useState('2026-04-10T09:00');
  const [endDt, setEndDt] = useState('2026-04-11T17:00');
  const [selectedSubClubs, setSelectedSubClubs] = useState<number[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);

  const user = getCurrentUser();
  const canCreate = ['admin', 'coordinator'].includes(user?.role);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.getEvents(params);
      setEvents(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    api.getClubs().then(res => setClubs(res.items || [])).catch(() => {});
  }, [statusFilter]);

  const handleSubClubToggle = (clubId: number) => {
    if (selectedSubClubs.includes(clubId)) {
      setSelectedSubClubs(selectedSubClubs.filter(id => id !== clubId));
    } else {
      setSelectedSubClubs([...selectedSubClubs, clubId]);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await api.createEvent({
        event_name: eventName,
        event_code: eventCode,
        venue,
        description,
        start_datetime: startDt,
        end_datetime: endDt,
        sub_club_ids: selectedSubClubs,
      });
      setShowCreateModal(false);
      loadEvents();
    } catch (err: any) {
      setCreateError(err.message || 'Event creation failed');
    }
  };

  const openRegisterModal = async (ev: any) => {
    setRegisteringEvent(ev);
    setRegError(null);
    try {
      const res = await api.getStudents({ limit: 100 });
      setStudents(res.items || []);
    } catch (e) {}
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (!selectedStudentId) {
      setRegError('Please choose a student');
      return;
    }
    try {
      await api.registerVolunteer(registeringEvent.event_id, {
        student_id: parseInt(selectedStudentId),
        assigned_club_id: assignedClubId ? parseInt(assignedClubId) : null,
        assigned_role: assignedRole,
      });
      alert('Volunteer successfully registered!');
      setRegisteringEvent(null);
      loadEvents();
    } catch (err: any) {
      setRegError(err.message || 'Registration failed');
    }
  };

  const subClubsList = clubs.filter(c => c.parent_club_id !== null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Campus Events Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Organize institutional events, connect sub-clubs, and coordinate student volunteer rosters
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['', 'published', 'completed', 'draft'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {st || 'All Statuses'}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading events catalog...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold text-slate-700">No Events Found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map(ev => {
            const isCompleted = ev.event_status === 'completed';
            return (
              <div key={ev.event_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                      {ev.event_code}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      isCompleted
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {ev.event_status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {ev.event_name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {ev.description || 'Department event in collaboration with ADIKALA wings.'}
                  </p>

                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ev.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{new Date(ev.start_datetime).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Sub-clubs Badges */}
                  <div className="mt-3.5 flex flex-wrap gap-1">
                    {ev.sub_clubs?.map((sc: any) => (
                      <span key={sc.club_id} className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                        {sc.club_name.replace(' Sub-club', '')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>{ev.volunteer_count} Volunteers</span>
                    </div>
                    <div className="font-bold text-blue-900">
                      {ev.approved_hours}h verified
                    </div>
                  </div>

                  {canCreate && (
                    <button
                      onClick={() => openRegisterModal(ev)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
                    >
                      + Register
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create Campus Event</h3>
            <p className="text-xs text-slate-500 mb-4">Add a new event and associate collaborating sub-clubs</p>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg mb-4">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Exhibition 2026"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EVT-SCI-2026"
                    value={eventCode}
                    onChange={(e) => setEventCode(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Venue</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Quadrangle & Science Block"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief synopsis of event objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Datetime</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDt}
                    onChange={(e) => setStartDt(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Datetime</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDt}
                    onChange={(e) => setEndDt(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* Sub-clubs Many-to-Many */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Collaborating Sub-Clubs (Many-to-Many Association)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {subClubsList.map(sc => {
                    const checked = selectedSubClubs.includes(sc.club_id);
                    return (
                      <button
                        type="button"
                        key={sc.club_id}
                        onClick={() => handleSubClubToggle(sc.club_id)}
                        className={`p-2 rounded-lg border text-left font-medium transition ${
                          checked
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sc.club_name.replace(' Sub-club', '')}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Volunteer Modal */}
      {registeringEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Register Volunteer for {registeringEvent.event_name}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Assign student to event roster and select designated sub-club wing
            </p>

            {regError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg mb-3">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Student</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white font-medium"
                >
                  <option value="">Choose student...</option>
                  {students.map(s => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.full_name} (#{s.university_registration_number}) — {s.programme}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Sub-Club Wing</label>
                <select
                  value={assignedClubId}
                  onChange={(e) => setAssignedClubId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white font-medium"
                >
                  <option value="">General Event Volunteer</option>
                  {subClubsList.map(c => (
                    <option key={c.club_id} value={c.club_id}>{c.club_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designated Role</label>
                <input
                  type="text"
                  required
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value)}
                  placeholder="e.g. Tech Operations Lead, Head Usher"
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setRegisteringEvent(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
