import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';

export interface GetDevResourcesParams {
  fileKey: string;
  nodeIds?: string[];
}

export interface CreateDevResourceParams {
  fileKey: string;
  nodeId: string;
  name: string;
  url: string;
}

export interface UpdateDevResourceParams {
  devResourceId: string;
  fileKey: string;
  name?: string;
  url?: string;
}

export interface DeleteDevResourceParams {
  fileKey: string;
  devResourceId: string;
}

/**
 * Dev Resources API Client - Handles Dev Mode resources
 * Endpoints: /v1/dev_resources
 */
export class DevResourcesAPIClient extends BaseAPIClient {
  /**
   * Get dev resources - Returns dev resources for a file
   */
  async getDevResources(params: GetDevResourcesParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/files/${params.fileKey}/dev_resources`,
        { node_ids: params.nodeIds?.join(',') }
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Dev resources retrieved for file ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getDevResources(${params.fileKey})`);
    }
  }

  /**
   * Create dev resources - Creates dev resources in bulk
   */
  async createDevResources(resources: CreateDevResourceParams[]): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/v1/dev_resources', {
        dev_resources: resources.map((r) => ({
          file_key: r.fileKey,
          node_id: r.nodeId,
          name: r.name,
          url: r.url,
        })),
      });

      return ResponseFormatter.formatSuccess(
        response,
        `${resources.length} dev resources created`
      );
    } catch (error) {
      return ErrorHandler.handle(error, 'createDevResources');
    }
  }

  /**
   * Update dev resources - Updates dev resources in bulk
   */
  async updateDevResources(resources: UpdateDevResourceParams[]): Promise<MCPResponse> {
    try {
      const response = await this.put<unknown>('/v1/dev_resources', {
        dev_resources: resources.map((r) => ({
          id: r.devResourceId,
          file_key: r.fileKey,
          name: r.name,
          url: r.url,
        })),
      });

      return ResponseFormatter.formatSuccess(
        response,
        `${resources.length} dev resources updated`
      );
    } catch (error) {
      return ErrorHandler.handle(error, 'updateDevResources');
    }
  }

  /**
   * Delete dev resource - Deletes a single dev resource
   */
  async deleteDevResource(params: DeleteDevResourceParams): Promise<MCPResponse> {
    try {
      await this.delete<unknown>(
        `/v1/files/${params.fileKey}/dev_resources/${params.devResourceId}`
      );

      return ResponseFormatter.formatSuccess(
        { deleted: true, devResourceId: params.devResourceId },
        `Dev resource ${params.devResourceId} deleted`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `deleteDevResource(${params.devResourceId})`);
    }
  }
}
