import bcrypt from 'bcrypt';
import { User } from './user.model.js';
import { ApiError } from '../../utils/response.js';

export async function createUser({ name, email, password, role, tenantId, profileImage }) {
  if (!tenantId || !name || !email || !password) {
    throw new ApiError(400, 'Missing required fields');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: passwordHash,
    role,
    tenantId,
    profileImage,
  });
  const userSafe = user.toObject();
  delete userSafe.password;
  return userSafe;
}

export async function listUsers(tenantId) {
  return User.find({ tenantId }).select('-password');
}
