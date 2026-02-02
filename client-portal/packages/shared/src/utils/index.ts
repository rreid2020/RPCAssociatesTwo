export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

export function redactPII(text: string): { text: string; redactions: string[] } {
  const redactions: string[] = [];
  let redacted = text;

  // Redact SIN (Social Insurance Number)
  const sinPattern = /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g;
  redacted = redacted.replace(sinPattern, (match) => {
    redactions.push(`SIN: ${match}`);
    return '[REDACTED: SIN]';
  });

  // Redact email addresses
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  redacted = redacted.replace(emailPattern, (match) => {
    redactions.push(`Email: ${match}`);
    return '[REDACTED: Email]';
  });

  // Redact phone numbers
  const phonePattern = /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/g;
  redacted = redacted.replace(phonePattern, (match) => {
    redactions.push(`Phone: ${match}`);
    return '[REDACTED: Phone]';
  });

  return { text: redacted, redactions };
}

export function sanitizeInput(text: string): string {
  // Remove potential prompt injection patterns
  // This is a basic implementation - can be enhanced
  let sanitized = text;

  // Remove system-like instructions
  sanitized = sanitized.replace(/ignore\s+(previous|all)\s+instructions/gi, '');
  sanitized = sanitized.replace(/system\s*:\s*/gi, '');
  sanitized = sanitized.replace(/assistant\s*:\s*/gi, '');

  // Remove excessive newlines
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n');

  return sanitized.trim();
}

export function detectHighRiskTopics(text: string): boolean {
  const lowerText = text.toLowerCase();
  const highRiskKeywords = [
    'gaar',
    'general anti-avoidance rule',
    'aggressive tax planning',
    'tax avoidance',
    'tax evasion',
    'residency',
    'deemed resident',
    'treaty shopping',
    'offshore',
    'tax haven',
    'transfer pricing',
    'thin capitalization',
  ];

  return highRiskKeywords.some((keyword) => lowerText.includes(keyword));
}

export function calculateContentHash(content: string): string {
  // Simple hash function - in production, use crypto.createHash
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export { logger } from './logger';

