import app from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

let server;

async function shutdown(signal) {
  logger.info(`${signal} received, shutting down`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectDb();
  process.exit(0);
}

async function start() {
  await connectDb();

  server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { error: String(reason) });
  });
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message });
  });
}

start().catch((err) => {
  logger.error('Startup failed', { error: err.message });
  process.exit(1);
});
