import 'dotenv/config';

import { env } from './config/env.js';
import { createDiscordClient } from './discord/client.js';
import { createHttpServer } from './http/server.js';
import { logger } from './shared/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const client = createDiscordClient();
const server = await createHttpServer(client);

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    logger.info('Shutting down.', { signal });

    try {
        await Promise.race([
            server.close(),
            new Promise<never>((_, reject) =>
                setTimeout(
                    () => reject(new Error(`Shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms`)),
                    SHUTDOWN_TIMEOUT_MS,
                ),
            ),
        ]);

        client.destroy();

        process.exit(0);
    } catch (error) {
        logger.error('Failed to shutdown cleanly.', {
            error: error instanceof Error ? error.message : error,
        });

        process.exit(1);
    }
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

try {
    await server.listen({
        host: env.HTTP_HOST,
        port: env.HTTP_PORT,
    });

    logger.info('HTTP server started.', {
        host: env.HTTP_HOST,
        port: env.HTTP_PORT,
    });

    await client.login(env.DISCORD_TOKEN);
} catch (error) {
    logger.error('Failed to start Discord bot.', {
        error: error instanceof Error ? error.message : error,
    });

    process.exit(1);
}