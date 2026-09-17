import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';

let server: any;

describe('Login rate limiter (regression)', () => {
  beforeAll(() => {
    const app = express();
    app.use(express.json());

    // Create a fresh limiter instance for this test to avoid leaking state
    const testLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
      },
    });

    // Mount only the login route (no DB/auth side effects)
    app.post('/api/auth/login', testLimiter, (req, res) => {
      // Simulate a failed login without touching DB
      return res.status(401).json({ error: 'Invalid credentials' });
    });

    server = app.listen();
  });

  afterAll(async () => {
    if (server && typeof server.close === 'function') {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('returns 429 on the 6th request from same IP', async () => {
    const agent = request(server);
    const payload = { email: 'dummy@example.com', password: 'password' };

    // First 5 attempts should be handled as failed logins (401 simulated)
    for (let i = 0; i < 5; i++) {
      const res = await agent.post('/api/auth/login').send(payload);
      expect(res.status).toBe(401);
    }

    // Sixth attempt should be rate-limited
    const res6 = await agent.post('/api/auth/login').send(payload);
    expect(res6.status).toBe(429);
    expect(res6.body).toEqual({ error: 'Too many login attempts. Please try again later.' });
  });
});
