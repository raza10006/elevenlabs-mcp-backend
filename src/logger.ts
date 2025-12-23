/**
 * Structured logging utility
 * Logs request IDs, method names, tool names, and order IDs
 * Safely handles errors without exposing secrets
 */

interface LogContext {
  requestId?: string;
  method?: string;
  toolName?: string;
  orderId?: string;
  [key: string]: unknown;
}

class Logger {
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage("INFO", message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = { ...context };
    
    if (error instanceof Error) {
      errorContext.error = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
    } else if (error) {
      errorContext.error = String(error);
    }

    // Remove any potential secrets from error context
    if (errorContext.error && typeof errorContext.error === "object") {
      const errorObj = errorContext.error as Record<string, unknown>;
      Object.keys(errorObj).forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes("key") ||
          lowerKey.includes("secret") ||
          lowerKey.includes("token") ||
          lowerKey.includes("password")
        ) {
          errorObj[key] = "[REDACTED]";
        }
      });
    }

    console.error(this.formatMessage("ERROR", message, errorContext));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage("WARN", message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("DEBUG", message, context));
    }
  }

  // Helper to create a request-scoped logger
  withContext(context: LogContext): {
    info: (message: string, additionalContext?: LogContext) => void;
    error: (message: string, error?: Error | unknown, additionalContext?: LogContext) => void;
    warn: (message: string, additionalContext?: LogContext) => void;
    debug: (message: string, additionalContext?: LogContext) => void;
    requestId: string;
  } {
    const requestId = context.requestId || this.generateRequestId();
    return {
      requestId,
      info: (message: string, additionalContext?: LogContext) => {
        this.info(message, { ...context, ...additionalContext, requestId });
      },
      error: (message: string, error?: Error | unknown, additionalContext?: LogContext) => {
        this.error(message, error, { ...context, ...additionalContext, requestId });
      },
      warn: (message: string, additionalContext?: LogContext) => {
        this.warn(message, { ...context, ...additionalContext, requestId });
      },
      debug: (message: string, additionalContext?: LogContext) => {
        this.debug(message, { ...context, ...additionalContext, requestId });
      },
    };
  }
}

export const logger = new Logger();

