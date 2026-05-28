import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { BotCommand } from './command.js';

export const pingCommand: BotCommand = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Check if the Top Robbers bot is online.'),

    async execute(interaction) {
        const latency = interaction.client.ws.ping;

        await interaction.reply({
            content: `Pong. Discord latency: ${latency}ms.`,
            flags: MessageFlags.Ephemeral,
        });
    },
};
