import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Dedicated rate limiter for login attempts to mitigate brute-force attacks
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  },
});

// Dedicated rate limiter for registration attempts to mitigate account-creation abuse
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    return res.status(429).json({ error: 'Too many registration attempts. Please try again later.' });
  },
});
