import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Tenant } from './tenant.model.js';
import { User } from '../user/user.model.js';
import { ApiError } from '../../utils/response.js';

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function registerTenant({ name, slug, ownerName, ownerEmail, ownerPassword }) {
  if (!name || !ownerName || !ownerEmail || !ownerPassword) {
    throw new ApiError(400, 'Missing required fields');
  }

  const normalizedEmail = ownerEmail.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'Email is already in use');
  }

  const tenantSlug = slug ? slugify(slug) : slugify(name);
  const existingTenant = await Tenant.findOne({ slug: tenantSlug });
  if (existingTenant) {
    throw new ApiError(409, 'Tenant slug already exists');
  }

  const tenantId = uuidv4();

  const tenant = await Tenant.create({
    name,
    slug: tenantSlug,
    tenantId,
  });

  const passwordHash = await bcrypt.hash(ownerPassword, 12);
  const owner = await User.create({
    name: ownerName,
    email: normalizedEmail,
    password: passwordHash,
    role: 'schooladmin',
    tenantId,
  });

  tenant.ownerUserId = owner._id;
  await tenant.save();

  const ownerSafe = owner.toObject();
  delete ownerSafe.password;

  return { tenant, owner: ownerSafe };
}
