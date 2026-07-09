// Wraps a route so only logged-in users (optionally, only specific roles)
// can reach it. Usage in App.jsx:
//   <Route path="/admin" element={
//     <ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
//   } />

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) {
    // Not logged in at all -> bounce to login
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Logged in, but wrong role for this page -> bounce to home
    // rather than showing a confusing blank/broken page.
    return <Navigate to="/" replace />;
  }

  return children;
}
