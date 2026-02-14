import mongoose from 'mongoose';
import { applyBaseSchema } from '../../core/base.model.js';

const classSchema = new mongoose.Schema({
  className: { type: String, required: true, trim: true },
  monthlyTuitionFee: { type: Number, required: true, min: 0 },
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },

  classCode: { type: String, trim: true },
  description: { type: String, trim: true },
  academicYear: { type: String, trim: true },
  maxStudents: { type: Number, min: 0 },

  isActive: { type: Boolean, default: true, index: true },
});

classSchema.index({ tenantId: 1, className: 1 }, { unique: true });
classSchema.index(
  { tenantId: 1, classCode: 1 },
  { unique: true, partialFilterExpression: { classCode: { $type: 'string' } } }
);
classSchema.index({ tenantId: 1, academicYear: 1, isActive: 1 });
classSchema.index({ tenantId: 1, classTeacher: 1, isActive: 1 });

applyBaseSchema(classSchema);

export const ClassModel = mongoose.model('Class', classSchema);
