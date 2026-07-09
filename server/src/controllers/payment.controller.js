import { prisma } from '../lib/prisma.js';
import { broadcastChange } from '../socket.js';

// POST /payment/mock-charge — body: { sessionId, paymentMethod? }
// This is the one explicitly-mocked piece: no real gateway call. It reads
// the already-computed `cost` off the ChargingSession and writes a Payment
// row, so the schema/flow is identical to what plugging in Stripe/Razorpay
// would look like — only the actual charge call is stubbed.
export async function mockCharge(req, res) {
  try {
    const { sessionId, paymentMethod } = req.body;

    const session = await prisma.chargingSession.findUnique({
      where: { id: Number(sessionId) },
      include: { booking: true, payment: true },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (session.booking.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Not your session' });
    }
    if (!session.endTime || session.cost == null) {
      return res.status(400).json({ error: 'Session must be stopped before payment' });
    }
    if (session.payment) {
      return res.status(409).json({ error: 'Payment already recorded for this session' });
    }

    const payment = await prisma.payment.create({
      data: {
        sessionId: session.id,
        amount: session.cost,
        paymentMethod: paymentMethod || 'MOCK',
        status: 'SUCCESS', // always succeeds — this is the mocked part
      },
    });

    res.status(201).json(payment);
    broadcastChange('payment');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process payment' });
  }
}
