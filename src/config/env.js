import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGO_URI', 'JWT_SECRET'];
const optional = ['PORT', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const env = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 4000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

export const isCloudinaryConfigured =
  Boolean(env.CLOUDINARY_CLOUD_NAME) && Boolean(env.CLOUDINARY_API_KEY) && Boolean(env.CLOUDINARY_API_SECRET);
