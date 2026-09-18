import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { app } from '../server/src/app';

const prisma = new PrismaClient();

let adminToken: string;
let adminId: string;

beforeAll(async () => {
  // Create test admin
  const hash = await bcrypt.hash('TestPassword123!', 12);
  const admin = await prisma.adminUser.create({
    data: {
      username: 'testadmin_auth',
      email: 'testauth@chiro.test',
      passwordHash: hash,
      role: 'SUPERADMIN',
    },
  });
  adminId = admin.id;
});

describe('Admin Authentication', () => {
  it('POST /api/v1/auth/login - rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ usernameOrEmail: 'testadmin_auth', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /api/v1/auth/login - succeeds with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ usernameOrEmail: 'testadmin_auth', password: 'TestPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.admin.username).toBe('testadmin_auth');

    adminToken = res.body.data.token;
  });

  it('GET /api/v1/auth/me - returns admin profile with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.admin.id).toBe(adminId);
  });

  it('GET /api/v1/auth/me - rejects missing token', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me - rejects invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

export { adminToken };
