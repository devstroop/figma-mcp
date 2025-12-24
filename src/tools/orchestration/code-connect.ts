/**
 * Code Connect Tool - Link designs to code implementations
 * 
 * Actions:
 * - list: List dev resources (code links) for nodes
 * - create: Create a new dev resource
 * - update: Update an existing dev resource
 * - delete: Delete a dev resource
 */

import { ClientFactory } from '../../api/client-factory.js';
import { ResponseFormatter } from '../../api/base/response-formatter.js';
import { MCPResponse } from '../../api/base/index.js';
import { CodeConnectParams, CodeConnectResult } from './types.js';

export class CodeConnectTool {
  constructor(private clientFactory: ClientFactory) {}

  async execute(params: CodeConnectParams): Promise<MCPResponse> {
    const { action, fileKey } = params;

    switch (action) {
      case 'list':
        return this.listDevResources(params);
      case 'create':
        return this.createDevResource(params);
      case 'update':
        return this.updateDevResource(params);
      case 'delete':
        return this.deleteDevResource(params);
      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}. Use: list, create, update, delete`);
    }
  }

  private async listDevResources(params: CodeConnectParams): Promise<MCPResponse> {
    const { fileKey, nodeIds } = params;
    const devResourcesClient = this.clientFactory.createDevResourcesClient();

    try {
      const resp = await devResourcesClient.getDevResources({ fileKey, nodeIds });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      const devResources = data['data']?.['dev_resources'] || [];

      // Group by node
      const byNode: Record<string, unknown[]> = {};
      for (const resource of devResources) {
        const r = resource as Record<string, unknown>;
        const nodeId = r['node_id'] as string;
        if (!byNode[nodeId]) {
          byNode[nodeId] = [];
        }
        byNode[nodeId].push({
          id: r['id'],
          name: r['name'],
          url: r['url']
        });
      }

      const result: CodeConnectResult = {
        fileKey,
        action: 'list',
        devResources: Object.entries(byNode).map(([nodeId, resources]) => ({
          nodeId,
          resources
        }))
      };

      return ResponseFormatter.formatSuccess(result, `${devResources.length} dev resources`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`List dev resources failed: ${err.message}`, error);
    }
  }

  private async createDevResource(params: CodeConnectParams): Promise<MCPResponse> {
    const { fileKey, nodeId, url, name } = params;

    if (!nodeId) {
      return ResponseFormatter.formatError('nodeId required for create action');
    }
    if (!url) {
      return ResponseFormatter.formatError('url required for create action');
    }
    if (!name) {
      return ResponseFormatter.formatError('name required for create action');
    }

    const devResourcesClient = this.clientFactory.createDevResourcesClient();

    try {
      const resp = await devResourcesClient.createDevResources([{
        fileKey,
        nodeId,
        url,
        name
      }]);
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};

      const result: CodeConnectResult = {
        fileKey,
        action: 'create',
        created: data['data']
      };

      return ResponseFormatter.formatSuccess(result, `Dev resource created for node ${nodeId}`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Create dev resource failed: ${err.message}`, error);
    }
  }

  private async updateDevResource(params: CodeConnectParams): Promise<MCPResponse> {
    const { fileKey, devResourceId, url, name } = params;

    if (!devResourceId) {
      return ResponseFormatter.formatError('devResourceId required for update action');
    }

    const devResourcesClient = this.clientFactory.createDevResourcesClient();

    try {
      const updateParams: { devResourceId: string; fileKey: string; url?: string; name?: string } = { 
        devResourceId, 
        fileKey 
      };
      if (url) updateParams.url = url;
      if (name) updateParams.name = name;

      const resp = await devResourcesClient.updateDevResources([updateParams]);
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};

      const result: CodeConnectResult = {
        fileKey,
        action: 'update',
        updated: data['data']
      };

      return ResponseFormatter.formatSuccess(result, `Dev resource ${devResourceId} updated`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Update dev resource failed: ${err.message}`, error);
    }
  }

  private async deleteDevResource(params: CodeConnectParams): Promise<MCPResponse> {
    const { fileKey, devResourceId } = params;

    if (!devResourceId) {
      return ResponseFormatter.formatError('devResourceId required for delete action');
    }

    const devResourcesClient = this.clientFactory.createDevResourcesClient();

    try {
      await devResourcesClient.deleteDevResource({
        fileKey,
        devResourceId
      });

      const result: CodeConnectResult = {
        fileKey,
        action: 'delete',
        deleted: true
      };

      return ResponseFormatter.formatSuccess(result, `Dev resource ${devResourceId} deleted`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Delete dev resource failed: ${err.message}`, error);
    }
  }
}
