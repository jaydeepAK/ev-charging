import { Router } from 'express';
import {
  listStations,
  getStation,
  createStation,
  updateStation,
  listPendingStations,
  listMyStations,
} from '../controllers/station.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Both of these must come BEFORE '/:id' — otherwise Express matches
// "pending"/"mine" as if they were an :id value.
router.get('/pending', requireAuth, requireRole('ADMIN'), listPendingStations);
router.get('/mine', requireAuth, requireRole('OWNER'), listMyStations);

router.get('/', listStations);                 // public
router.get('/:id', getStation);                 // public
router.post('/', requireAuth, requireRole('OWNER'), createStation);
router.put('/:id', requireAuth, requireRole('OWNER', 'ADMIN'), updateStation);

export default router;
