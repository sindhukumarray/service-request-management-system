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
