const mongoose = require('mongoose');

function redact(uri) {
  try {
    const parsed = new URL(uri);
    if (parsed.password) parsed.password = '***';
    if (parsed.username) parsed.username = '***';
    return parsed.toString();
  } catch (_err) {
    return '<hidden>';
  }
}

async function connectDb(uri) {
  if (!uri) {
    throw new Error('MONGO_URI is missing in environment variables');
  }

  const redacted = redact(uri);

  mongoose.set('strictQuery', true);

  const connection = mongoose.connection;
  connection.on('connected', () => console.log(`[DB] Connected to MongoDB at ${redacted}`));
  connection.on('error', (err) => console.error('[DB] MongoDB connection error', err));
  connection.on('disconnected', () => console.warn('[DB] MongoDB disconnected'));

  console.log(`[DB] Connecting to MongoDB at ${redacted} ...`);
  await mongoose.connect(uri, { autoIndex: true });
  return connection;
}

module.exports = connectDb;
