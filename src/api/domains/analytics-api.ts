import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';

export interface LibraryAnalyticsParams {
  fileKey: string;
  cursor?: string;
}

export type AnalyticsDimension = 'component' | 'style' | 'variable';
export type AnalyticsType = 'actions' | 'usages';

/**
 * Library Analytics API Client - Handles library analytics operations
 * Endpoints: /v1/analytics/libraries/{file_key}
 */
export class AnalyticsAPIClient extends BaseAPIClient {
  /**
   * Get component actions analytics
   */
  async getComponentActions(params: LibraryAnalyticsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/analytics/libraries/${params.fileKey}/component/actions`,
        { cursor: params.cursor }
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Component actions analytics retrieved for ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getComponentActions(${params.fileKey})`);
    }
  }

  /**
   * Get component usages analytics
   */
  async getComponentUsages(params: LibraryAnalyticsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/analytics/libraries/${params.fileKey}/component/usages`,
        { cursor: params.cursor }
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Component usages analytics retrieved for ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getComponentUsages(${params.fileKey})`);
    }
  }

  /**
   * Get style actions analytics
   */
  async getStyleActions(params: LibraryAnalyticsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/analytics/libraries/${params.fileKey}/style/actions`,
        { cursor: params.cursor }
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Style actions analytics retrieved for ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getStyleActions(${params.fileKey})`);
    }
  }

  /**
   * Get style usages analytics
   */
  async getStyleUsages(params: LibraryAnalyticsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/analytics/libraries/${params.fileKey}/style/usages`,
        { cursor: params.cursor }
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Style usages analytics retrieved for ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getStyleUsages(${params.fileKey})`);
    }
  }

  /**
   * Get variable actions analytics
   */
  async getVariableActions(params: LibraryAnalyticsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/analytics/libraries/${params.fileKey}/variable/actions`,
        { cursor: params.cursor }
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Variable actions analytics retrieved for ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getVariableActions(${params.fileKey})`);
    }
  }

  /**
   * Get variable usages analytics
   */
  async getVariableUsages(params: LibraryAnalyticsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/analytics/libraries/${params.fileKey}/variable/usages`,
        { cursor: params.cursor }
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Variable usages analytics retrieved for ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getVariableUsages(${params.fileKey})`);
    }
  }
}
