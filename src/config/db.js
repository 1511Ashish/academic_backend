import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDb() {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => logger.info('MongoDB connection established'));
  mongoose.connection.on('error', (error) => logger.error('MongoDB connection error', { error: error.message }));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(env.MONGO_URI, {
    autoIndex: false,
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
