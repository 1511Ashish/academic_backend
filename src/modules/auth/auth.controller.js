import { login } from './auth.service.js';
import { success } from '../../utils/response.js';

export async function loginController(req, res, next) {
  try {
    const { email, password, tenantId, tenantSlug } = req.body;
    const result = await login({
      email,
      password,
      tenantId,
      tenantSlug,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(res, result, 'Login successful');
  } catch (err) {
    return next(err);
  }
}
