import { Router } from 'express';
import { login, register, getCurrentUser } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { loginLimiter, registrationLimiter } from '../middleware/rateLimit';

const router = Router();

// Apply login rate limiter to mitigate brute-force attacks
router.post('/login', loginLimiter, login);
// Apply registration rate limiter to mitigate account-creation abuse
router.post('/register', registrationLimiter, register);
router.get('/me', requireAuth, getCurrentUser);

export default router;
