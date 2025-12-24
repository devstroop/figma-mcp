import { AxiosError } from 'axios';
import { logger } from '../../logger.js';
import { ResponseFormatter } from './response-formatter.js';
import { MCPResponse } from './base-client.js';

export interface FigmaErrorResponse {
  status?: number;
  err?: string;
  message?: string;
}

export class FigmaAPIError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly figmaError?: string;

  constructor(message: string, status?: number, code?: string, figmaError?: string) {
    super(message);
    this.name = 'FigmaAPIError';
    this.status = status;
    this.code = code;
    this.figmaError = figmaError;
  }
}

/**
 * Error Handler - Centralized error handling for Figma API operations
 */
export class ErrorHandler {
  /**
   * Handle and format errors from Figma API calls
   */
  static handle(error: unknown, context?: string): MCPResponse {
    logger.error('Error occurred', { context, error });

    if (error instanceof FigmaAPIError) {
      return this.handleFigmaError(error, context);
    }

    if (error instanceof AxiosError) {
      return this.handleAxiosError(error, context);
    }

    if (error instanceof Error) {
      return ResponseFormatter.formatError(
        error.message,
        { context },
        { source: 'figma-mcp' }
      );
    }

    return ResponseFormatter.formatError(
      'An unexpected error occurred',
      { context, error: String(error) },
      { source: 'figma-mcp' }
    );
  }

  private static handleFigmaError(error: FigmaAPIError, context?: string): MCPResponse {
    const message = error.figmaError || error.message;
    
    return ResponseFormatter.formatError(
      message,
      {
        context,
        status: error.status,
        code: error.code,
      },
      { source: 'figma-api' }
    );
  }

  private static handleAxiosError(error: AxiosError, context?: string): MCPResponse {
    const status = error.response?.status;
    const data = error.response?.data as FigmaErrorResponse | undefined;

    let message: string;
    switch (status) {
      case 400:
        message = data?.err || 'Bad request - please check your parameters';
        break;
      case 401:
        message = 'Unauthorized - please check your Figma token';
        break;
      case 403:
        message = 'Forbidden - you do not have access to this resource';
        break;
      case 404:
        message = 'Not found - the requested resource does not exist';
        break;
      case 429:
        message = 'Rate limited - please wait before making more requests';
        break;
      case 500:
        message = 'Figma API internal error - please try again later';
        break;
      default:
        message = data?.err || data?.message || error.message || 'API request failed';
    }

    return ResponseFormatter.formatError(
      message,
      {
        context,
        status,
        url: error.config?.url,
      },
      { source: 'figma-api' }
    );
  }

  /**
   * Wrap an async operation with error handling
   */
  static async wrap<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T | MCPResponse> {
    try {
      return await operation();
    } catch (error) {
      return this.handle(error, context);
    }
  }
}
