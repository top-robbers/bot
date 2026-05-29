import { z } from 'zod';
import type { FastifyInstance } from 'fastify';

import { env } from '../../config/env.js';
import { logger } from '../../shared/logger.js';

const internalEventSchema = z.object({
    type: z.string().min(1, 'Event type is required.'),
    payload: z.record(z.string(), z.unknown()).optional(),
});

export async function registerInternalEventsRoute(server: FastifyInstance): Promise<void> {
    if (!env.INTERNAL_API_SECRET) {
        logger.warn('INTERNAL_API_SECRET is not set. The /internal/events route is unprotected.');
    }

    server.post('/internal/events', async (request, reply) => {
        if (env.INTERNAL_API_SECRET) {
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
        }

        const parsed = internalEventSchema.safeParse(request.body);

        if (!parsed.success) {
            logger.warn('Rejected internal event request.', {
                reason: 'Invalid request body',
                errors: parsed.error.flatten().fieldErrors,
            });

            return reply.status(400).send({
                message: 'Invalid request body.',
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        logger.info('Internal event received.', {
            type: parsed.data.type,
        });

        return reply.status(202).send({
            message: 'Accepted.',
        });
    });
}