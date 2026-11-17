/**
 * Structured logging (pino) + per-request correlation IDs.
 * Emits JSON in production; human-friendly lines in development.
 */
import pino, { type Logger } from 'pino';
import pinoPretty from 'pino-pretty';
import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';

const isProduction = process.env.NODE_ENV === 'production';
const usePretty = process.env.LOG_PRETTY !== 'false' && !isProduction;

const transport = usePretty
  ? pinoPretty({
      colorize: true,
      translateTime: 'SYS:HH:MM:ss.l',
      ignore: 'pid,hostname',
    })
  : undefined;

export const logger: Logger = pino(
  {
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    formatters: {
      level: (label) => ({ level: label }),
    },
    // Redact common credential fields that must never reach logs
    redact: {
      paths: ['password', 'passwordHash', 'token', 'apiKey', 'authorization', 'apiKeyHash', 'cookie'],
      censor: '[redacted]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport
);

export interface RequestWithId extends Request {
  id: string;
}

/** Attach an X-Request-Id and log each request's completion. */
export function requestLogger(req: RequestWithId, res: Response, next: NextFunction) {
  const incoming = req.headers['x-request-id'];
  req.id = typeof incoming === 'string' && incoming.length > 0 && incoming.length <= 128 ? incoming : randomUUID();
  res.setHeader('X-Request-Id', req.id);

  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const entry = {
      reqId: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms,
    };
    if (res.statusCode >= 500) logger.error(entry, 'request failed');
    else if (res.statusCode >= 400) logger.warn(entry, 'request rejected');
    else logger.info(entry, 'request');
  });

  next();
}
