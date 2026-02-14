import mongoose from 'mongoose';
import { applyBaseSchema } from '../../core/base.model.js';

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  tenantId: { type: String, required: true, unique: true, index: true },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

applyBaseSchema(tenantSchema);

export const Tenant = mongoose.model('Tenant', tenantSchema);
