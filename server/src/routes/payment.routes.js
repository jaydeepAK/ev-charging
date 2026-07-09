import { Router } from 'express';
import { mockCharge } from '../controllers/payment.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/mock-charge', requireAuth, requireRole('CUSTOMER'), mockCharge);

export default router;
