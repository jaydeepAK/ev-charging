import { prisma } from '../lib/prisma.js';
import { broadcastChange } from '../socket.js';

// POST /bookings — requireAuth (CUSTOMER)
export async function createBooking(req, res) {
  try {
    const { chargerId, date, startTime, endTime } = req.body;

    if (!chargerId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'chargerId, date, startTime, endTime are required' });
    }

    const charger = await prisma.charger.findUnique({ where: { id: Number(chargerId) } });
    if (!charger) return res.status(404).json({ error: 'Charger not found' });

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      return res.status(400).json({ error: 'endTime must be after startTime' });
    }

    // Conflict check: does this charger already have a non-cancelled booking
    // whose window overlaps [start, end)? Overlap condition: existing.start < newEnd
    // AND existing.end > newStart — the standard interval-overlap test.
    const conflict = await prisma.booking.findFirst({
      where: {
        chargerId: Number(chargerId),
        status: { not: 'CANCELLED' },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (conflict) {
      return res.status(409).json({ error: 'Charger is already booked for that time window' });
    }

    const booking = await prisma.booking.create({
      data: {
        userId: req.user.userId,
        chargerId: Number(chargerId),
        date: new Date(date),
        startTime: start,
        endTime: end,
        status: 'BOOKED',
      },
    });

    res.status(201).json(booking);
    broadcastChange('booking');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
}

// GET /bookings — requireAuth. Scope depends on role:
// CUSTOMER -> their own bookings
// OWNER    -> bookings for chargers at stations they own
// ADMIN    -> everything
export async function listBookings(req, res) {
  const { role, userId } = req.user;

  let where = {};
  if (role === 'CUSTOMER') {
    where = { userId };
  } else if (role === 'OWNER') {
    where = { charger: { station: { ownerId: userId } } };
  }
  // ADMIN: where stays {} — no filter, sees all

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      charger: { include: { station: true } },
      user: { select: { id: true, name: true, email: true } },
      session: { include: { payment: true } },
    },
    orderBy: { startTime: 'desc' },
  });

  res.json(bookings);
}

// PUT /bookings/:id — currently only supports cancellation
export async function updateBooking(req, res) {
  const bookingId = Number(req.params.id);
  const { status } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { charger: { include: { station: true } } },
  });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const isOwnBooking = req.user.role === 'CUSTOMER' && booking.userId === req.user.userId;
  const isStationOwner = req.user.role === 'OWNER' && booking.charger.station.ownerId === req.user.userId;
  const isAdmin = req.user.role === 'ADMIN';

  if (!isOwnBooking && !isStationOwner && !isAdmin) {
    return res.status(403).json({ error: 'Not authorized to modify this booking' });
  }

  if (status !== 'CANCELLED') {
    return res.status(400).json({ error: 'Only cancellation is supported here' });
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED' },
  });

  res.json(updated);
  broadcastChange('booking');
}
