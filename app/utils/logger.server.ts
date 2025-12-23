/**
 * Server-side Logger Utility
 * Provides structured logging with environment-aware output
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
    info: (message: string, ...args: any[]) => {
        if (isDevelopment) {
            console.info(`[INFO] ${message}`, ...args);
        }
    },

    warn: (message: string, ...args: any[]) => {
        if (isDevelopment) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    },

    error: (message: string, error?: any) => {
        console.error(`[ERROR] ${message}`, error || '');
    },

    debug: (message: string, ...args: any[]) => {
        if (isDevelopment) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    },
};

export default logger;
