import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';

export interface GetTeamComponentsParams {
  teamId: string;
  pageSize?: number;
  cursor?: string;
}

export interface GetFileComponentsParams {
  fileKey: string;
}

export interface GetComponentParams {
  key: string;
}

export interface GetTeamComponentSetsParams {
  teamId: string;
  pageSize?: number;
  cursor?: string;
}

export interface GetFileComponentSetsParams {
  fileKey: string;
}

export interface GetComponentSetParams {
  key: string;
}

export interface GetTeamStylesParams {
  teamId: string;
  pageSize?: number;
  cursor?: string;
}

export interface GetFileStylesParams {
  fileKey: string;
}

export interface GetStyleParams {
  key: string;
}

/**
 * Components API Client - Handles components and styles operations
 * Endpoints: /v1/components, /v1/component_sets, /v1/styles
 */
export class ComponentsAPIClient extends BaseAPIClient {
  // ==================== Components ====================

  /**
   * Get team components - Returns published components in a team
   */
  async getTeamComponents(params: GetTeamComponentsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/teams/${params.teamId}/components`,
        {
          page_size: params.pageSize,
          cursor: params.cursor,
        }
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Components retrieved for team ${params.teamId}`,
        { teamId: params.teamId }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getTeamComponents(${params.teamId})`);
    }
  }

  /**
   * Get file components - Returns published components in a file
   */
  async getFileComponents(params: GetFileComponentsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/files/${params.fileKey}/components`
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Components retrieved for file ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getFileComponents(${params.fileKey})`);
    }
  }

  /**
   * Get component - Returns a component by key
   */
  async getComponent(params: GetComponentParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(`/v1/components/${params.key}`);

      return ResponseFormatter.formatSuccess(
        response,
        `Component ${params.key} retrieved`,
        { componentKey: params.key }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getComponent(${params.key})`);
    }
  }

  // ==================== Component Sets ====================

  /**
   * Get team component sets - Returns published component sets in a team
   */
  async getTeamComponentSets(params: GetTeamComponentSetsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/teams/${params.teamId}/component_sets`,
        {
          page_size: params.pageSize,
          cursor: params.cursor,
        }
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Component sets retrieved for team ${params.teamId}`,
        { teamId: params.teamId }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getTeamComponentSets(${params.teamId})`);
    }
  }

  /**
   * Get file component sets - Returns published component sets in a file
   */
  async getFileComponentSets(params: GetFileComponentSetsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/files/${params.fileKey}/component_sets`
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Component sets retrieved for file ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getFileComponentSets(${params.fileKey})`);
    }
  }

  /**
   * Get component set - Returns a component set by key
   */
  async getComponentSet(params: GetComponentSetParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(`/v1/component_sets/${params.key}`);

      return ResponseFormatter.formatSuccess(
        response,
        `Component set ${params.key} retrieved`,
        { componentSetKey: params.key }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getComponentSet(${params.key})`);
    }
  }

  // ==================== Styles ====================

  /**
   * Get team styles - Returns published styles in a team
   */
  async getTeamStyles(params: GetTeamStylesParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/teams/${params.teamId}/styles`,
        {
          page_size: params.pageSize,
          cursor: params.cursor,
        }
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Styles retrieved for team ${params.teamId}`,
        { teamId: params.teamId }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getTeamStyles(${params.teamId})`);
    }
  }

  /**
   * Get file styles - Returns published styles in a file
   */
  async getFileStyles(params: GetFileStylesParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/files/${params.fileKey}/styles`
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Styles retrieved for file ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getFileStyles(${params.fileKey})`);
    }
  }

  /**
   * Get style - Returns a style by key
   */
  async getStyle(params: GetStyleParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(`/v1/styles/${params.key}`);

      return ResponseFormatter.formatSuccess(
        response,
        `Style ${params.key} retrieved`,
        { styleKey: params.key }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getStyle(${params.key})`);
    }
  }
}
