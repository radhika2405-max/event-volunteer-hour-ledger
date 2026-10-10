import React, { useEffect, useState } from 'react';
import { ShieldAlert, Filter, Clock, User, FileCode, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity_type = entityFilter;
      const res = await api.getAuditLogs(params);
      setLogs(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-purple-700" />
          System Audit Logs & Provenance
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Tamper-evident operational trail of timesheet reviews, administrative corrections, and certificate actions
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-700">Filters:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none bg-white font-medium"
          >
            <option value="">All Entities</option>
            <option value="volunteer_hour_entries">Volunteer Hours</option>
            <option value="certificates">Certificates</option>
            <option value="certificate_policies">Policies</option>
            <option value="system">System</option>
          </select>
        </div>

        <span className="text-slate-500 font-medium">
          {logs.length} Recorded Security Events
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Querying audit history...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-700">No Audit Events Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Operating Actor</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">State Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(l => (
                  <tr key={l.audit_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-purple-50 text-purple-900 border border-purple-200">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold font-mono">
                      {l.entity_type} #{l.entity_id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {l.actor_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={l.reason}>
                      {l.reason || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                      {l.after_state ? JSON.stringify(l.after_state) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
