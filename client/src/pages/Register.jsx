import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200';

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-700 to-brand-700">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-16 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-white/10 p-8 relative z-10 animate-slide-up">
        <h1 className="font-heading text-2xl font-bold text-navy-800 mb-1">Create an account</h1>
        <p className="text-sm text-slate-500 mb-6">Join as a customer or a station owner</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">I am a...</label>
            <select
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              className={`${inputClass} bg-white`}
            >
              <option value="CUSTOMER">Customer (book charging slots)</option>
              <option value="OWNER">Station Owner</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
