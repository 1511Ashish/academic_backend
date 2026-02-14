import { createUser, listUsers } from './user.service.js';
import { success } from '../../utils/response.js';
import { uploadToCloudinary } from '../../middleware/upload.middleware.js';

export async function createUserController(req, res, next) {
  try {
    const payload = { ...req.body, tenantId: req.tenantId };
    if (req.file?.buffer) {
      payload.profileImage = await uploadToCloudinary(req.file.buffer, 'users');
    }
    const user = await createUser(payload);
    return success(res, user, 'User created', 201);
  } catch (err) {
    return next(err);
  }
}

export async function listUsersController(req, res, next) {
  try {
    const users = await listUsers(req.tenantId);
    return success(res, users, 'Users fetched');
  } catch (err) {
    return next(err);
  }
}
