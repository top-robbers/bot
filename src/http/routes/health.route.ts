import type { Client } from 'discord.js';
import type { FastifyInstance } from 'fastify';

export async function registerHealthRoute(server: FastifyInstance, client: Client): Promise<void> {
    server.get('/health', async () => ({
        ok: true,
        discord: client.isReady() ? 'ready' : 'starting',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    }));
}