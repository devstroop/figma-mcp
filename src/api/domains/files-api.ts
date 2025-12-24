import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';

export interface GetFileParams {
  fileKey: string;
  version?: string;
  ids?: string[];
  depth?: number;
  geometry?: 'paths';
  pluginData?: string;
  branchData?: boolean;
}

export interface GetFileNodesParams {
  fileKey: string;
  ids: string[];
  version?: string;
  depth?: number;
  geometry?: 'paths';
  pluginData?: string;
}

export interface GetImagesParams {
  fileKey: string;
  ids: string[];
  scale?: number;
  format?: 'jpg' | 'png' | 'svg' | 'pdf';
  svgIncludeId?: boolean;
  svgIncludeNodeId?: boolean;
  svgSimplifyStroke?: boolean;
  contentsOnly?: boolean;
  useAbsoluteBounds?: boolean;
}

export interface GetImageFillsParams {
  fileKey: string;
}

export interface GetFileVersionsParams {
  fileKey: string;
}

/**
 * Files API Client - Handles file operations
 * Endpoints: /v1/files, /v1/images
 */
export class FilesAPIClient extends BaseAPIClient {
  /**
   * Get file JSON - Returns the document as a JSON object
   */
  async getFile(params: GetFileParams): Promise<MCPResponse> {
    try {
      const { fileKey, ...queryParams } = params;
      
      const response = await this.get<unknown>(`/v1/files/${fileKey}`, {
        ...queryParams,
        ids: queryParams.ids?.join(','),
      });

      return ResponseFormatter.formatSuccess(
        response,
        `File ${fileKey} retrieved successfully`,
        { fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getFile(${params.fileKey})`);
    }
  }

  /**
   * Get file nodes - Returns specific nodes from a file
   */
  async getFileNodes(params: GetFileNodesParams): Promise<MCPResponse> {
    try {
      const { fileKey, ids, ...queryParams } = params;
      
      const response = await this.get<unknown>(`/v1/files/${fileKey}/nodes`, {
        ...queryParams,
        ids: ids.join(','),
      });

      return ResponseFormatter.formatSuccess(
        response,
        `Nodes retrieved from file ${fileKey}`,
        { fileKey, nodeCount: ids.length }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getFileNodes(${params.fileKey})`);
    }
  }

  /**
   * Get file metadata - Returns file metadata without the full document
   */
  async getFileMeta(fileKey: string): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(`/v1/files/${fileKey}/meta`);

      return ResponseFormatter.formatSuccess(
        response,
        `File metadata for ${fileKey} retrieved`,
        { fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getFileMeta(${fileKey})`);
    }
  }

  /**
   * Render images - Renders images from file nodes
   */
  async getImages(params: GetImagesParams): Promise<MCPResponse> {
    try {
      const { fileKey, ids, ...queryParams } = params;
      
      const response = await this.get<unknown>(`/v1/images/${fileKey}`, {
        ...queryParams,
        ids: ids.join(','),
      });

      return ResponseFormatter.formatSuccess(
        response,
        `Images rendered for ${ids.length} nodes`,
        { fileKey, nodeCount: ids.length }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getImages(${params.fileKey})`);
    }
  }

  /**
   * Get image fills - Returns URLs for all images in a file
   */
  async getImageFills(params: GetImageFillsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(`/v1/files/${params.fileKey}/images`);

      return ResponseFormatter.formatSuccess(
        response,
        `Image fills retrieved for file ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getImageFills(${params.fileKey})`);
    }
  }

  /**
   * Get file versions - Returns version history for a file
   */
  async getFileVersions(params: GetFileVersionsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(`/v1/files/${params.fileKey}/versions`);

      return ResponseFormatter.formatSuccess(
        response,
        `Version history retrieved for file ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getFileVersions(${params.fileKey})`);
    }
  }
}
