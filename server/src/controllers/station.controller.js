import { prisma } from '../lib/prisma.js';
import { broadcastChange } from '../socket.js';

// GET /stations/mine — requireAuth + requireRole('OWNER')
// Unlike the public listStations (APPROVED only), this returns ALL of the
// logged-in owner's stations regardless of status, so they can see and act
// on PENDING/REJECTED ones too.
export async function listMyStations(req, res) {
  const stations = await prisma.station.findMany({
    where: { ownerId: req.user.userId },
    include: { chargers: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(stations);
}

// GET /stations/pending — requireAuth + requireRole('ADMIN')
// Lets an admin see what's awaiting approval before hitting PUT /stations/:id
// to approve/reject. Kept as a separate route rather than a query param on
// listStations because the audience and default filter are completely
// different (public/APPROVED vs admin-only/PENDING).
export async function listPendingStations(req, res) {
  const stations = await prisma.station.findMany({
    where: { status: 'PENDING' },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      chargers: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json(stations);
}

// GET /stations?city=Pune&chargerType=CCS
// Public — customers browse without logging in.
export async function listStations(req, res) {
  const { city, chargerType } = req.query;

  const stations = await prisma.station.findMany({
    where: {
      status: 'APPROVED', // customers should never see pending/rejected stations
      ...(city && { city: { equals: city, mode: 'insensitive' } }),
      ...(chargerType && { chargers: { some: { chargerType } } }),
    },
    include: { chargers: true },
  });

  res.json(stations);
}

export async function getStation(req, res) {
  const id = Number(req.params.id);
  if (!req.params.id || Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid station id' });
  }

  const station = await prisma.station.findUnique({
    where: { id },
    include: { chargers: true },
  });

  if (!station) return res.status(404).json({ error: 'Station not found' });
  res.json(station);
}

// POST /stations — requireAuth + requireRole('OWNER')
export async function createStation(req, res) {
  try {
    const { stationName, address, latitude, longitude, city } = req.body;

    if (!stationName || !address || latitude == null || longitude == null || !city) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const station = await prisma.station.create({
      data: {
        ownerId: req.user.userId, // taken from the token, never from req.body —
        // otherwise an owner could create a station under someone else's id
        stationName,
        address,
        latitude,
        longitude,
        city,
        status: 'PENDING', // admin must approve before customers see it
      },
    });

    res.status(201).json(station);
    broadcastChange('station');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create station' });
  }
}

// PUT /stations/:id — owner can edit their own station; admin can approve/reject
export async function updateStation(req, res) {
  const stationId = Number(req.params.id);
  const station = await prisma.station.findUnique({ where: { id: stationId } });

  if (!station) return res.status(404).json({ error: 'Station not found' });

  const isOwnerOfThisStation = req.user.role === 'OWNER' && station.ownerId === req.user.userId;
  const isAdmin = req.user.role === 'ADMIN';

  if (!isOwnerOfThisStation && !isAdmin) {
    return res.status(403).json({ error: 'Not authorized to edit this station' });
  }

  // Owners can edit details; only admins can change `status` (approve/reject).
  const { stationName, address, latitude, longitude, city, status } = req.body;
  const data = { stationName, address, latitude, longitude, city };
  if (isAdmin && status) data.status = status;

  const updated = await prisma.station.update({ where: { id: stationId }, data });
  res.json(updated);
  broadcastChange('station');
}
