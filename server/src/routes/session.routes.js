import { Router } from 'express';
import { startSession, stopSession, sessionHistory } from '../controllers/session.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/start', requireAuth, requireRole('CUSTOMER'), startSession);
router.post('/stop', requireAuth, requireRole('CUSTOMER'), stopSession);
router.get('/history', requireAuth, requireRole('CUSTOMER'), sessionHistory);

export default router;
