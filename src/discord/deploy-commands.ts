import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { env } from '../config/env.js';
import { commandPayloads } from './commands/index.js';
import { logger } from '../shared/logger.js';

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

try {
    if (env.DISCORD_GUILD_ID) {
        logger.info('Deploying guild slash commands.', {
            guildId: env.DISCORD_GUILD_ID,
            commands: commandPayloads.length,
        });

        await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID), {
            body: commandPayloads,
        });

        logger.info('Guild slash commands deployed.');
    } else {
        logger.info('Deploying global slash commands.', {
            commands: commandPayloads.length,
        });

        await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
            body: commandPayloads,
        });

        logger.info('Global slash commands deployed.');
    }
} catch (error) {
    logger.error('Failed to deploy slash commands.', {
        error: error instanceof Error ? error.message : error,
    });

    process.exit(1);
}
