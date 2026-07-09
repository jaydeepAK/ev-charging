import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../api/axios.js';
import { useRealtime } from '../hooks/useRealtime.js';

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-heading text-2xl font-bold text-navy-800 mt-1">{value}</p>
    </div>
  );
}

function PendingStationRow({ station, onDecided }) {
  const [busy, setBusy] = useState(false);

  async function decide(status) {
    setBusy(true);
    try {
      await api.put(`/stations/${station.id}`, { status });
      onDecided();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between border border-slate-200 border-l-4 border-l-accent-400 rounded-xl p-4 transition-all duration-200 hover:shadow-md">
      <div>
        <p className="font-medium text-navy-800">{station.stationName}</p>
        <p className="text-sm text-slate-500">
          {station.address}, {station.city} &middot; owner: {station.owner.name} (
          {station.owner.email})
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{station.chargers.length} charger(s) added</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => decide('APPROVED')}
          disabled={busy}
          className="text-sm font-medium bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Approve
        </button>
        <button
          onClick={() => decide('REJECTED')}
          disabled={busy}
          className="text-sm font-medium bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 px-3.5 py-1.5 rounded-lg transition-all duration-200"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [pending, setPending] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [allStations, setAllStations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchAll(background = false) {
    if (!background) setLoading(true);
    const [pendingRes, analyticsRes, stationsRes, usersRes] = await Promise.all([
      api.get('/stations/pending'),
      api.get('/admin/analytics'),
      api.get('/admin/stations'),
      api.get('/admin/users'),
    ]);
    setPending(pendingRes.data);
    setAnalytics(analyticsRes.data);
    setAllStations(stationsRes.data);
    setAllUsers(usersRes.data);
    if (!background) setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  useRealtime(['station', 'charger', 'booking', 'session', 'payment'], () => fetchAll(true));

  if (loading) {
    return <p className="text-slate-400 text-sm px-4 py-8 max-w-4xl mx-auto">Loading dashboard...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-navy-900 via-navy-700 to-brand-700 p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-10 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl pointer-events-none" />
        <h1 className="font-heading text-2xl font-bold text-white mb-1 relative z-10">Admin Dashboard</h1>
        <p className="text-slate-200 relative z-10">Platform overview and station approvals</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Revenue" value={`₹${analytics.totals.totalRevenue}`} />
        <StatCard label="Total Bookings" value={analytics.totals.totalBookings} />
        <StatCard label="Completed Sessions" value={analytics.totals.completedSessions} />
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold text-navy-800 mb-4">
          Pending Stations ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-400">No stations awaiting approval.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((s) => (
              <PendingStationRow key={s.id} station={s} onDecided={fetchAll} />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <h3 className="font-heading font-semibold text-navy-800 mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analytics.revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#059669" strokeWidth={2.5} dot={{ fill: '#059669', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <h3 className="font-heading font-semibold text-navy-800 mb-4">Bookings Per Day</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.bookingsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#102a43" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <h3 className="font-heading font-semibold text-navy-800 mb-4">Top Stations by Bookings</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={analytics.topStations} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#eab308" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold text-navy-800 mb-3">All Stations ({allStations.length})</h2>
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm">
          {allStations.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-slate-700">
                {s.stationName} &middot; {s.city} &middot; owner: {s.owner.name}
              </span>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  s.status === 'APPROVED'
                    ? 'bg-brand-50 text-brand-700'
                    : s.status === 'REJECTED'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-accent-300/40 text-amber-800'
                }`}
              >
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold text-navy-800 mb-3">All Users ({allUsers.length})</h2>
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm">
          {allUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-slate-700">
                {u.name} &middot; {u.email}
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-navy-50 text-navy-600">
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
