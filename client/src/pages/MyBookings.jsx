import { useEffect, useState } from 'react';
import { api } from '../api/axios.js';
import { useRealtime } from '../hooks/useRealtime.js';

function BookingCard({ booking, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const session = booking.session;

  async function cancelBooking() {
    setBusy(true);
    setError('');
    try {
      await api.put(`/bookings/${booking.id}`, { status: 'CANCELLED' });
      onChange();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel');
    } finally {
      setBusy(false);
    }
  }

  async function startSession() {
    setBusy(true);
    setError('');
    try {
      await api.post('/session/start', { bookingId: booking.id });
      onChange();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session');
    } finally {
      setBusy(false);
    }
  }

  async function stopSession() {
    setBusy(true);
    setError('');
    try {
      await api.post('/session/stop', { sessionId: session.id });
      onChange();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to stop session');
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    setBusy(true);
    setError('');
    try {
      await api.post('/payment/mock-charge', { sessionId: session.id });
      onChange();
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
    } finally {
      setBusy(false);
    }
  }

  const statusStyle = {
    BOOKED: 'bg-navy-50 text-navy-600',
    CANCELLED: 'bg-slate-100 text-slate-500',
    COMPLETED: 'bg-brand-50 text-brand-700',
  }[booking.status];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading font-semibold text-navy-800">{booking.charger.station.stationName}</h3>
          <p className="text-sm text-slate-500">
            {booking.charger.chargerType} &middot; {new Date(booking.startTime).toLocaleString()}{' '}
            &rarr; {new Date(booking.endTime).toLocaleTimeString()}
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle}`}>
          {booking.status}
        </span>
      </div>

      {session && (
        <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 mb-3 space-y-1 border-l-4 border-l-brand-400">
          <p>Session started: {new Date(session.startTime).toLocaleTimeString()}</p>
          {session.endTime && (
            <>
              <p>Energy used: {session.energyConsumed} kWh over {session.duration}s</p>
              <p className="font-medium text-navy-800">Cost: ₹{session.cost}</p>
            </>
          )}
          {session.payment && (
            <p className="text-brand-600 font-medium">
              Paid ✓ (txn {session.payment.transactionId.slice(0, 10)}...)
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <div className="flex gap-2 flex-wrap">
        {booking.status === 'BOOKED' && !session && (
          <>
            <button
              onClick={startSession}
              disabled={busy}
              className="text-sm font-medium bg-navy-800 hover:bg-navy-900 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg transition-all duration-200"
            >
              Start Session
            </button>
            <button
              onClick={cancelBooking}
              disabled={busy}
              className="text-sm font-medium bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 px-3.5 py-1.5 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
          </>
        )}

        {session && !session.endTime && (
          <button
            onClick={stopSession}
            disabled={busy}
            className="text-sm font-medium bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-navy-900 px-3.5 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Stop Session
          </button>
        )}

        {session?.endTime && !session.payment && (
          <button
            onClick={pay}
            disabled={busy}
            className="text-sm font-medium bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Pay ₹{session.cost} (mock)
          </button>
        )}
      </div>
    </div>
  );
}

export function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchBookings(background = false) {
    if (!background) setLoading(true);
    try {
      const { data } = await api.get('/bookings');
      // Most recent first
      setBookings(data);
    } finally {
      if (!background) setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  useRealtime(['booking', 'session', 'payment'], () => fetchBookings(true));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-navy-800 mb-1">My Bookings</h1>
      <p className="text-slate-500 mb-6">Manage your charging sessions and payments</p>

      {loading && <p className="text-slate-400 text-sm">Loading...</p>}
      {!loading && bookings.length === 0 && (
        <p className="text-slate-400 text-sm">
          No bookings yet — head to Stations to book a charging slot.
        </p>
      )}

      <div className="space-y-4">
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} onChange={fetchBookings} />
        ))}
      </div>
    </div>
  );
}
