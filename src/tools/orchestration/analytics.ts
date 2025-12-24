/**
 * Analytics Tool - Library usage, adoption, and health audits
 * 
 * Actions:
 * - library: Get library overview (components, styles, variables)
 * - usage: Get component/style usage across files
 * - audit: Run health check on design system
 * - actions: Get library action analytics (insertions, detachments)
 */

import { ClientFactory } from '../../api/client-factory.js';
import { ResponseFormatter } from '../../api/base/response-formatter.js';
import { MCPResponse } from '../../api/base/index.js';
import { AnalyticsParams, AnalyticsResult } from './types.js';

export class AnalyticsTool {
  constructor(private clientFactory: ClientFactory) {}

  async execute(params: AnalyticsParams): Promise<MCPResponse> {
    const { action } = params;

    switch (action) {
      case 'library':
        return this.getLibraryOverview(params);
      case 'usage':
        return this.getUsageAnalytics(params);
      case 'audit':
        return this.runAudit(params);
      case 'actions':
        return this.getActionAnalytics(params);
      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}. Use: library, usage, audit, actions`);
    }
  }

  private async getLibraryOverview(params: AnalyticsParams): Promise<MCPResponse> {
    const { fileKey, teamId, type = 'all' } = params;

    if (!fileKey && !teamId) {
      return ResponseFormatter.formatError('fileKey or teamId required for library action');
    }

    const componentsClient = this.clientFactory.createComponentsClient();
    
    const variablesClient = this.clientFactory.createVariablesClient();

    try {
      const result: AnalyticsResult = {
        action: 'library',
        fileKey,
        teamId,
        library: {}
      };

      // Get components
      if (type === 'all' || type === 'components') {
        if (fileKey) {
          const compResp = await componentsClient.getFileComponents({ fileKey });
          const compData = compResp['content']?.[0]?.['text'] ? JSON.parse(compResp['content'][0]['text']) : {};
          const components = compData['data']?.['meta']?.['components'] || [];
          result.library!.components = {
            count: components.length,
            items: components.slice(0, 100)
          };
        } else if (teamId) {
          const compResp = await componentsClient.getTeamComponents({ teamId });
          const compData = compResp['content']?.[0]?.['text'] ? JSON.parse(compResp['content'][0]['text']) : {};
          const components = compData['data']?.['meta']?.['components'] || [];
          result.library!.components = {
            count: components.length,
            items: components.slice(0, 100)
          };
        }
      }

      // Get styles
      if (type === 'all' || type === 'styles') {
        if (fileKey) {
          const styleResp = await componentsClient.getFileStyles({ fileKey });
          const styleData = styleResp['content']?.[0]?.['text'] ? JSON.parse(styleResp['content'][0]['text']) : {};
          const styles = styleData['data']?.['meta']?.['styles'] || [];
          result.library!.styles = {
            count: styles.length,
            items: styles.slice(0, 100)
          };
        } else if (teamId) {
          const styleResp = await componentsClient.getTeamStyles({ teamId });
          const styleData = styleResp['content']?.[0]?.['text'] ? JSON.parse(styleResp['content'][0]['text']) : {};
          const styles = styleData['data']?.['meta']?.['styles'] || [];
          result.library!.styles = {
            count: styles.length,
            items: styles.slice(0, 100)
          };
        }
      }

      // Get variables (file-level only)
      if ((type === 'all' || type === 'variables') && fileKey) {
        const varResp = await variablesClient.getLocalVariables({ fileKey });
        const varData = varResp['content']?.[0]?.['text'] ? JSON.parse(varResp['content'][0]['text']) : {};
        const variables = Object.values(varData['data']?.['meta']?.['variables'] || {});
        result.library!.variables = {
          count: variables.length,
          items: variables.slice(0, 100)
        };
      }

      const totalAssets = 
        (result.library?.components?.count || 0) +
        (result.library?.styles?.count || 0) +
        (result.library?.variables?.count || 0);

      return ResponseFormatter.formatSuccess(result, `Library overview: ${totalAssets} total assets`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Library overview failed: ${err.message}`, error);
    }
  }

  private async getUsageAnalytics(params: AnalyticsParams): Promise<MCPResponse> {
    const { fileKey, componentKey, styleKey } = params;

    if (!fileKey) {
      return ResponseFormatter.formatError('fileKey required for usage action');
    }

    const analyticsClient = this.clientFactory.createAnalyticsClient();

    try {
      let usages: unknown[] = [];
      let targetKey = '';

      if (componentKey) {
        const resp = await analyticsClient.getComponentUsages({ fileKey });
        const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
        // Filter by componentKey if needed
        const allUsages = data['data']?.['usages'] || [];
        usages = allUsages.filter((u: Record<string, unknown>) => u['component_key'] === componentKey || !componentKey);
        targetKey = componentKey;
      } else if (styleKey) {
        const resp = await analyticsClient.getStyleUsages({ fileKey });
        const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
        // Filter by styleKey if needed
        const allUsages = data['data']?.['usages'] || [];
        usages = allUsages.filter((u: Record<string, unknown>) => u['style_key'] === styleKey || !styleKey);
        targetKey = styleKey;
      } else {
        return ResponseFormatter.formatError('componentKey or styleKey required for usage action');
      }

      const result: AnalyticsResult = {
        action: 'usage',
        fileKey,
        usage: {
          fileKey: targetKey,
          usages,
          totalUsages: usages.length
        }
      };

      return ResponseFormatter.formatSuccess(result, `${usages.length} usages found`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Usage analytics failed: ${err.message}`, error);
    }
  }

  private async runAudit(params: AnalyticsParams): Promise<MCPResponse> {
    const { fileKey, teamId, type = 'all' } = params;

    if (!fileKey && !teamId) {
      return ResponseFormatter.formatError('fileKey or teamId required for audit action');
    }

    const componentsClient = this.clientFactory.createComponentsClient();
    
    const variablesClient = this.clientFactory.createVariablesClient();

    try {
      const issues: unknown[] = [];
      const recommendations: string[] = [];
      let healthScore = 100;

      // Audit components
      if (type === 'all' || type === 'components') {
        if (fileKey) {
          const compResp = await componentsClient.getFileComponents({ fileKey });
          const compData = compResp['content']?.[0]?.['text'] ? JSON.parse(compResp['content'][0]['text']) : {};
          const components = compData['data']?.['meta']?.['components'] || [];

          // Check for naming conventions
          const namingIssues = components.filter((c: Record<string, unknown>) => {
            const name = c['name'] as string || '';
            // Check for inconsistent naming (e.g., spaces, special chars)
            return name.includes('  ') || /[^\w\s\-\/]/.test(name);
          });

          if (namingIssues.length > 0) {
            issues.push({
              type: 'naming',
              severity: 'warning',
              count: namingIssues.length,
              message: `${namingIssues.length} components have inconsistent naming`
            });
            healthScore -= namingIssues.length * 2;
            recommendations.push('Standardize component naming conventions');
          }

          // Check for components without descriptions
          const noDescComponents = components.filter((c: Record<string, unknown>) => !c['description']);
          if (noDescComponents.length > components.length * 0.5) {
            issues.push({
              type: 'documentation',
              severity: 'info',
              count: noDescComponents.length,
              message: `${noDescComponents.length} components lack descriptions`
            });
            healthScore -= 5;
            recommendations.push('Add descriptions to components for better discoverability');
          }
        }
      }

      // Audit styles
      if (type === 'all' || type === 'styles') {
        if (fileKey) {
          const styleResp = await componentsClient.getFileStyles({ fileKey });
          const styleData = styleResp['content']?.[0]?.['text'] ? JSON.parse(styleResp['content'][0]['text']) : {};
          const styles = styleData['data']?.['meta']?.['styles'] || [];

          // Group styles by type
          const stylesByType: Record<string, number> = {};
          for (const s of styles) {
            const style = s as Record<string, unknown>;
            const styleType = style['style_type'] as string || 'unknown';
            stylesByType[styleType] = (stylesByType[styleType] || 0) + 1;
          }

          // Check for missing style types
          if (!stylesByType['FILL']) {
            issues.push({
              type: 'completeness',
              severity: 'warning',
              message: 'No fill/color styles defined'
            });
            healthScore -= 10;
            recommendations.push('Create color styles for consistent branding');
          }

          if (!stylesByType['TEXT']) {
            issues.push({
              type: 'completeness',
              severity: 'warning',
              message: 'No text styles defined'
            });
            healthScore -= 10;
            recommendations.push('Create text styles for typography consistency');
          }
        }
      }

      // Audit variables
      if ((type === 'all' || type === 'variables') && fileKey) {
        const varResp = await variablesClient.getLocalVariables({ fileKey });
        const varData = varResp['content']?.[0]?.['text'] ? JSON.parse(varResp['content'][0]['text']) : {};
        const collections = Object.values(varData['data']?.['meta']?.['variableCollections'] || {});
        const variables = Object.values(varData['data']?.['meta']?.['variables'] || {});

        if (collections.length === 0) {
          issues.push({
            type: 'variables',
            severity: 'info',
            message: 'No variable collections defined'
          });
          recommendations.push('Consider using variables for design tokens');
        } else {
          // Check for single-mode collections (might need more modes)
          const singleModeCollections = collections.filter((c: unknown) => {
            const col = c as Record<string, unknown>;
            const modes = col['modes'] as unknown[];
            return modes?.length === 1;
          });

          if (singleModeCollections.length > 0 && collections.length > 0) {
            recommendations.push('Consider adding modes (light/dark) to variable collections');
          }
        }
      }

      // Ensure health score is within bounds
      healthScore = Math.max(0, Math.min(100, healthScore));

      const result: AnalyticsResult = {
        action: 'audit',
        fileKey,
        teamId,
        audit: {
          healthScore,
          issues,
          recommendations
        }
      };

      return ResponseFormatter.formatSuccess(result, `Audit complete: Health score ${healthScore}/100`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Audit failed: ${err.message}`, error);
    }
  }

  private async getActionAnalytics(params: AnalyticsParams): Promise<MCPResponse> {
    const { fileKey, cursor } = params;

    if (!fileKey) {
      return ResponseFormatter.formatError('fileKey required for actions action');
    }

    const analyticsClient = this.clientFactory.createAnalyticsClient();

    try {
      const resp = await analyticsClient.getComponentActions({ fileKey, cursor });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      const actions = data['data']?.['actions'] || [];
      const nextCursor = data['data']?.['cursor'];

      const result: AnalyticsResult = {
        action: 'actions',
        fileKey,
        actions: {
          items: actions,
          cursor: nextCursor
        }
      };

      return ResponseFormatter.formatSuccess(result, `${actions.length} library actions`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Action analytics failed: ${err.message}`, error);
    }
  }
}
