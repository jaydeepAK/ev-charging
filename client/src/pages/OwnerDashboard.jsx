import { useEffect, useState } from 'react';
import { api } from '../api/axios.js';
import { useRealtime } from '../hooks/useRealtime.js';

const statusStyle = {
  PENDING: 'bg-accent-300/40 text-amber-800',
  APPROVED: 'bg-brand-50 text-brand-700',
  REJECTED: 'bg-red-50 text-red-700',
};

function NewStationForm({ onCreated }) {
  const [form, setForm] = useState({
    stationName: '',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/stations', {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      });
      setForm({ stationName: '', address: '', city: '', latitude: '', longitude: '' });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create station');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200';

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm hover:shadow-md transition-all duration-200">
      <h3 className="font-heading font-semibold text-navy-800">Register a New Station</h3>
      <p className="text-xs text-slate-400 -mt-2">New stations start as PENDING until an admin approves them.</p>

      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Station name"
          required
          value={form.stationName}
          onChange={(e) => update('stationName', e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="City"
          required
          value={form.city}
          onChange={(e) => update('city', e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Address"
          required
          value={form.address}
          onChange={(e) => update('address', e.target.value)}
          className={`${inputClass} col-span-2`}
        />
        <input
          placeholder="Latitude (e.g. 18.52)"
          required
          type="number"
          step="any"
          value={form.latitude}
          onChange={(e) => update('latitude', e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Longitude (e.g. 73.85)"
          required
          type="number"
          step="any"
          value={form.longitude}
          onChange={(e) => update('longitude', e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
      >
        {submitting ? 'Creating...' : 'Register Station'}
      </button>
    </form>
  );
}

function NewChargerForm({ stationId, onCreated }) {
  const [form, setForm] = useState({ chargerType: 'Type2', power: '', pricePerKwh: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/chargers', {
        stationId,
        chargerType: form.chargerType,
        power: Number(form.power),
        pricePerKwh: Number(form.pricePerKwh),
      });
      setForm({ chargerType: 'Type2', power: '', pricePerKwh: '' });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add charger');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end flex-wrap mt-3 pt-3 border-t border-slate-100">
      <select
        value={form.chargerType}
        onChange={(e) => setForm((f) => ({ ...f, chargerType: e.target.value }))}
        className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-white"
      >
        <option value="Type2">Type2</option>
        <option value="CCS">CCS</option>
        <option value="CHAdeMO">CHAdeMO</option>
      </select>
      <input
        placeholder="Power (kW)"
        type="number"
        required
        value={form.power}
        onChange={(e) => setForm((f) => ({ ...f, power: e.target.value }))}
        className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm w-28"
      />
      <input
        placeholder="₹/kWh"
        type="number"
        required
        value={form.pricePerKwh}
        onChange={(e) => setForm((f) => ({ ...f, pricePerKwh: e.target.value }))}
        className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm w-24"
      />
      <button
        type="submit"
        disabled={submitting}
        className="bg-navy-800 hover:bg-navy-900 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200"
      >
        Add Charger
      </button>
      {error && <p className="text-sm text-red-600 w-full">{error}</p>}
    </form>
  );
}

function ChargerRow({ charger, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(charger.pricePerKwh);
  const [status, setStatus] = useState(charger.status);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api.put(`/chargers/${charger.id}`, { pricePerKwh: Number(price), status });
      setEditing(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-700">
        {charger.chargerType} &middot; {charger.power}kW
      </span>

      {!editing ? (
        <div className="flex items-center gap-2">
          <span className="text-slate-500">₹{charger.pricePerKwh}/kWh</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
            {charger.status}
          </span>
          <button onClick={() => setEditing(true)} className="text-brand-600 text-xs font-medium hover:underline">
            Edit
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-xs w-20"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-xs bg-white"
          >
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="IN_USE">IN_USE</option>
            <option value="OFFLINE">OFFLINE</option>
          </select>
          <button
            onClick={save}
            disabled={busy}
            className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium px-2 py-1 rounded transition-all duration-200"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

function StationCard({ station, onChanged }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-heading font-semibold text-navy-800">{station.stationName}</h3>
          <p className="text-sm text-slate-500">
            {station.address}, {station.city}
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[station.status]}`}>
          {station.status}
        </span>
      </div>

      <div className="mt-3">
        {station.chargers.length === 0 && (
          <p className="text-sm text-slate-400">No chargers yet — add one below.</p>
        )}
        {station.chargers.map((c) => (
          <ChargerRow key={c.id} charger={c} onChanged={onChanged} />
        ))}
      </div>

      <NewChargerForm stationId={station.id} onCreated={onChanged} />
    </div>
  );
}

export function OwnerDashboard() {
  const [stations, setStations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchAll(background = false) {
    if (!background) setLoading(true);
    const [stationsRes, bookingsRes] = await Promise.all([
      api.get('/stations/mine'),
      api.get('/bookings'),
    ]);
    setStations(stationsRes.data);
    setBookings(bookingsRes.data);
    if (!background) setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  useRealtime(['station', 'charger', 'booking', 'session', 'payment'], () => fetchAll(true));

  const revenue = bookings.reduce((sum, b) => sum + (b.session?.payment?.amount || 0), 0);

  if (loading) {
    return <p className="text-slate-400 text-sm px-4 py-8 max-w-4xl mx-auto">Loading dashboard...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-navy-900 via-navy-700 to-brand-700 p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-10 w-64 h-64 bg-accent-400/20 rounded-full blur-3xl pointer-events-none" />
        <h1 className="font-heading text-2xl font-bold text-white mb-1 relative z-10">Owner Dashboard</h1>
        <p className="text-slate-200 relative z-10">Manage your stations, chargers, and revenue</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <p className="text-sm text-slate-500">Your Stations</p>
          <p className="font-heading text-2xl font-bold text-navy-800 mt-1">{stations.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <p className="text-sm text-slate-500">Total Bookings</p>
          <p className="font-heading text-2xl font-bold text-navy-800 mt-1">{bookings.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <p className="text-sm text-slate-500">Revenue (paid)</p>
          <p className="font-heading text-2xl font-bold text-brand-600 mt-1">₹{revenue.toFixed(2)}</p>
        </div>
      </div>

      <NewStationForm onCreated={fetchAll} />

      <div className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-navy-800">Your Stations</h2>
        {stations.length === 0 && (
          <p className="text-sm text-slate-400">No stations yet — register one above.</p>
        )}
        {stations.map((s) => (
          <StationCard key={s.id} station={s} onChanged={fetchAll} />
        ))}
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold text-navy-800 mb-3">Recent Bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-slate-400">No bookings on your stations yet.</p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-slate-700">
                  {b.charger.station.stationName} &middot; {b.charger.chargerType} &middot;{' '}
                  {b.user.name}
                </span>
                <span className="text-slate-500">
                  {new Date(b.startTime).toLocaleString()} &middot; {b.status}
                  {b.session?.payment && (
                    <span className="text-brand-600 font-medium ml-2">
                      ₹{b.session.payment.amount} paid
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
