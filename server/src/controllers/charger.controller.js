import { prisma } from '../lib/prisma.js';
import { broadcastChange } from '../socket.js';

// GET /chargers?stationId=1
export async function listChargers(req, res) {
  const { stationId } = req.query;

  const chargers = await prisma.charger.findMany({
    where: stationId ? { stationId: Number(stationId) } : undefined,
  });

  res.json(chargers);
}

// POST /chargers — requireAuth + requireRole('OWNER')
export async function createCharger(req, res) {
  try {
    const { stationId, chargerType, power, pricePerKwh } = req.body;

    const station = await prisma.station.findUnique({ where: { id: Number(stationId) } });
    if (!station) return res.status(404).json({ error: 'Station not found' });

    // Ownership check: an owner should only add chargers to their own station.
    if (station.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Not your station' });
    }

    const charger = await prisma.charger.create({
      data: {
        stationId: Number(stationId),
        chargerType,
        power: Number(power),
        pricePerKwh: Number(pricePerKwh),
      },
    });

    res.status(201).json(charger);
    broadcastChange('charger');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create charger' });
  }
}

// PUT /chargers/:id
export async function updateCharger(req, res) {
  const chargerId = Number(req.params.id);

  const charger = await prisma.charger.findUnique({
    where: { id: chargerId },
    include: { station: true },
  });
  if (!charger) return res.status(404).json({ error: 'Charger not found' });

  if (charger.station.ownerId !== req.user.userId) {
    return res.status(403).json({ error: 'Not your charger' });
  }

  const { chargerType, power, pricePerKwh, status } = req.body;

  const updated = await prisma.charger.update({
    where: { id: chargerId },
    data: { chargerType, power, pricePerKwh, status },
  });

  res.json(updated);
  broadcastChange('charger');
}
