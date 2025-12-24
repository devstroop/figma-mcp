import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';

export interface GetLocalVariablesParams {
  fileKey: string;
}

export interface GetPublishedVariablesParams {
  fileKey: string;
}

export interface PostVariablesParams {
  fileKey: string;
  variableCollections?: VariableCollectionChange[];
  variableModes?: VariableModeChange[];
  variables?: VariableChange[];
  variableModeValues?: VariableModeValue[];
}

export interface VariableCollectionChange {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  id?: string;
  name?: string;
  initialModeId?: string;
}

export interface VariableModeChange {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  id?: string;
  name?: string;
  variableCollectionId?: string;
}

export interface VariableChange {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  id?: string;
  name?: string;
  variableCollectionId?: string;
  resolvedType?: 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR';
  description?: string;
  hiddenFromPublishing?: boolean;
  scopes?: string[];
  codeSyntax?: Record<string, string>;
}

export interface VariableModeValue {
  variableId: string;
  modeId: string;
  value: unknown;
}

/**
 * Variables API Client - Handles variable operations (Enterprise only)
 * Endpoints: /v1/files/{file_key}/variables
 */
export class VariablesAPIClient extends BaseAPIClient {
  /**
   * Get local variables - Returns all local variables in a file
   * Note: Requires Enterprise organization
   */
  async getLocalVariables(params: GetLocalVariablesParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/files/${params.fileKey}/variables/local`
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Local variables retrieved for file ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getLocalVariables(${params.fileKey})`);
    }
  }

  /**
   * Get published variables - Returns all published variables in a file
   * Note: Requires Enterprise organization
   */
  async getPublishedVariables(params: GetPublishedVariablesParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/files/${params.fileKey}/variables/published`
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Published variables retrieved for file ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getPublishedVariables(${params.fileKey})`);
    }
  }

  /**
   * Create/modify/delete variables - Batch variable operations
   * Note: Requires Enterprise organization with Editor seat
   */
  async postVariables(params: PostVariablesParams): Promise<MCPResponse> {
    try {
      const { fileKey, ...body } = params;
      
      const response = await this.post<unknown>(
        `/v1/files/${fileKey}/variables`,
        body
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Variables updated for file ${fileKey}`,
        { fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `postVariables(${params.fileKey})`);
    }
  }
}
