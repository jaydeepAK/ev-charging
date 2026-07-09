import { prisma } from '../lib/prisma.js';
import { broadcastChange } from '../socket.js';

// POST /session/start — body: { bookingId }
export async function startSession(req, res) {
  try {
    const { bookingId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: { session: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not your booking' });
    }
    if (booking.status !== 'BOOKED') {
      return res.status(400).json({ error: `Cannot start session, booking status is ${booking.status}` });
    }
    if (booking.session) {
      return res.status(409).json({ error: 'Session already started for this booking' });
    }

    const session = await prisma.chargingSession.create({
      data: {
        bookingId: booking.id,
        startTime: new Date(),
      },
    });

    // Flip the charger's status so it actually reflects reality — previously
    // `status` was set once at creation and never updated, which meant the
    // "AVAILABLE / IN_USE / OFFLINE" badge on the Stations page was static.
    await prisma.charger.update({
      where: { id: booking.chargerId },
      data: { status: 'IN_USE' },
    });

    res.status(201).json(session);
    broadcastChange('session');
    broadcastChange('charger'); // charger status changed too — refresh anyone viewing Stations
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start session' });
  }
}

// POST /session/stop — body: { sessionId }
// Mocked "physics": energyConsumed is randomized within a plausible range
// scaled by the charger's power rating, rather than read from real hardware.
export async function stopSession(req, res) {
  try {
    const { sessionId } = req.body;

    const session = await prisma.chargingSession.findUnique({
      where: { id: Number(sessionId) },
      include: { booking: { include: { charger: true } } },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (session.booking.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not your session' });
    }
    if (session.endTime) {
      return res.status(409).json({ error: 'Session already stopped' });
    }

    const endTime = new Date();
    const durationSeconds = Math.max(1, Math.round((endTime - session.startTime) / 1000));

    // Mock energy consumption: assume the charger delivered somewhere between
    // 40-90% of its rated power on average over the session duration.
    const chargerPowerKw = session.booking.charger.power;
    const utilizationFactor = 0.4 + Math.random() * 0.5; // 0.4–0.9
    const durationHours = durationSeconds / 3600;
    const energyConsumed = Number((chargerPowerKw * utilizationFactor * durationHours).toFixed(2));
    const cost = Number((energyConsumed * session.booking.charger.pricePerKwh).toFixed(2));

    const updatedSession = await prisma.chargingSession.update({
      where: { id: session.id },
      data: { endTime, duration: durationSeconds, energyConsumed, cost },
    });

    await prisma.booking.update({
      where: { id: session.booking.id },
      data: { status: 'COMPLETED' },
    });

    // Charging is done — free the charger back up for the next booking.
    await prisma.charger.update({
      where: { id: session.booking.chargerId },
      data: { status: 'AVAILABLE' },
    });

    res.json(updatedSession);
    broadcastChange('session');
    broadcastChange('charger');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to stop session' });
  }
}

// GET /session/history — all sessions belonging to the logged-in customer
export async function sessionHistory(req, res) {
  const sessions = await prisma.chargingSession.findMany({
    where: { booking: { userId: req.user.userId } },
    include: {
      booking: { include: { charger: { include: { station: true } } } },
      payment: true,
    },
    orderBy: { startTime: 'desc' },
  });

  res.json(sessions);
}
