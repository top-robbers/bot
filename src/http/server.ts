import type { Client } from 'discord.js';
import Fastify, { type FastifyInstance } from 'fastify';

import { env } from '../config/env.js';
import { logger } from '../shared/logger.js';

export async function createHttpServer(_client: Client): Promise<FastifyInstance> {
    const server = Fastify({
        logger: false,
    });

    server.get('/health', async () => {
        return {
            status: 'ok',
            service: 'top-robbers-discord-bot',
        };
    });

    server.post('/internal/events', async (request, reply) => {
        const authorization = request.headers.authorization;
        const expectedAuthorization = `Bearer ${env.INTERNAL_API_SECRET}`;

        if (authorization !== expectedAuthorization) {
            logger.warn('Rejected internal event request.', {
                reason: 'Invalid authorization header',
                ip: request.ip,
            });

            return reply.status(401).send({
                message: 'Unauthorized.',
            });
        }

        logger.info('Internal event received.', {
            body: request.body,
        });

        return reply.status(202).send({
            message: 'Accepted.',
        });
    });

    return server;
}
