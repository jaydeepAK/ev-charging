import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import stationRoutes from './routes/station.routes.js';
import chargerRoutes from './routes/charger.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import sessionRoutes from './routes/session.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { initSocket } from './socket.js';

const app = express();

app.use(cors());          // allows your React dev server (different port) to call this API
app.use(express.json());  // parses JSON request bodies into req.body

app.use('/auth', authRoutes);
app.use('/stations', stationRoutes);
app.use('/chargers', chargerRoutes);
app.use('/bookings', bookingRoutes);
app.use('/session', sessionRoutes);
app.use('/payment', paymentRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => res.json({ status: 'EV Charging API running' }));

// Catch-all error handler — keeps unexpected errors from crashing the process
// and leaking stack traces to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Express's app.listen() normally creates this http.Server internally and
// hides it from you. We create it explicitly here so Socket.IO can attach
// to the SAME server — both plain HTTP requests (your REST API) and the
// WebSocket upgrade requests flow through one server on one port.
const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

