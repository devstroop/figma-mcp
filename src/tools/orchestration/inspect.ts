/**
 * Inspect Tool - Deep inspection of files, nodes, and properties
 * 
 * Actions:
 * - snapshot: Complete file overview with optional components/styles/variables
 * - nodes: Get specific nodes with details
 * - properties: Extract design properties for development
 * - tree: Get document structure
 * - compare: Compare with branch or version
 */

import { ClientFactory } from '../../api/client-factory.js';
import { ResponseFormatter } from '../../api/base/response-formatter.js';
import { MCPResponse } from '../../api/base/index.js';
import { InspectParams, InspectResult } from './types.js';

export class InspectTool {
  constructor(private clientFactory: ClientFactory) {}

  async execute(params: InspectParams): Promise<MCPResponse> {
    const { action, fileKey } = params;

    switch (action) {
      case 'snapshot':
        return this.snapshot(params);
      case 'nodes':
        return this.getNodes(params);
      case 'properties':
        return this.getProperties(params);
      case 'tree':
        return this.getTree(params);
      case 'compare':
        return this.compare(params);
      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}. Use: snapshot, nodes, properties, tree, compare`);
    }
  }

  private async snapshot(params: InspectParams): Promise<MCPResponse> {
    const { fileKey, depth = 'shallow', includeComponents, includeStyles, includeVariables } = params;
    const filesClient = this.clientFactory.createFilesClient();
    const componentsClient = this.clientFactory.createComponentsClient();
    const variablesClient = this.clientFactory.createVariablesClient();

    try {
      // Get file metadata
      const fileResp = await filesClient.getFile({ fileKey, depth: depth === 'shallow' ? 1 : undefined });
      const fileData = fileResp['content']?.[0]?.['text'] ? JSON.parse(fileResp['content'][0]['text']) : {};
      
      const result: InspectResult = {
        fileKey,
        action: 'snapshot',
        file: {
          name: fileData['data']?.['name'] || fileData['name'],
          lastModified: fileData['data']?.['lastModified'] || fileData['lastModified'],
          version: fileData['data']?.['version'] || fileData['version'],
          thumbnailUrl: fileData['data']?.['thumbnailUrl'] || fileData['thumbnailUrl'],
          editorType: fileData['data']?.['editorType'] || fileData['editorType'],
        }
      };

      // Count nodes if full depth
      if (depth === 'full' && fileData['data']?.['document']) {
        const countNodes = (node: unknown): number => {
          if (!node || typeof node !== 'object') return 0;
          const n = node as Record<string, unknown>;
          let count = 1;
          if (Array.isArray(n['children'])) {
            for (const child of n['children']) {
              count += countNodes(child);
            }
          }
          return count;
        };
        result.nodes = [{ totalCount: countNodes(fileData['data']['document']) }];
      }

      // Get components if requested
      if (includeComponents) {
        const compResp = await componentsClient.getFileComponents({ fileKey });
        const compData = compResp['content']?.[0]?.['text'] ? JSON.parse(compResp['content'][0]['text']) : {};
        const components = compData['data']?.['meta']?.['components'] || [];
        result.components = {
          count: components.length,
          items: components.slice(0, 50) // Limit to avoid huge payloads
        };
      }

      // Get styles if requested
      if (includeStyles) {
        const styleResp = await componentsClient.getFileStyles({ fileKey });
        const styleData = styleResp['content']?.[0]?.['text'] ? JSON.parse(styleResp['content'][0]['text']) : {};
        const styles = styleData['data']?.['meta']?.['styles'] || [];
        result.styles = {
          count: styles.length,
          items: styles.slice(0, 50)
        };
      }

      // Get variables if requested
      if (includeVariables) {
        const varResp = await variablesClient.getLocalVariables({ fileKey });
        const varData = varResp['content']?.[0]?.['text'] ? JSON.parse(varResp['content'][0]['text']) : {};
        const collections = Object.values(varData['data']?.['meta']?.['variableCollections'] || {});
        const variables = Object.values(varData['data']?.['meta']?.['variables'] || {});
        
        // Count modes across collections
        let modeCount = 0;
        for (const col of collections) {
          const c = col as Record<string, unknown>;
          if (Array.isArray(c['modes'])) {
            modeCount += c['modes'].length;
          }
        }
        
        result.variables = {
          collections: collections.length,
          count: variables.length,
          modes: modeCount
        };
      }

      return ResponseFormatter.formatSuccess(result, `File snapshot: ${result.file?.name}`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Snapshot failed: ${err.message}`, error);
    }
  }

  private async getNodes(params: InspectParams): Promise<MCPResponse> {
    const { fileKey, nodeIds, geometry = 'none' } = params;
    
    if (!nodeIds || nodeIds.length === 0) {
      return ResponseFormatter.formatError('nodeIds required for nodes action');
    }

    const filesClient = this.clientFactory.createFilesClient();

    try {
      const resp = await filesClient.getFileNodes({
        fileKey,
        ids: nodeIds,
        geometry: geometry === 'paths' ? 'paths' : undefined
      });
      
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      const nodes = data['data']?.['nodes'] || {};

      return ResponseFormatter.formatSuccess({
        fileKey,
        action: 'nodes',
        nodes: Object.entries(nodes).map(([id, node]) => ({
          id,
          ...(node as object)
        }))
      }, `Retrieved ${Object.keys(nodes).length} nodes`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Get nodes failed: ${err.message}`, error);
    }
  }

  private async getProperties(params: InspectParams): Promise<MCPResponse> {
    const { fileKey, nodeIds } = params;
    
    if (!nodeIds || nodeIds.length === 0) {
      return ResponseFormatter.formatError('nodeIds required for properties action');
    }

    const filesClient = this.clientFactory.createFilesClient();

    try {
      // Get nodes with geometry for full property extraction
      const resp = await filesClient.getFileNodes({
        fileKey,
        ids: nodeIds,
        geometry: 'paths'
      });
      
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      const nodes = data['data']?.['nodes'] || {};

      // Extract design properties
      const properties = Object.entries(nodes).map(([id, nodeWrapper]) => {
        const node = (nodeWrapper as Record<string, unknown>)['document'] as Record<string, unknown> || nodeWrapper as Record<string, unknown>;
        
        return {
          id,
          name: node['name'],
          type: node['type'],
          layout: {
            x: node['x'],
            y: node['y'],
            width: node['width'] || (node['absoluteBoundingBox'] as Record<string, unknown>)?.['width'],
            height: node['height'] || (node['absoluteBoundingBox'] as Record<string, unknown>)?.['height'],
            constraints: node['constraints'],
            layoutMode: node['layoutMode'],
            layoutAlign: node['layoutAlign'],
            layoutGrow: node['layoutGrow'],
            padding: {
              top: node['paddingTop'],
              right: node['paddingRight'],
              bottom: node['paddingBottom'],
              left: node['paddingLeft']
            },
            itemSpacing: node['itemSpacing']
          },
          appearance: {
            fills: node['fills'],
            strokes: node['strokes'],
            strokeWeight: node['strokeWeight'],
            cornerRadius: node['cornerRadius'],
            opacity: node['opacity'],
            blendMode: node['blendMode'],
            effects: node['effects']
          },
          typography: node['type'] === 'TEXT' ? {
            fontFamily: (node['style'] as Record<string, unknown>)?.['fontFamily'],
            fontSize: (node['style'] as Record<string, unknown>)?.['fontSize'],
            fontWeight: (node['style'] as Record<string, unknown>)?.['fontWeight'],
            lineHeight: (node['style'] as Record<string, unknown>)?.['lineHeightPx'],
            letterSpacing: (node['style'] as Record<string, unknown>)?.['letterSpacing'],
            textAlignHorizontal: (node['style'] as Record<string, unknown>)?.['textAlignHorizontal'],
            textAlignVertical: (node['style'] as Record<string, unknown>)?.['textAlignVertical'],
            characters: node['characters']
          } : undefined
        };
      });

      return ResponseFormatter.formatSuccess({
        fileKey,
        action: 'properties',
        nodes: properties
      }, `Extracted properties for ${properties.length} nodes`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Get properties failed: ${err.message}`, error);
    }
  }

  private async getTree(params: InspectParams): Promise<MCPResponse> {
    const { fileKey, depth_limit = 3 } = params;
    const filesClient = this.clientFactory.createFilesClient();

    try {
      const resp = await filesClient.getFile({ fileKey, depth: depth_limit });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      const document = data['data']?.['document'];

      // Build simplified tree structure
      const buildTree = (node: unknown, depth: number): unknown => {
        if (!node || typeof node !== 'object' || depth > depth_limit) return null;
        const n = node as Record<string, unknown>;
        
        const treeNode: Record<string, unknown> = {
          id: n['id'],
          name: n['name'],
          type: n['type']
        };

        if (Array.isArray(n['children']) && depth < depth_limit) {
          treeNode['children'] = n['children']
            .map((child: unknown) => buildTree(child, depth + 1))
            .filter(Boolean);
        }

        return treeNode;
      };

      return ResponseFormatter.formatSuccess({
        fileKey,
        action: 'tree',
        tree: buildTree(document, 0)
      }, `Document tree (depth: ${depth_limit})`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Get tree failed: ${err.message}`, error);
    }
  }

  private async compare(params: InspectParams): Promise<MCPResponse> {
    const { fileKey, branchKey, versionId } = params;
    
    if (!branchKey && !versionId) {
      return ResponseFormatter.formatError('branchKey or versionId required for compare action');
    }

    const filesClient = this.clientFactory.createFilesClient();

    try {
      // Get current file
      const currentResp = await filesClient.getFile({ fileKey, depth: 1 });
      const currentData = currentResp['content']?.[0]?.['text'] ? JSON.parse(currentResp['content'][0]['text']) : {};

      // Get comparison target
      let compareData: Record<string, Record<string, unknown>> = { data: {} };
      if (branchKey) {
        const branchResp = await filesClient.getFile({ fileKey: branchKey, depth: 1 });
        compareData = branchResp['content']?.[0]?.['text'] ? JSON.parse(branchResp['content'][0]['text']) : { data: {} };
      } else if (versionId) {
        const versionResp = await filesClient.getFile({ fileKey, version: versionId, depth: 1 });
        compareData = versionResp['content']?.[0]?.['text'] ? JSON.parse(versionResp['content'][0]['text']) : { data: {} };
      }

      const compareDataObj = compareData['data'] || {};

      return ResponseFormatter.formatSuccess({
        fileKey,
        action: 'compare',
        comparison: {
          from: branchKey || versionId || 'unknown',
          to: fileKey,
          current: {
            name: currentData['data']?.['name'],
            version: currentData['data']?.['version'],
            lastModified: currentData['data']?.['lastModified']
          },
          compare: {
            name: compareDataObj['name'],
            version: compareDataObj['version'],
            lastModified: compareDataObj['lastModified']
          }
        }
      }, `Compared ${fileKey} with ${branchKey || versionId}`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Compare failed: ${err.message}`, error);
    }
  }
}
