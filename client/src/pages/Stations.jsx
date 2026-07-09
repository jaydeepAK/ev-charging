import { useEffect, useState } from 'react';
import { api } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../hooks/useRealtime.js';

// One row per charger, with its own little booking form. Kept as a separate
// component so each charger's form state (date/time) is independent — typing
// in one charger's fields doesn't affect another's.
function ChargerRow({ charger, onBooked }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  async function handleBook(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Combine separate date + time inputs into full ISO datetimes the
      // backend expects.
      const startISO = new Date(`${date}T${startTime}:00`).toISOString();
      const endISO = new Date(`${date}T${endTime}:00`).toISOString();

      await api.post('/bookings', {
        chargerId: charger.id,
        date,
        startTime: startISO,
        endTime: endISO,
      });

      setSuccess('Booked! Check "My Bookings" to start your session.');
      setShowForm(false);
      onBooked?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  }

  const statusColor =
    charger.status === 'AVAILABLE'
      ? 'bg-brand-50 text-brand-700'
      : charger.status === 'IN_USE'
      ? 'bg-accent-300/40 text-amber-800'
      : 'bg-slate-100 text-slate-500';

  const borderColor =
    charger.status === 'AVAILABLE'
      ? 'border-l-brand-500'
      : charger.status === 'IN_USE'
      ? 'border-l-accent-400'
      : 'border-l-slate-300';

  return (
    <div className={`border border-slate-200 border-l-4 ${borderColor} rounded-xl p-4 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="currentColor" />
            </svg>
          </span>
          <div>
            <p className="font-medium text-slate-900">{charger.chargerType}</p>
            <p className="text-sm text-slate-500">
              {charger.power} kW &middot; ₹{charger.pricePerKwh}/kWh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
            {charger.status}
          </span>

          {user?.role === 'CUSTOMER' && (
            <button
              onClick={() => setShowForm((s) => !s)}
              className="text-sm font-medium bg-navy-800 hover:bg-navy-900 text-white px-3.5 py-1.5 rounded-lg transition-all duration-200"
            >
              {showForm ? 'Cancel' : 'Book'}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleBook} className="mt-4 pt-4 border-t border-slate-100 flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Start</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">End</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {submitting ? 'Booking...' : 'Confirm'}
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {success && <p className="text-sm text-brand-600 mt-2">{success}</p>}
    </div>
  );
}

export function Stations() {
  const [stations, setStations] = useState([]);
  const [city, setCity] = useState('');
  const [chargerType, setChargerType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchStations(background = false) {
    if (!background) setLoading(true);
    setError('');
    try {
      const params = {};
      if (city) params.city = city;
      if (chargerType) params.chargerType = chargerType;

      const { data } = await api.get('/stations', { params });
      setStations(data);
    } catch (err) {
      setError('Failed to load stations');
    } finally {
      if (!background) setLoading(false);
    }
  }

  // Runs once on mount (empty dependency array) — fetches the unfiltered list.
  useEffect(() => {
    fetchStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live updates: if any owner adds a station/charger, an admin approves one,
  // or a customer's session flips a charger to IN_USE/AVAILABLE elsewhere,
  // everyone currently browsing sees it without refreshing. Passed as
  // "background" so it swaps data in quietly instead of blanking the page.
  useRealtime(['station', 'charger'], () => fetchStations(true));

  function handleFilterSubmit(e) {
    e.preventDefault();
    fetchStations();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-navy-800 mb-1">Charging Stations</h1>
      <p className="text-slate-500 mb-6">Browse and filter available stations</p>

      <form onSubmit={handleFilterSubmit} className="flex gap-3 mb-8 flex-wrap">
        <input
          placeholder="City (e.g. Pune)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
        />
        <select
          value={chargerType}
          onChange={(e) => setChargerType(e.target.value)}
          className="border border-slate-300 rounded-lg px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200"
        >
          <option value="">Any charger type</option>
          <option value="Type2">Type2</option>
          <option value="CCS">CCS</option>
          <option value="CHAdeMO">CHAdeMO</option>
        </select>
        <button
          type="submit"
          className="bg-navy-800 hover:bg-navy-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Filter
        </button>
      </form>

      {loading && <p className="text-slate-400 text-sm">Loading stations...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!loading && stations.length === 0 && (
        <p className="text-slate-400 text-sm">No approved stations match your filters yet.</p>
      )}

      <div className="space-y-5">
        {stations.map((station) => (
          <div
            key={station.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-heading font-semibold text-navy-800 text-lg">{station.stationName}</h2>
                <p className="text-sm text-slate-500">
                  {station.address}, {station.city}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {station.latitude}, {station.longitude}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {station.chargers.length === 0 && (
                <p className="text-sm text-slate-400">No chargers added yet.</p>
              )}
              {station.chargers.map((charger) => (
                <ChargerRow key={charger.id} charger={charger} onBooked={fetchStations} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
