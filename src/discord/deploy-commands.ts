import 'dotenv/config';

import { REST, Routes } from 'discord.js';

import { env } from '../config/env.js';
import { commandPayloads } from './commands/index.js';
import { logger } from '../shared/logger.js';

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

try {
    logger.info('Deploying guild slash commands.', {
        clientId: env.DISCORD_CLIENT_ID,
        guildId: env.DISCORD_GUILD_ID,
        commands: commandPayloads.map((command) => ({
            name: command.name,
            description: command.description,
        })),
    });

    const deployedCommands = await rest.put(
        Routes.applicationGuildCommands(
            env.DISCORD_CLIENT_ID,
            env.DISCORD_GUILD_ID,
        ),
        {
            body: commandPayloads,
        },
    );

    logger.info('Guild slash commands deployed successfully.', {
        guildId: env.DISCORD_GUILD_ID,
        deployedCommands,
    });
} catch (error) {
    logger.error('Failed to deploy guild slash commands.', {
        error,
    });

    process.exit(1);
}