import mongoose from 'mongoose';
import { applyBaseSchema } from '../../core/base.model.js';

const authSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ip: { type: String },
  userAgent: { type: String },
});

applyBaseSchema(authSessionSchema);

export const AuthSession = mongoose.model('AuthSession', authSessionSchema);
