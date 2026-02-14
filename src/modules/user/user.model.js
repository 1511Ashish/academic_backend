import mongoose from 'mongoose';
import { applyBaseSchema } from '../../core/base.model.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['superadmin', 'schooladmin', 'teacher', 'student'],
    default: 'student',
  },
  profileImage: { type: String },
});

userSchema.index({ email: 1, tenantId: 1 }, { unique: true });

applyBaseSchema(userSchema);

export const User = mongoose.model('User', userSchema);
