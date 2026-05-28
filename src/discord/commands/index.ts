import { Collection } from 'discord.js';
import { pingCommand } from './ping.command.js';
import type { BotCommand } from './command.js';

export const commands = new Collection<string, BotCommand>();

for (const command of [pingCommand]) {
    commands.set(command.data.name, command);
}

export const commandPayloads = [...commands.values()].map((command) => command.data.toJSON());
