import 'dotenv/config';

import { REST, Routes } from 'discord.js';

import { env } from '../config/env.js';
import { logger } from '../shared/logger.js';

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

try {
    logger.info('Clearing global slash commands.', {
        clientId: env.DISCORD_CLIENT_ID,
    });

    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
        body: [],
    });

    logger.info('Global slash commands cleared.');
} catch (error) {
    logger.error('Failed to clear global slash commands.', {
        error,
    });

    process.exit(1);
}