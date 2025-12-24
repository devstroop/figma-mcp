import { MCPResponse } from './base-client.js';

export interface ResponseMetadata {
  timestamp: string;
  source?: string;
  fileKey?: string;
  nodeId?: string;
  [key: string]: unknown;
}

export interface FormattedResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
  metadata?: ResponseMetadata;
}

/**
 * Response Formatter - Ensures consistent MCP response formatting
 * All API responses go through this formatter for consistency
 */
export class ResponseFormatter {
  /**
   * Format successful API response for MCP
   */
  static formatSuccess(
    data: unknown,
    message?: string,
    metadata?: Partial<ResponseMetadata>
  ): MCPResponse {
    const response: FormattedResponse = {
      success: true,
      data,
      message: message || 'Operation completed successfully',
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  /**
   * Format error response for MCP
   */
  static formatError(
    error: string,
    details?: unknown,
    metadata?: Partial<ResponseMetadata>
  ): MCPResponse {
    const response: FormattedResponse = {
      success: false,
      error,
      data: details,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'figma-mcp',
        ...metadata,
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
      isError: true,
    };
  }

  /**
   * Format a list response with pagination info
   */
  static formatList(
    items: unknown[],
    message?: string,
    pagination?: {
      total?: number;
      page?: number;
      perPage?: number;
      hasMore?: boolean;
    }
  ): MCPResponse {
    return this.formatSuccess(
      {
        items,
        count: items.length,
        ...pagination,
      },
      message || `Found ${items.length} items`
    );
  }

  /**
   * Format a single item response
   */
  static formatItem(
    item: unknown,
    itemType: string,
    metadata?: Partial<ResponseMetadata>
  ): MCPResponse {
    return this.formatSuccess(item, `${itemType} retrieved successfully`, metadata);
  }
}
