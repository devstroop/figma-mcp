/**
 * Assets Tool - Export and organize design assets
 * 
 * Actions:
 * - export: Export specific nodes in a format
 * - batch: Batch export multiple nodes in multiple formats/scales
 * - list: List exportable nodes in a file
 * - fill_images: Get image URLs used as fills
 */

import { ClientFactory } from '../../api/client-factory.js';
import { ResponseFormatter } from '../../api/base/response-formatter.js';
import { MCPResponse } from '../../api/base/index.js';
import { AssetsParams, AssetsResult } from './types.js';

export class AssetsTool {
  constructor(private clientFactory: ClientFactory) {}

  async execute(params: AssetsParams): Promise<MCPResponse> {
    const { action, fileKey } = params;

    switch (action) {
      case 'export':
        return this.exportAssets(params);
      case 'batch':
        return this.batchExport(params);
      case 'list':
        return this.listExportable(params);
      case 'fill_images':
        return this.getFillImages(params);
      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}. Use: export, batch, list, fill_images`);
    }
  }

  private async exportAssets(params: AssetsParams): Promise<MCPResponse> {
    const { fileKey, nodeIds, format = 'png', scale = 1, contentsOnly, useAbsoluteBounds } = params;

    if (!nodeIds || nodeIds.length === 0) {
      return ResponseFormatter.formatError('nodeIds required for export action');
    }

    const filesClient = this.clientFactory.createFilesClient();

    try {
      const resp = await filesClient.getImages({
        fileKey,
        ids: nodeIds,
        format,
        scale,
        contentsOnly,
        useAbsoluteBounds
      });
      
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      const images = data['data']?.['images'] || {};

      const exports = Object.entries(images).map(([nodeId, url]) => ({
        nodeId,
        images: [{
          format,
          scale,
          url: url as string
        }]
      }));

      const result: AssetsResult = {
        fileKey,
        action: 'export',
        exports,
        totalImages: exports.length
      };

      return ResponseFormatter.formatSuccess(result, `Exported ${exports.length} assets as ${format}@${scale}x`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Export failed: ${err.message}`, error);
    }
  }

  private async batchExport(params: AssetsParams): Promise<MCPResponse> {
    const { 
      fileKey, 
      nodeIds, 
      formats = ['png'], 
      scales = [1], 
      contentsOnly, 
      useAbsoluteBounds 
    } = params;

    if (!nodeIds || nodeIds.length === 0) {
      return ResponseFormatter.formatError('nodeIds required for batch action');
    }

    const filesClient = this.clientFactory.createFilesClient();

    try {
      // Collect all exports
      const allExports = new Map<string, { format: string; scale: number; url: string }[]>();

      // Initialize map with nodeIds
      for (const nodeId of nodeIds) {
        allExports.set(nodeId, []);
      }

      // Export each format/scale combination
      for (const format of formats) {
        for (const scale of scales) {
          const resp = await filesClient.getImages({
            fileKey,
            ids: nodeIds,
            format,
            scale,
            contentsOnly,
            useAbsoluteBounds
          });
          
          const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
          const images = data['data']?.['images'] || {};

          for (const [nodeId, url] of Object.entries(images)) {
            if (url && allExports.has(nodeId)) {
              allExports.get(nodeId)!.push({
                format,
                scale,
                url: url as string
              });
            }
          }
        }
      }

      // Build result
      const exports = Array.from(allExports.entries()).map(([nodeId, images]) => ({
        nodeId,
        images
      }));

      const totalImages = exports.reduce((sum, e) => sum + e.images.length, 0);

      const result: AssetsResult = {
        fileKey,
        action: 'batch',
        exports,
        totalImages
      };

      return ResponseFormatter.formatSuccess(
        result, 
        `Batch exported ${totalImages} images (${nodeIds.length} nodes × ${formats.length} formats × ${scales.length} scales)`
      );
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Batch export failed: ${err.message}`, error);
    }
  }

  private async listExportable(params: AssetsParams): Promise<MCPResponse> {
    const { fileKey } = params;
    const filesClient = this.clientFactory.createFilesClient();

    try {
      // Get file with enough depth to find exportable nodes
      const resp = await filesClient.getFile({ fileKey, depth: 2 });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      const document = data['data']?.['document'];

      // Find nodes with export settings
      const exportableNodes: { id: string; name: string; type: string; exportSettings?: unknown[] }[] = [];

      const findExportable = (node: unknown): void => {
        if (!node || typeof node !== 'object') return;
        const n = node as Record<string, unknown>;

        // Check for export settings or component/frame types
        if (n['exportSettings'] || n['type'] === 'COMPONENT' || n['type'] === 'FRAME' || n['type'] === 'COMPONENT_SET') {
          exportableNodes.push({
            id: n['id'] as string,
            name: n['name'] as string,
            type: n['type'] as string,
            exportSettings: n['exportSettings'] as unknown[] | undefined
          });
        }

        // Recurse into children
        if (Array.isArray(n['children'])) {
          for (const child of n['children']) {
            findExportable(child);
          }
        }
      };

      findExportable(document);

      return ResponseFormatter.formatSuccess({
        fileKey,
        action: 'list',
        exportableNodes,
        summary: {
          total: exportableNodes.length,
          withSettings: exportableNodes.filter(n => n.exportSettings).length
        }
      }, `Found ${exportableNodes.length} exportable nodes`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`List exportable failed: ${err.message}`, error);
    }
  }

  private async getFillImages(params: AssetsParams): Promise<MCPResponse> {
    const { fileKey } = params;
    const filesClient = this.clientFactory.createFilesClient();

    try {
      const resp = await filesClient.getImageFills({ fileKey });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      const images = data['data']?.['meta']?.['images'] || {};

      const fillImages = Object.entries(images).map(([imageRef, url]) => ({
        imageRef,
        url
      }));

      const result: AssetsResult = {
        fileKey,
        action: 'fill_images',
        fillImages,
        totalImages: fillImages.length
      };

      return ResponseFormatter.formatSuccess(result, `Found ${fillImages.length} fill images`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Get fill images failed: ${err.message}`, error);
    }
  }
}
