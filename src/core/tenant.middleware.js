import { unauthorized } from '../utils/response.js';

export function tenantMiddleware(req, res, next) {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return unauthorized(res, 'Tenant not found in token');
  }
  req.tenantId = tenantId;
  return next();
}
