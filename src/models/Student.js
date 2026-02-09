const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    session: { type: String, required: true, trim: true },
    rollNo: { type: String, trim: true },
    admissionNo: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

StudentSchema.index({ name: 1 });
StudentSchema.index({ admissionNo: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Student', StudentSchema);
