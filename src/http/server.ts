import Fastify from 'fastify';
import type { Client } from 'discord.js';
import { logger } from '../shared/logger.js';
import { registerHealthRoute } from './routes/health.route.js';

export async function createHttpServer(client: Client) {
    const server = Fastify({
        logger: false,
        trustProxy: true,
    });

    server.setErrorHandler((error, request, reply) => {
        logger.error('HTTP request failed.', {
            method: request.method,
            url: request.url,
            error: error.message,
        });

        void reply.code(500).send({
            message: 'Internal server error.',
        });
    });

    await registerHealthRoute(server, client);

    return server;
}
