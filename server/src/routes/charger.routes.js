import { Router } from 'express';
import { listChargers, createCharger, updateCharger } from '../controllers/charger.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', listChargers); // public
router.post('/', requireAuth, requireRole('OWNER'), createCharger);
router.put('/:id', requireAuth, requireRole('OWNER'), updateCharger);

export default router;
