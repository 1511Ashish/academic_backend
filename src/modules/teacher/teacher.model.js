import mongoose from 'mongoose';
import { applyBaseSchema } from '../../core/base.model.js';
import { generateEmployeeId } from '../../utils/generateEmployeeId.js';

const teacherSchema = new mongoose.Schema({
  employeeName: { type: String, required: true, trim: true, index: true },
  employeeId: { type: String, required: true, unique: true, index: true, immutable: true },
  picture: { type: String, trim: true },
  mobileNumber: { type: String, required: true, trim: true, index: true },
  joiningDate: { type: Date, required: true },
  role: {
    type: String,
    required: true,
    enum: ['Teacher', 'Admin', 'Accountant', 'Principal', 'Clerk', 'Other'],
  },
  monthlySalary: { type: Number, required: true, min: 0 },

  fatherOrHusbandName: { type: String, trim: true },
  nationalId: { type: String, trim: true },
  education: { type: String, trim: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  religion: { type: String, trim: true },
  bloodGroup: { type: String, trim: true },
  experience: { type: Number, min: 0 },
  email: { type: String, lowercase: true, trim: true },
  dateOfBirth: { type: Date },
  address: { type: String, trim: true },

  status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
  isActive: { type: Boolean, default: true, index: true },
});

teacherSchema.index({ tenantId: 1, employeeId: 1 });
teacherSchema.index({ tenantId: 1, employeeName: 1 });
teacherSchema.index({ tenantId: 1, mobileNumber: 1 });
teacherSchema.index(
  { tenantId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);
teacherSchema.index({ tenantId: 1, role: 1, status: 1, isActive: 1 });

teacherSchema.pre('validate', async function assignEmployeeId(next) {
  try {
    if (!this.employeeId) {
      this.employeeId = await generateEmployeeId();
    }
    next();
  } catch (error) {
    next(error);
  }
});

applyBaseSchema(teacherSchema);

export const Teacher = mongoose.model('Teacher', teacherSchema);
