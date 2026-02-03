const mongoose = require('mongoose');

const LoginEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true, lowercase: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    ip: String,
    userAgent: String,
    loggedInAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

LoginEventSchema.index({ loggedInAt: -1 });

module.exports = mongoose.model('LoginEvent', LoginEventSchema);
