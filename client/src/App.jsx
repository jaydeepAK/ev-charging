import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { Stations } from './pages/Stations.jsx';
import { MyBookings } from './pages/MyBookings.jsx';
import { OwnerDashboard } from './pages/OwnerDashboard.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public: anyone (even logged out) can browse stations */}
          <Route path="/" element={<Stations />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer-only */}
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute roles={['CUSTOMER']}>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          {/* Owner-only */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute roles={['OWNER']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin-only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
