import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Auth API /api/auth', () => {
  const testEmail = 'test@example.com';
  const testPassword = 'password123';

  describe('POST /api/auth/signup', () => {
    it('creates a user and returns a token', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: testPassword });
      expect(res.status).toBe(201);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.error).toBe(false);
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: 'differentpassword' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in successfully and returns a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('rejects an incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe(true);
    });
  });

  describe('POST /api/auth/change-password', () => {
    let token;

    beforeAll(async () => {
      const password_hash = await bcrypt.hash(testPassword, 10);
      const user = await User.create({ email: 'changepw@example.com', password_hash });
      token = jwt.sign(
        { user_id: user._id, password_version: user.password_version },
        process.env.JWT_SECRET || 'secret'
      );
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .send({ oldPassword: testPassword, newPassword: 'newpassword123' });
      expect(res.status).toBe(401);
    });

    it('changes password successfully', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: testPassword, newPassword: 'newpassword123' });
      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });

    it('invalidates old tokens when password is changed', async () => {
      // Try to change password again using the OLD token
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: 'newpassword123', newPassword: 'evennewerpassword' });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe(true);
    });
  });
});
