type LogPrefix = 'crawl' | 'ingest' | 'extract' | 'chunk' | 'embed' | 'db';
type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private formatMessage(prefix: LogPrefix, level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefixStr = `[${prefix}]`;
    const levelStr = level.toUpperCase().padEnd(5);
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `${timestamp} ${prefixStr} ${levelStr} ${message}${contextStr}`;
  }

  private log(prefix: LogPrefix, level: LogLevel, message: string, context?: LogContext): void {
    const formatted = this.formatMessage(prefix, level, message, context);
    
    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'info':
      default:
        console.log(formatted);
        break;
    }
  }

  crawl(message: string, context?: LogContext): void {
    this.log('crawl', 'info', message, context);
  }

  crawlWarn(message: string, context?: LogContext): void {
    this.log('crawl', 'warn', message, context);
  }

  crawlError(message: string, context?: LogContext): void {
    this.log('crawl', 'error', message, context);
  }

  ingest(message: string, context?: LogContext): void {
    this.log('ingest', 'info', message, context);
  }

  ingestWarn(message: string, context?: LogContext): void {
    this.log('ingest', 'warn', message, context);
  }

  ingestError(message: string, context?: LogContext): void {
    this.log('ingest', 'error', message, context);
  }

  extract(message: string, context?: LogContext): void {
    this.log('extract', 'info', message, context);
  }

  extractWarn(message: string, context?: LogContext): void {
    this.log('extract', 'warn', message, context);
  }

  extractError(message: string, context?: LogContext): void {
    this.log('extract', 'error', message, context);
  }

  chunk(message: string, context?: LogContext): void {
    this.log('chunk', 'info', message, context);
  }

  chunkWarn(message: string, context?: LogContext): void {
    this.log('chunk', 'warn', message, context);
  }

  chunkError(message: string, context?: LogContext): void {
    this.log('chunk', 'error', message, context);
  }

  embed(message: string, context?: LogContext): void {
    this.log('embed', 'info', message, context);
  }

  embedWarn(message: string, context?: LogContext): void {
    this.log('embed', 'warn', message, context);
  }

  embedError(message: string, context?: LogContext): void {
    this.log('embed', 'error', message, context);
  }

  db(message: string, context?: LogContext): void {
    this.log('db', 'info', message, context);
  }

  dbWarn(message: string, context?: LogContext): void {
    this.log('db', 'warn', message, context);
  }

  dbError(message: string, context?: LogContext): void {
    this.log('db', 'error', message, context);
  }

  // Generic methods for general use
  info(message: string, context?: LogContext): void {
    this.log('db', 'info', message, context); // Use 'db' prefix for generic logs
  }

  warn(message: string, context?: LogContext): void {
    this.log('db', 'warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('db', 'error', message, context);
  }
}

export const logger = new Logger();


