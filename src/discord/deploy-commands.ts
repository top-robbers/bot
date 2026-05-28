import 'dotenv/config';

import { REST, Routes } from 'discord.js';

import { env } from '../config/env.js';
import { commandPayloads } from './commands/index.js';
import { logger } from '../shared/logger.js';

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

logger.info('Preparing slash commands deployment.', {
    clientId: env.DISCORD_CLIENT_ID,
    guildId: env.DISCORD_GUILD_ID ?? null,
    commands: commandPayloads.map((command) => ({
        name: command.name,
        description: command.description,
    })),
});

try {
    if (!env.DISCORD_GUILD_ID) {
        logger.warn('DISCORD_GUILD_ID is missing. Commands will be deployed globally and may take time to appear.');
    }

    const route = env.DISCORD_GUILD_ID
        ? Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID)
        : Routes.applicationCommands(env.DISCORD_CLIENT_ID);

    const deployedCommands = await rest.put(route, {
        body: commandPayloads,
    });

    logger.info('Slash commands deployed successfully.', {
        scope: env.DISCORD_GUILD_ID ? 'guild' : 'global',
        deployedCommands,
    });
} catch (error) {
    logger.error('Failed to deploy slash commands.', {
        error,
    });

    process.exit(1);
}
