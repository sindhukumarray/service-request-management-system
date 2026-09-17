import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import request from 'supertest';
import { app } from '../testUtils/app';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../testUtils/db';
import { User } from '../src/models/User';
import { ServiceRequest } from '../src/models/ServiceRequest';
import jwt from 'jsonwebtoken';

describe('RBAC - User restrictions (focused)', () => {
  let userA: any;
  let userB: any;
  let userC: any;
  let reqDoc: any;

  beforeAll(async () => {
    await connectTestDB();
    await clearTestDB();

    userA = await User.create({ name: 'User A', email: 'usera@example.com', passwordHash: 'hash', role: 'USER' });
    userB = await User.create({ name: 'User B', email: 'userb@example.com', passwordHash: 'hash', role: 'USER' });
    userC = await User.create({ name: 'User C', email: 'userc@example.com', passwordHash: 'hash', role: 'USER' });

    reqDoc = await ServiceRequest.create({
      title: 'UserB Request',
      description: 'Owned by User B',
      createdBy: userB._id,
      requestNumber: 'SR-RBAC-1',
      status: 'OPEN',
    });
  });

  afterAll(async () => {
    await clearTestDB();
    await disconnectTestDB();
  });

  it('Normal USER cannot update another user\'s request (should return 403 and not modify)', async () => {
    const tokenA = jwt.sign({ id: userA._id.toString(), role: 'USER', email: userA.email }, process.env.JWT_SECRET || 'secret_key');

    const res = await request(app)
      .patch(`/api/requests/${reqDoc._id.toString()}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'IN_PROGRESS' });

    // Expect forbidden
    expect(res.status).toBe(403);

    // Verify the request in DB was not modified
    const fresh = await ServiceRequest.findById(reqDoc._id);
    expect(fresh).toBeTruthy();
    expect(fresh!.status).toBe('OPEN');
  });

  it('Normal USER cannot assign another user\'s request (should return 403 and not change assignee)', async () => {
    const tokenA = jwt.sign({ id: userA._id.toString(), role: 'USER', email: userA.email }, process.env.JWT_SECRET || 'secret_key');

    const res = await request(app)
      .put(`/api/requests/${reqDoc._id.toString()}/assign`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ assignedTo: userC._id.toString() });

    // Expect forbidden
    expect(res.status).toBe(403);

    // Verify assignedTo was not changed
    const fresh = await ServiceRequest.findById(reqDoc._id);
    expect(fresh).toBeTruthy();
    // If assignedTo is null/undefined, ensure it stays that way
    expect(fresh!.assignedTo == null).toBe(true);
  });
});
