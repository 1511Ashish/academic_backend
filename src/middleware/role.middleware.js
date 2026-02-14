import { forbidden } from '../utils/response.js';

export function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return forbidden(res, 'Insufficient role');
    }
    return next();
  };
}
