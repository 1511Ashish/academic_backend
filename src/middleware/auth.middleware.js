import { verifyToken } from '../utils/jwt.js';
import { unauthorized } from '../utils/response.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const tokenFromHeader = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = tokenFromHeader || req.cookies?.token;

  if (!token) {
    return unauthorized(res, 'Missing token');
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
    };
    return next();
  } catch {
    return unauthorized(res, 'Invalid token');
  }
}
