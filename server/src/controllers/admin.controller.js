import { prisma } from '../lib/prisma.js';

// GET /admin/stations — every station regardless of status, for admin visibility
export async function listAllStationsAdmin(req, res) {
  const stations = await prisma.station.findMany({
    include: {
      owner: { select: { id: true, name: true, email: true } },
      chargers: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(stations);
}

// GET /admin/users — every user, for admin visibility
export async function listAllUsers(req, res) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
}

// GET /admin/analytics — requireAuth + requireRole('ADMIN')
// For an MVP dataset (dozens-hundreds of rows), aggregating in JS after one
// fetch is simpler and just as fast as writing raw SQL GROUP BY queries, and
// keeps everything in plain Prisma calls. At real scale you'd move this to
// SQL-level aggregation (Prisma's groupBy, or a raw query with DATE_TRUNC).
export async function getAnalytics(req, res) {
  const bookings = await prisma.booking.findMany({
    include: { charger: { include: { station: true } } },
  });

  const payments = await prisma.payment.findMany({
    where: { status: 'SUCCESS' },
  });

  // --- Revenue over time: sum payment amounts by calendar day ---
  const revenueMap = {};
  for (const p of payments) {
    const day = p.createdAt.toISOString().slice(0, 10); // "2026-07-09"
    revenueMap[day] = (revenueMap[day] || 0) + p.amount;
  }
  const revenueByDay = Object.entries(revenueMap)
    .map(([date, amount]) => ({ date, amount: Number(amount.toFixed(2)) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // --- Bookings per day: count bookings by their booked date ---
  const bookingMap = {};
  for (const b of bookings) {
    const day = b.date.toISOString().slice(0, 10);
    bookingMap[day] = (bookingMap[day] || 0) + 1;
  }
  const bookingsByDay = Object.entries(bookingMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // --- Top stations: which stations get booked the most ---
  const stationMap = {};
  for (const b of bookings) {
    const name = b.charger.station.stationName;
    stationMap[name] = (stationMap[name] || 0) + 1;
  }
  const topStations = Object.entries(stationMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.json({
    revenueByDay,
    bookingsByDay,
    topStations,
    totals: {
      totalRevenue: Number(payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)),
      totalBookings: bookings.length,
      completedSessions: bookings.filter((b) => b.status === 'COMPLETED').length,
    },
  });
}
