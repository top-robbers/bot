import * as winston from 'winston';
import util from 'node:util';

const { createLogger, format, transports } = winston;

const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const LOG_COLORS: Record<LogLevel, string> = {
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    debug: 'gray',
};

const SENSITIVE_KEY_PATTERN = /token|secret|password|authorization|cookie|apikey|api_key|client_secret/i;

const RESERVED_LOG_KEYS = new Set(['level', 'message', 'timestamp', 'stack', 'service']);

winston.addColors(LOG_COLORS);

function getLogLevel(): LogLevel {
    const value = process.env.LOG_LEVEL?.toLowerCase();

    if (value === 'debug' || value === 'info' || value === 'warn' || value === 'error') {
        return value;
    }

    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function getServiceName(): string {
    return process.env.APP_NAME ?? 'top-robbers-discord-bot';
}

function redactValue(value: unknown, seen: WeakSet<object>, depth = 0): unknown {
    if (depth > 8) {
        return '[MaxDepth]';
    }

    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value !== 'object') {
        return value;
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            stack: value.stack,
        };
    }

    if (seen.has(value)) {
        return '[Circular]';
    }

    seen.add(value);

    if (Array.isArray(value)) {
        return value.map((item) => redactValue(item, seen, depth + 1));
    }

    const output: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
        output[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : redactValue(item, seen, depth + 1);
    }

    return output;
}

const redactSecrets = format((info) => {
    const seen = new WeakSet<object>();

    for (const key of Object.keys(info)) {
        if (RESERVED_LOG_KEYS.has(key)) {
            continue;
        }

        info[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : redactValue(info[key], seen);
    }

    return info;
});

function getMetadata(info: winston.Logform.TransformableInfo): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(info)) {
        if (!RESERVED_LOG_KEYS.has(key)) {
            metadata[key] = value;
        }
    }

    return metadata;
}

const developmentFormat = format.combine(
    format.errors({ stack: true }),
    format.splat(),
    redactSecrets(),
    format.timestamp(),
    format.colorize({ all: true }),
    format.printf((info) => {
        const message = info.stack ?? info.message;
        const metadata = getMetadata(info);

        const metadataText =
            Object.keys(metadata).length > 0
                ? ` ${util.inspect(metadata, {
                      colors: false,
                      depth: 6,
                      breakLength: Infinity,
                      compact: true,
                  })}`
                : '';

        return `${info.timestamp} ${info.level}: ${message}${metadataText}`;
    }),
);

const productionFormat = format.combine(format.errors({ stack: true }), format.splat(), redactSecrets(), format.timestamp(), format.json());

export const logger = createLogger({
    level: getLogLevel(),
    levels: LOG_LEVELS,
    defaultMeta: {
        service: getServiceName(),
    },
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    transports: [
        new transports.Console({
            handleExceptions: true,
            handleRejections: true,
        }),
    ],
    exitOnError: true,
});
