/**
 * Structured logger for the Chaos Oracle agent.
 * Replaces ad-hoc console.log with consistent, parseable output.
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level}] [${entry.module}] ${entry.message}`;
  if (entry.data) {
    return `${base} ${JSON.stringify(entry.data)}`;
  }
  return base;
}

function createLogger(module: string) {
  const log = (level: LogLevel, message: string, data?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
    };
    const formatted = formatEntry(entry);
    if (level === 'ERROR' || level === 'FATAL') {
      console.error(formatted);
    } else if (level === 'WARN') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  };

  return {
    debug: (msg: string, data?: Record<string, unknown>) => log('DEBUG', msg, data),
    info: (msg: string, data?: Record<string, unknown>) => log('INFO', msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => log('WARN', msg, data),
    error: (msg: string, data?: Record<string, unknown>) => log('ERROR', msg, data),
    fatal: (msg: string, data?: Record<string, unknown>) => log('FATAL', msg, data),
  };
}

export default createLogger;
export type { LogLevel, LogEntry };
