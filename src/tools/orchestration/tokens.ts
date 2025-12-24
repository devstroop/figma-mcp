/**
 * Tokens Tool - Design token management and sync
 * 
 * Actions:
 * - list: List all variables in a file
 * - collections: Get variable collections
 * - modes: Get modes for collections
 * - export: Export variables in code format (CSS, SCSS, JSON, Tailwind)
 * - diff: Compare variables between files
 */

import { ClientFactory } from '../../api/client-factory.js';
import { ResponseFormatter } from '../../api/base/response-formatter.js';
import { MCPResponse } from '../../api/base/index.js';
import { TokensParams, TokensResult } from './types.js';

export class TokensTool {
  constructor(private clientFactory: ClientFactory) {}

  async execute(params: TokensParams): Promise<MCPResponse> {
    const { action, fileKey } = params;

    switch (action) {
      case 'list':
        return this.listTokens(params);
      case 'collections':
        return this.getCollections(params);
      case 'modes':
        return this.getModes(params);
      case 'export':
        return this.exportTokens(params);
      case 'diff':
        return this.diffTokens(params);
      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}. Use: list, collections, modes, export, diff`);
    }
  }

  private async listTokens(params: TokensParams): Promise<MCPResponse> {
    const { fileKey, collectionIds } = params;
    const variablesClient = this.clientFactory.createVariablesClient();

    try {
      const resp = await variablesClient.getLocalVariables({ fileKey });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      
      const collections = data['data']?.['meta']?.['variableCollections'] || {};
      const variables = data['data']?.['meta']?.['variables'] || {};

      // Filter by collection if specified
      let filteredVars = Object.values(variables);
      if (collectionIds && collectionIds.length > 0) {
        filteredVars = filteredVars.filter((v: unknown) => {
          const variable = v as Record<string, unknown>;
          return collectionIds.includes(variable['variableCollectionId'] as string);
        });
      }

      // Group by collection
      const byCollection: Record<string, unknown[]> = {};
      for (const v of filteredVars) {
        const variable = v as Record<string, unknown>;
        const colId = variable['variableCollectionId'] as string;
        if (!byCollection[colId]) {
          byCollection[colId] = [];
        }
        byCollection[colId].push({
          id: variable['id'],
          name: variable['name'],
          resolvedType: variable['resolvedType'],
          valuesByMode: variable['valuesByMode']
        });
      }

      const result: TokensResult = {
        fileKey,
        action: 'list',
        collections: Object.entries(byCollection).map(([colId, vars]) => {
          const col = collections[colId] as Record<string, unknown> | undefined;
          return {
            id: colId,
            name: col?.['name'] || 'Unknown',
            variables: vars
          };
        }),
        variables: {
          count: filteredVars.length,
          items: filteredVars
        }
      };

      return ResponseFormatter.formatSuccess(result, `${filteredVars.length} variables in ${Object.keys(byCollection).length} collections`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`List tokens failed: ${err.message}`, error);
    }
  }

  private async getCollections(params: TokensParams): Promise<MCPResponse> {
    const { fileKey } = params;
    const variablesClient = this.clientFactory.createVariablesClient();

    try {
      const resp = await variablesClient.getLocalVariables({ fileKey });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      
      const collections = data['data']?.['meta']?.['variableCollections'] || {};
      const variables = data['data']?.['meta']?.['variables'] || {};

      // Count variables per collection
      const varCountByCol: Record<string, number> = {};
      for (const v of Object.values(variables)) {
        const variable = v as Record<string, unknown>;
        const colId = variable['variableCollectionId'] as string;
        varCountByCol[colId] = (varCountByCol[colId] || 0) + 1;
      }

      const collectionsList = Object.entries(collections).map(([id, col]) => {
        const c = col as Record<string, unknown>;
        return {
          id,
          name: c['name'],
          modes: c['modes'],
          defaultModeId: c['defaultModeId'],
          variableCount: varCountByCol[id] || 0
        };
      });

      return ResponseFormatter.formatSuccess({
        fileKey,
        action: 'collections',
        collections: collectionsList
      }, `${collectionsList.length} variable collections`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Get collections failed: ${err.message}`, error);
    }
  }

  private async getModes(params: TokensParams): Promise<MCPResponse> {
    const { fileKey, collectionIds } = params;
    const variablesClient = this.clientFactory.createVariablesClient();

    try {
      const resp = await variablesClient.getLocalVariables({ fileKey });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      
      const collections = data['data']?.['meta']?.['variableCollections'] || {};

      // Filter collections if specified
      let targetCollections = Object.entries(collections);
      if (collectionIds && collectionIds.length > 0) {
        targetCollections = targetCollections.filter(([id]) => collectionIds.includes(id));
      }

      const modesByCollection = targetCollections.map(([id, col]) => {
        const c = col as Record<string, unknown>;
        return {
          collectionId: id,
          collectionName: c['name'],
          defaultModeId: c['defaultModeId'],
          modes: c['modes']
        };
      });

      return ResponseFormatter.formatSuccess({
        fileKey,
        action: 'modes',
        modes: modesByCollection
      }, `Modes for ${modesByCollection.length} collections`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Get modes failed: ${err.message}`, error);
    }
  }

  private async exportTokens(params: TokensParams): Promise<MCPResponse> {
    const { fileKey, format = 'json', collectionIds, modeIds } = params;
    const variablesClient = this.clientFactory.createVariablesClient();

    try {
      const resp = await variablesClient.getLocalVariables({ fileKey });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      
      const collections = data['data']?.['meta']?.['variableCollections'] || {};
      const variables = data['data']?.['meta']?.['variables'] || {};

      // Filter variables
      let filteredVars = Object.values(variables);
      if (collectionIds && collectionIds.length > 0) {
        filteredVars = filteredVars.filter((v: unknown) => {
          const variable = v as Record<string, unknown>;
          return collectionIds.includes(variable['variableCollectionId'] as string);
        });
      }

      // Generate output based on format
      let content: string;
      let filename: string;

      switch (format) {
        case 'css':
          content = this.generateCSS(filteredVars, collections, modeIds);
          filename = 'tokens.css';
          break;
        case 'scss':
          content = this.generateSCSS(filteredVars, collections, modeIds);
          filename = '_tokens.scss';
          break;
        case 'tailwind':
          content = this.generateTailwind(filteredVars, collections, modeIds);
          filename = 'tailwind.tokens.js';
          break;
        case 'json':
        default:
          content = this.generateJSON(filteredVars, collections, modeIds);
          filename = 'tokens.json';
      }

      const result: TokensResult = {
        fileKey,
        action: 'export',
        variables: {
          count: filteredVars.length,
          items: []
        },
        exported: {
          format,
          content,
          filename
        }
      };

      return ResponseFormatter.formatSuccess(result, `Exported ${filteredVars.length} tokens as ${format}`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Export tokens failed: ${err.message}`, error);
    }
  }

  private async diffTokens(params: TokensParams): Promise<MCPResponse> {
    const { fileKey, compareFileKey } = params;

    if (!compareFileKey) {
      return ResponseFormatter.formatError('compareFileKey required for diff action');
    }

    const variablesClient = this.clientFactory.createVariablesClient();

    try {
      // Get variables from both files
      const [resp1, resp2] = await Promise.all([
        variablesClient.getLocalVariables({ fileKey }),
        variablesClient.getLocalVariables({ fileKey: compareFileKey })
      ]);

      const data1 = resp1['content']?.[0]?.['text'] ? JSON.parse(resp1['content'][0]['text']) : {};
      const data2 = resp2['content']?.[0]?.['text'] ? JSON.parse(resp2['content'][0]['text']) : {};

      const vars1 = data1['data']?.['meta']?.['variables'] || {};
      const vars2 = data2['data']?.['meta']?.['variables'] || {};

      // Build name maps for comparison
      const names1 = new Map<string, unknown>();
      const names2 = new Map<string, unknown>();

      for (const v of Object.values(vars1)) {
        const variable = v as Record<string, unknown>;
        names1.set(variable['name'] as string, variable);
      }

      for (const v of Object.values(vars2)) {
        const variable = v as Record<string, unknown>;
        names2.set(variable['name'] as string, variable);
      }

      // Find differences
      const added: unknown[] = [];
      const removed: unknown[] = [];
      const modified: unknown[] = [];

      for (const [name, v1] of names1) {
        if (!names2.has(name)) {
          added.push({ name, variable: v1 });
        } else {
          const v2 = names2.get(name);
          const var1 = v1 as Record<string, unknown>;
          const var2 = v2 as Record<string, unknown>;
          
          // Simple comparison - check if values differ
          if (JSON.stringify(var1['valuesByMode']) !== JSON.stringify(var2['valuesByMode'])) {
            modified.push({
              name,
              current: var1['valuesByMode'],
              compare: var2['valuesByMode']
            });
          }
        }
      }

      for (const [name, v2] of names2) {
        if (!names1.has(name)) {
          removed.push({ name, variable: v2 });
        }
      }

      const result: TokensResult = {
        fileKey,
        action: 'diff',
        variables: {
          count: names1.size,
          items: []
        },
        diff: {
          added,
          removed,
          modified
        }
      };

      return ResponseFormatter.formatSuccess(
        result,
        `Diff: +${added.length} added, -${removed.length} removed, ~${modified.length} modified`
      );
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Diff tokens failed: ${err.message}`, error);
    }
  }

  // Helper: Generate CSS variables
  private generateCSS(variables: unknown[], collections: Record<string, unknown>, modeIds?: string[]): string {
    const lines: string[] = [':root {'];

    for (const v of variables) {
      const variable = v as Record<string, unknown>;
      const name = this.toKebabCase(variable['name'] as string);
      const valuesByMode = variable['valuesByMode'] as Record<string, unknown> | undefined;
      
      if (!valuesByMode) continue;
      
      // Use first mode or specified mode
      const availableModes = Object.keys(valuesByMode);
      const modeId = modeIds?.[0] || availableModes[0];
      if (!modeId) continue;
      
      const value = valuesByMode[modeId];
      
      lines.push(`  --${name}: ${this.formatValue(value, variable['resolvedType'] as string)};`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  // Helper: Generate SCSS variables
  private generateSCSS(variables: unknown[], collections: Record<string, unknown>, modeIds?: string[]): string {
    const lines: string[] = [];

    for (const v of variables) {
      const variable = v as Record<string, unknown>;
      const name = this.toKebabCase(variable['name'] as string);
      const valuesByMode = variable['valuesByMode'] as Record<string, unknown> | undefined;
      
      if (!valuesByMode) continue;
      
      const availableModes = Object.keys(valuesByMode);
      const modeId = modeIds?.[0] || availableModes[0];
      if (!modeId) continue;
      
      const value = valuesByMode[modeId];
      
      lines.push(`$${name}: ${this.formatValue(value, variable['resolvedType'] as string)};`);
    }

    return lines.join('\n');
  }

  // Helper: Generate Tailwind config
  private generateTailwind(variables: unknown[], collections: Record<string, unknown>, modeIds?: string[]): string {
    const colors: Record<string, string> = {};
    const spacing: Record<string, string> = {};

    for (const v of variables) {
      const variable = v as Record<string, unknown>;
      const name = this.toKebabCase(variable['name'] as string);
      const valuesByMode = variable['valuesByMode'] as Record<string, unknown> | undefined;
      const type = variable['resolvedType'] as string;
      
      if (!valuesByMode) continue;
      
      const availableModes = Object.keys(valuesByMode);
      const modeId = modeIds?.[0] || availableModes[0];
      if (!modeId) continue;
      
      const value = valuesByMode[modeId];

      if (type === 'COLOR') {
        colors[name] = this.formatValue(value, type);
      } else if (type === 'FLOAT') {
        spacing[name] = this.formatValue(value, type);
      }
    }

    return `module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 6).replace(/"([^"]+)":/g, '$1:')},
      spacing: ${JSON.stringify(spacing, null, 6).replace(/"([^"]+)":/g, '$1:')}
    }
  }
};`;
  }

  // Helper: Generate JSON format
  private generateJSON(variables: unknown[], collections: Record<string, unknown>, modeIds?: string[]): string {
    const tokens: Record<string, unknown> = {};

    for (const v of variables) {
      const variable = v as Record<string, unknown>;
      const name = variable['name'] as string;
      const valuesByMode = variable['valuesByMode'] as Record<string, unknown> | undefined;
      
      if (!valuesByMode) continue;
      
      const availableModes = Object.keys(valuesByMode);
      const modeId = modeIds?.[0] || availableModes[0];
      if (!modeId) continue;
      
      const value = valuesByMode[modeId];

      tokens[name] = {
        value: this.formatValue(value, variable['resolvedType'] as string),
        type: variable['resolvedType']
      };
    }

    return JSON.stringify(tokens, null, 2);
  }

  // Helper: Convert name to kebab-case
  private toKebabCase(str: string): string {
    return str
      .replace(/\//g, '-')
      .replace(/\s+/g, '-')
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }

  // Helper: Format value based on type
  private formatValue(value: unknown, type: string): string {
    if (value === null || value === undefined) return 'unset';

    if (type === 'COLOR' && typeof value === 'object') {
      const c = value as Record<string, number>;
      const r = Math.round((c['r'] || 0) * 255);
      const g = Math.round((c['g'] || 0) * 255);
      const b = Math.round((c['b'] || 0) * 255);
      const a = c['a'] !== undefined ? c['a'] : 1;
      
      if (a < 1) {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      }
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    if (type === 'FLOAT' && typeof value === 'number') {
      return `${value}px`;
    }

    return String(value);
  }
}
