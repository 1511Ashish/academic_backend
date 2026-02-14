import bcrypt from 'bcrypt';
import { User } from '../user/user.model.js';
import { Tenant } from '../tenant/tenant.model.js';
import { generateToken } from '../../utils/jwt.js';
import { ApiError } from '../../utils/response.js';
import { AuthSession } from './auth.model.js';

export async function login({ email, password, tenantId, tenantSlug, ip, userAgent }) {
  if (!email || !password || (!tenantId && !tenantSlug)) {
    throw new ApiError(400, 'Missing credentials');
  }

  let resolvedTenantId = tenantId;
  if (!resolvedTenantId && tenantSlug) {
    const tenant = await Tenant.findOne({ slug: tenantSlug.toLowerCase() });
    if (!tenant) {
      throw new ApiError(404, 'Tenant not found');
    }
    resolvedTenantId = tenant.tenantId;
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    tenantId: resolvedTenantId,
  }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = generateToken({
    userId: user._id.toString(),
    tenantId: user.tenantId,
    role: user.role,
  });

  await AuthSession.create({
    userId: user._id,
    tenantId: user.tenantId,
    ip,
    userAgent,
  });

  const userSafe = user.toObject();
  delete userSafe.password;

  return { token, user: userSafe };
}
