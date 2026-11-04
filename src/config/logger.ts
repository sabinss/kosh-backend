import winston from 'winston';
import { Config } from '.';

const logger = winston.createLogger({
    // level: Config.LOG_LEVEL,
    level: 'info',
    defaultMeta: {
        service: 'kosh-server',
    },
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaString = Object.keys(meta).length
                ? `\n${JSON.stringify(meta, null, 2)}`
                : '';
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            return `${timestamp} [${level}]: ${message}${metaString}`;
        }),
    ),
    transports: [
        new winston.transports.File({
            dirname: 'logs',
            filename: 'combined.log',
            level: 'info',
            silent: Config.NODE_ENV === 'test',
        }),
        new winston.transports.File({
            dirname: 'logs',
            filename: 'error.log',
            level: 'error',
            silent: Config.NODE_ENV === 'test',
        }),
        new winston.transports.Console({
            level: 'info',
            silent: Config.NODE_ENV === 'test',
        }),
    ],
});

export default logger;
