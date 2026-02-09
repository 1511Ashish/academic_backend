const mongoose = require('mongoose');

const FeeRecordSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    amountDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
    dueDate: { type: Date },
    paidAt: { type: Date },
    notes: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

FeeRecordSchema.index({ student: 1, year: -1, month: -1 });

FeeRecordSchema.pre('save', function updateStatus(next) {
  if (this.amountPaid >= this.amountDue && this.amountDue > 0) {
    this.status = 'paid';
    if (!this.paidAt) this.paidAt = new Date();
  } else if (this.amountPaid > 0) {
    this.status = 'partial';
    this.paidAt = null;
  } else {
    this.status = 'unpaid';
    this.paidAt = null;
  }
  return next();
});

module.exports = mongoose.model('FeeRecord', FeeRecordSchema);
