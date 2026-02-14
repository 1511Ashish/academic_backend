import { registerTenant } from './tenant.service.js';
import { success } from '../../utils/response.js';

export async function registerTenantController(req, res, next) {
  try {
    const { name, slug, ownerName, ownerEmail, ownerPassword } = req.body;
    const result = await registerTenant({ name, slug, ownerName, ownerEmail, ownerPassword });
    return success(res, result, 'Tenant registered', 201);
  } catch (err) {
    return next(err);
  }
}
