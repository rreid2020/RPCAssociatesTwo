import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';

// Load .env from project root (two levels up from apps/api/src)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootEnvPath = resolve(__dirname, '../../../.env');
config({ path: rootEnvPath });
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { clerkPlugin } from '@clerk/fastify';
import { getClerkConfig, getAppConfig } from '@shared/types';
import { chatRoutes } from './routes/chat';
import { uploadRoutes } from './routes/upload';
import { sourceRoutes } from './routes/sources';
import { healthRoutes } from './routes/health';
import { userRoutes } from './routes/user';
import { formsRoutes } from './routes/forms';

async function build() {
  const app = Fastify({ logger: true });
  const config = getAppConfig();
  const clerkConfig = getClerkConfig();

  // Register plugins
  await app.register(cors, {
    origin: config.appUrl,
    credentials: true,
  });

  await app.register(multipart);

  // Only register Clerk if keys are provided
  if (clerkConfig.publishableKey && clerkConfig.secretKey) {
    await app.register(clerkPlugin, {
      publishableKey: clerkConfig.publishableKey,
      secretKey: clerkConfig.secretKey,
    });
  } else {
    app.log.warn('Clerk keys not configured - authentication will be disabled');
  }

  // Register routes
  await app.register(chatRoutes, { prefix: '/api/chat' });
  await app.register(uploadRoutes, { prefix: '/api/upload' });
  await app.register(sourceRoutes, { prefix: '/api/sources' });
  await app.register(userRoutes, { prefix: '/api/user' });
  await app.register(formsRoutes, { prefix: '/api/forms' });
  await app.register(healthRoutes, { prefix: '/health' });

  return app;
}

async function start() {
  try {
    const app = await build();
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Always start when this file is executed
start();

export { build };

