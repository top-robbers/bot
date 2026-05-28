import { ActivityType, Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import { env } from '../config/env.js';
import { logger } from '../shared/logger.js';
import { commands } from './commands/index.js';

export function createDiscordClient(): Client {
    const client = new Client({
        intents: [GatewayIntentBits.Guilds],
    });

    client.once(Events.ClientReady, (readyClient) => {
        logger.info('Discord client is ready.', {
            user: readyClient.user.tag,
            guilds: readyClient.guilds.cache.size,
        });

        readyClient.user.setPresence({
            status: 'online',
            activities: [
                {
                    name: env.DISCORD_ACTIVITY,
                    type: ActivityType.Watching,
                },
            ],
        });
    });

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) {
            return;
        }

        const command = commands.get(interaction.commandName);

        if (!command) {
            await interaction.reply({
                content: 'Unknown command.',
                flags: MessageFlags.Ephemeral,
            });

            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error('Failed to execute command.', {
                command: interaction.commandName,
                error: error instanceof Error ? error.message : error,
            });

            const response = {
                content: 'An internal error occurred while executing this command.',
                flags: MessageFlags.Ephemeral,
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(response);
                return;
            }

            await interaction.reply(response);
        }
    });

    client.on(Events.Error, (error) => {
        logger.error('Discord client error.', {
            error: error.message,
        });
    });

    client.on(Events.Warn, (message) => {
        logger.warn('Discord client warning.', {
            message,
        });
    });

    return client;
}
