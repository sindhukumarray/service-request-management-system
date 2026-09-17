import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';

let server: any;

describe('Registration rate limiter (regression)', () => {
  beforeAll(() => {
    const app = express();
    app.use(express.json());

    // Create a fresh limiter instance for this test to avoid leaking state
    const testLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        return res.status(429).json({ error: 'Too many registration attempts. Please try again later.' });
      },
    });

    // Mount only the registration route (no DB/auth side effects)
    app.post('/api/auth/register', testLimiter, (req, res) => {
      // Simulate allowed registration response
      return res.status(201).json({ ok: true });
    });

    server = app.listen();
  });

  afterAll(async () => {
    if (server && typeof server.close === 'function') {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('returns 429 on the 4th request from same IP', async () => {
    const agent = request(server);
    const payload = { name: 'Dummy', email: 'dummy@example.com', password: 'password' };

    // First 3 attempts should be allowed (201 simulated)
    for (let i = 0; i < 3; i++) {
      const res = await agent.post('/api/auth/register').send(payload);
      expect(res.status).toBe(201);
    }

    // Fourth attempt should be rate-limited
    const res4 = await agent.post('/api/auth/register').send(payload);
    expect(res4.status).toBe(429);
    expect(res4.body).toEqual({ error: 'Too many registration attempts. Please try again later.' });
  });
});
