import { useEffect, useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { socket } from '../socket.js';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    function handleConnect() {
      setConnected(true);
    }
    function handleDisconnect() {
      setConnected(false);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-all duration-200 ${
      isActive ? 'text-brand-600' : 'text-slate-600 hover:text-navy-800'
    }`;

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
      <Link to="/" className="flex items-center gap-2.5 font-heading font-bold text-navy-800 text-lg transition-all duration-200 hover:opacity-80">
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-navy-700 text-white flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }}>
            <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="#facc15" />
          </svg>
        </span>
        EV Charging
      </Link>

      <span
        className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-400"
        title={connected ? 'Live updates connected' : 'Reconnecting...'}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            connected ? 'bg-brand-500 animate-pulse' : 'bg-slate-300'
          }`}
        />
        {connected ? 'Live' : 'Offline'}
      </span>

      <div className="flex items-center gap-6">
        <NavLink to="/" className={linkClass} end>
          Stations
        </NavLink>

        {user?.role === 'CUSTOMER' && (
          <NavLink to="/my-bookings" className={linkClass}>
            My Bookings
          </NavLink>
        )}

        {user?.role === 'OWNER' && (
          <NavLink to="/owner" className={linkClass}>
            Owner Dashboard
          </NavLink>
        )}

        {user?.role === 'ADMIN' && (
          <NavLink to="/admin" className={linkClass}>
            Admin Dashboard
          </NavLink>
        )}

        {user ? (
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-navy-800">{user.name}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg transition-all duration-200"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-navy-800 transition-all duration-200">
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
