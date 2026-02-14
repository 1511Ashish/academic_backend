import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
