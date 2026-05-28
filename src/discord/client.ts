import { Client, Events, GatewayIntentBits, InteractionReplyOptions, MessageFlags } from 'discord.js';

import { commands } from './commands/index.js';
import { logger } from '../shared/logger.js';

export function createDiscordClient(): Client {
    const client = new Client({
        intents: [GatewayIntentBits.Guilds],
    });

    client.once(Events.ClientReady, (readyClient) => {
        logger.info('Discord client ready.', {
            userTag: readyClient.user.tag,
            userId: readyClient.user.id,
            guildCount: readyClient.guilds.cache.size,
        });
    });

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) {
            return;
        }

        const command = commands.get(interaction.commandName);

        if (!command) {
            logger.warn('Unknown command received.', {
                commandName: interaction.commandName,
                guildId: interaction.guildId,
                userId: interaction.user.id,
            });

            const response = {
                content: 'Unknown command.',
                flags: MessageFlags.Ephemeral,
            } satisfies InteractionReplyOptions;

            await interaction.reply(response);

            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error('Command execution failed.', {
                commandName: interaction.commandName,
                guildId: interaction.guildId,
                userId: interaction.user.id,
                error,
            });

            const response = {
                content: 'An internal error occurred while executing this command.',
                flags: MessageFlags.Ephemeral,
            } satisfies InteractionReplyOptions;

            if (interaction.deferred || interaction.replied) {
                await interaction.followUp(response);
                return;
            }

            await interaction.reply(response);
        }
    });

    return client;
}
