import '@fastify/type-provider-typebox';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email?: string;
      [key: string]: unknown;
    };
  }
}

