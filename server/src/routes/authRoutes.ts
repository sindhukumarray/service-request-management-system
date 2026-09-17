import { Router } from 'express';
import { login, register, getCurrentUser } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimit';

const router = Router();

// Apply login rate limiter to mitigate brute-force attacks
router.post('/login', loginLimiter, login);
router.post('/register', register);
router.get('/me', requireAuth, getCurrentUser);

export default router;
