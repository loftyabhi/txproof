import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const nodeEnv = process.env.NODE_ENV || 'development';

// Custom format for structured logging
const structuredFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'service'] }),
    winston.format.json()
);

// Console format for development (more readable)
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${service || 'api'}] ${level}: ${message} ${metaStr}`;
    })
);

// Create logger instance
export const logger = winston.createLogger({
    level: logLevel,
    defaultMeta: { service: 'txproof-api' },
    transports: [
        // Console transport
        new winston.transports.Console({
            format: nodeEnv === 'production' ? structuredFormat : consoleFormat
        }),

        // File transport for production errors
        ...(nodeEnv === 'production' ? [
            new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                format: structuredFormat
            }),
            new winston.transports.File({
                filename: 'logs/combined.log',
                format: structuredFormat
            })
        ] : [])
    ]
});

// Helper to create child logger with specific component context
export const createComponentLogger = (component: string) => {
    return logger.child({ component });
};

// Export convenience methods
export default logger;
