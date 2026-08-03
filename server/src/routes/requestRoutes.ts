import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
  assignRequest,
  cancelRequest,
} from '../controllers/requestController';

const router = Router();

router.post('/', requireAuth, createRequest);
router.get('/', requireAuth, getRequests);
router.get('/:id', requireAuth, getRequestById);
router.patch('/:id/status', requireAuth, updateRequestStatus);
router.put('/:id/assign', requireAuth, assignRequest);
router.post('/:id/cancel', requireAuth, cancelRequest);

export default router;
