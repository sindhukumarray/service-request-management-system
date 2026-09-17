import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../testUtils/app';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../testUtils/db';
import { User } from '../src/models/User';
import { ServiceRequest } from '../src/models/ServiceRequest';
import { isAdmin } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';

let server: any;

describe('RBAC Authorization Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();
    // seed users
    const user = await User.create({ name: 'User A', email: 'usera@example.com', passwordHash: 'hash', role: 'USER' });
    const userB = await User.create({ name: 'User B', email: 'userb@example.com', passwordHash: 'hash', role: 'USER' });
    const admin = await User.create({ name: 'Admin', email: 'admin@example.com', passwordHash: 'hash', role: 'ADMIN' });

    // create request by User B (so User A is a different user attempting the update)
    await ServiceRequest.create({ title: 'Req1', description: 'desc', createdBy: userB._id, requestNumber: 'SR-1' });

    server = app.listen();
  });

  afterAll(async () => {
    await disconnectTestDB();
    // Close the server only if it was started.
    if (server && typeof server.close === 'function') {
      // server.close uses a callback; await it to ensure proper teardown
      await new Promise<void>((resolve, reject) => {
        try {
          server.close((err: any) => (err ? reject(err) : resolve()));
        } catch (e) {
          // If closing fails, log and continue to avoid masking test results
          // eslint-disable-next-line no-console
          console.error('Error closing test server:', e);
          resolve();
        }
      });
    }
  });

  it('USER cannot update another users request (403)', async () => {
    const userB = await User.findOne({ email: 'userb@example.com' });
    const userAToken = jwt.sign({ id: (await User.findOne({ email: 'usera@example.com' }))!._id.toString(), role: 'USER', email: 'usera@example.com' }, process.env.JWT_SECRET || 'secret_key');

    const req = await ServiceRequest.findOne({ requestNumber: 'SR-1' });

    const res = await request(server)
      .patch(`/api/requests/${req!._id.toString()}/status`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ status: 'IN_PROGRESS' });

        // Expect forbidden
    expect(res.status).toBe(403);

    // Verify the request in DB was not modified
    const fresh = await ServiceRequest.findById(req!._id);
    expect(fresh).toBeTruthy();
    expect(fresh!.status).toBe('OPEN');
  });

  it('USER cannot assign another users request (403)', async () => {
    const userAToken = jwt.sign({ id: (await User.findOne({ email: 'usera@example.com' }))!._id.toString(), role: 'USER', email: 'usera@example.com' }, process.env.JWT_SECRET || 'secret_key');
    const req = await ServiceRequest.findOne({ requestNumber: 'SR-1' });

    const res = await request(server)
      .put(`/api/requests/${req!._id.toString()}/assign`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ assignedTo: (await User.findOne({ email: 'userb@example.com' }))!._id.toString() });

        // Expect forbidden
    expect(res.status).toBe(403);

    // Verify the request in DB was not modified
    const fresh = await ServiceRequest.findById(req!._id);
    expect(fresh).toBeTruthy();
    expect(fresh!.status).toBe('OPEN');
  });

  it('ADMIN can update any request (200)', async () => {
    const adminToken = jwt.sign({ id: (await User.findOne({ email: 'admin@example.com' }))!._id.toString(), role: 'ADMIN', email: 'admin@example.com' }, process.env.JWT_SECRET || 'secret_key');
    const req = await ServiceRequest.findOne({ requestNumber: 'SR-1' });

    const res = await request(server)
      .patch(`/api/requests/${req!._id.toString()}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
  });

  it('ADMIN can assign any request (200)', async () => {
    const adminToken = jwt.sign({ id: (await User.findOne({ email: 'admin@example.com' }))!._id.toString(), role: 'ADMIN', email: 'admin@example.com' }, process.env.JWT_SECRET || 'secret_key');
    const req = await ServiceRequest.findOne({ requestNumber: 'SR-1' });

    const res = await request(server)
      .put(`/api/requests/${req!._id.toString()}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedTo: (await User.findOne({ email: 'userb@example.com' }))!._id.toString() });

    expect(res.status).toBe(200);
  });

  it('Token-based role change is enforced (ADMIN -> USER) (403)', async () => {
    // Issue token for admin
    const admin = await User.findOne({ email: 'admin@example.com' });
    const adminToken = jwt.sign({ id: admin!._id.toString(), role: 'ADMIN', email: admin!.email }, process.env.JWT_SECRET || 'secret_key');

    // Demote admin to USER in DB
    admin!.role = 'USER';
    await admin!.save();

    const req = await ServiceRequest.findOne({ requestNumber: 'SR-1' });
    // Try to perform an admin-only action using the old token
    const res = await request(server)
      .patch(`/api/requests/${req!._id.toString()}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED' });

        // Expect forbidden
    expect(res.status).toBe(403);

    // Verify the request in DB was not modified
    const fresh = await ServiceRequest.findById(req!._id);
    expect(fresh).toBeTruthy();
    expect(fresh!.status).toBe('IN_PROGRESS');
  });

  it('Unauthenticated requests return 401', async () => {
    const req = await ServiceRequest.findOne({ requestNumber: 'SR-1' });
    const res = await request(server)
      .patch(`/api/requests/${req!._id.toString()}/status`)
      .send({ status: 'OPEN' });

    expect(res.status).toBe(401);
  });

  it('Rejects missing bearer token even with x-guest-bypass header', async () => {
    const req = await ServiceRequest.findOne({ requestNumber: 'SR-1' });
    const res = await request(server)
      .patch(`/api/requests/${req!._id.toString()}/status`)
      .set('x-guest-bypass', 'true')
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/No token|authorization denied/i);
  });

  it('Normal USER cannot bypass admin check with x-admin-override header', () => {
    const req = {
      headers: { 'x-admin-override': 'true' },
      user: { role: 'USER' },
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('ADMIN can pass admin check normally even with x-admin-override header', () => {
    const req = {
      headers: { 'x-admin-override': 'true' },
      user: { role: 'ADMIN' },
    } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    isAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

