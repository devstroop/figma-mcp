import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

import { ConfigManager } from './config.js';
import { logger } from './logger.js';
import { ClientFactory } from './api/client-factory.js';
import { createToolDefinitions, ToolDefinition } from './tools/index.js';
import { ResponseFormatter, MCPResponse } from './api/base/index.js';
import {
  InspectTool,
  FeedbackTool,
  AssetsTool,
  TokensTool,
  NavigateTool,
  AnalyticsTool,
  CodeConnectTool,
  WebhooksTool,
} from './tools/orchestration/index.js';

// Type adapter to convert MCPResponse to CallToolResult
function toCallToolResult(response: MCPResponse): CallToolResult {
  return {
    content: response.content,
    isError: response.isError,
  };
}

export class FigmaMCPServer {
  private server: Server;
  private clientFactory: ClientFactory;
  private config: ConfigManager;
  private transport: Transport | null = null;
  private toolDefinitions: ToolDefinition[];

  constructor() {
    this.config = new ConfigManager();
    this.config.validate();

    const figmaConfig = this.config.get();

    logger.info('Initializing Figma MCP Server', {
      baseUrl: figmaConfig.baseUrl,
      hasTeamId: this.config.hasTeamId(),
      hasFileKey: this.config.hasFileKey(),
    });

    // Initialize client factory
    this.clientFactory = new ClientFactory({
      baseURL: figmaConfig.baseUrl,
      token: figmaConfig.figmaToken,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    });

    // Generate tool definitions
    this.toolDefinitions = createToolDefinitions();

    // Initialize MCP server
    this.server = new Server(
      {
        name: 'figma-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    logger.info('Figma MCP Server initialized', { toolCount: this.toolDefinitions.length });
  }

  private setupToolHandlers(): void {
    // Register tool list handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.toolDefinitions,
    }));

    // Register tool call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
      const { name, arguments: args = {} } = request.params;

      try {
        const response = await this.handleToolCall(name, args as Record<string, unknown>);
        return toCallToolResult(response);
      } catch (error) {
        logger.error('Tool execution error', { tool: name, error: error instanceof Error ? error.message : error });

        if (error instanceof McpError) {
          throw error;
        }

        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async handleToolCall(name: string, args: Record<string, unknown>): Promise<MCPResponse> {
    logger.debug('Handling tool call', { tool: name, args });

    // Files operations
    if (name === 'figma_get_file') {
      const client = this.clientFactory.createFilesClient();
      return client.getFile({
        fileKey: args['fileKey'] as string,
        version: args['version'] as string | undefined,
        ids: args['ids'] as string[] | undefined,
        depth: args['depth'] as number | undefined,
        geometry: args['geometry'] as 'paths' | undefined,
        pluginData: args['pluginData'] as string | undefined,
      });
    }

    if (name === 'figma_get_file_nodes') {
      const client = this.clientFactory.createFilesClient();
      return client.getFileNodes({
        fileKey: args['fileKey'] as string,
        ids: args['ids'] as string[],
        version: args['version'] as string | undefined,
        depth: args['depth'] as number | undefined,
        geometry: args['geometry'] as 'paths' | undefined,
      });
    }

    if (name === 'figma_get_images') {
      const client = this.clientFactory.createFilesClient();
      return client.getImages({
        fileKey: args['fileKey'] as string,
        ids: args['ids'] as string[],
        scale: args['scale'] as number | undefined,
        format: args['format'] as 'jpg' | 'png' | 'svg' | 'pdf' | undefined,
        svgIncludeId: args['svgIncludeId'] as boolean | undefined,
        svgSimplifyStroke: args['svgSimplifyStroke'] as boolean | undefined,
        contentsOnly: args['contentsOnly'] as boolean | undefined,
        useAbsoluteBounds: args['useAbsoluteBounds'] as boolean | undefined,
      });
    }

    if (name === 'figma_get_image_fills') {
      const client = this.clientFactory.createFilesClient();
      return client.getImageFills({ fileKey: args['fileKey'] as string });
    }

    if (name === 'figma_get_file_versions') {
      const client = this.clientFactory.createFilesClient();
      return client.getFileVersions({ fileKey: args['fileKey'] as string });
    }

    if (name === 'figma_get_file_meta') {
      const client = this.clientFactory.createFilesClient();
      return client.getFileMeta(args['fileKey'] as string);
    }

    // Comments operations
    if (name === 'figma_get_comments') {
      const client = this.clientFactory.createCommentsClient();
      return client.getComments({
        fileKey: args['fileKey'] as string,
        asMarkdown: args['asMarkdown'] as boolean | undefined,
      });
    }

    if (name === 'figma_post_comment') {
      const client = this.clientFactory.createCommentsClient();
      return client.postComment({
        fileKey: args['fileKey'] as string,
        message: args['message'] as string,
        commentId: args['commentId'] as string | undefined,
        clientMeta: args['nodeId'] ? {
          nodeId: args['nodeId'] as string,
          nodeOffset: args['x'] !== undefined ? { x: args['x'] as number, y: args['y'] as number } : undefined,
        } : undefined,
      });
    }

    if (name === 'figma_delete_comment') {
      const client = this.clientFactory.createCommentsClient();
      return client.deleteComment({
        fileKey: args['fileKey'] as string,
        commentId: args['commentId'] as string,
      });
    }

    // Comment Reactions operations
    if (name === 'figma_get_comment_reactions') {
      const client = this.clientFactory.createCommentsClient();
      return client.getCommentReactions({
        fileKey: args['fileKey'] as string,
        commentId: args['commentId'] as string,
        cursor: args['cursor'] as string | undefined,
      });
    }

    if (name === 'figma_post_comment_reaction') {
      const client = this.clientFactory.createCommentsClient();
      return client.postCommentReaction({
        fileKey: args['fileKey'] as string,
        commentId: args['commentId'] as string,
        emoji: args['emoji'] as string,
      });
    }

    if (name === 'figma_delete_comment_reaction') {
      const client = this.clientFactory.createCommentsClient();
      return client.deleteCommentReaction({
        fileKey: args['fileKey'] as string,
        commentId: args['commentId'] as string,
        emoji: args['emoji'] as string,
      });
    }

    // Components operations
    if (name === 'figma_get_team_components') {
      const client = this.clientFactory.createComponentsClient();
      return client.getTeamComponents({
        teamId: args['teamId'] as string,
        pageSize: args['pageSize'] as number | undefined,
        cursor: args['cursor'] as string | undefined,
      });
    }

    if (name === 'figma_get_file_components') {
      const client = this.clientFactory.createComponentsClient();
      return client.getFileComponents({ fileKey: args['fileKey'] as string });
    }

    if (name === 'figma_get_component') {
      const client = this.clientFactory.createComponentsClient();
      return client.getComponent({ key: args['key'] as string });
    }

    // Component Sets operations
    if (name === 'figma_get_team_component_sets') {
      const client = this.clientFactory.createComponentsClient();
      return client.getTeamComponentSets({
        teamId: args['teamId'] as string,
        pageSize: args['pageSize'] as number | undefined,
        cursor: args['cursor'] as string | undefined,
      });
    }

    if (name === 'figma_get_file_component_sets') {
      const client = this.clientFactory.createComponentsClient();
      return client.getFileComponentSets({ fileKey: args['fileKey'] as string });
    }

    if (name === 'figma_get_component_set') {
      const client = this.clientFactory.createComponentsClient();
      return client.getComponentSet({ key: args['key'] as string });
    }

    // Styles operations
    if (name === 'figma_get_team_styles') {
      const client = this.clientFactory.createComponentsClient();
      return client.getTeamStyles({
        teamId: args['teamId'] as string,
        pageSize: args['pageSize'] as number | undefined,
        cursor: args['cursor'] as string | undefined,
      });
    }

    if (name === 'figma_get_file_styles') {
      const client = this.clientFactory.createComponentsClient();
      return client.getFileStyles({ fileKey: args['fileKey'] as string });
    }

    if (name === 'figma_get_style') {
      const client = this.clientFactory.createComponentsClient();
      return client.getStyle({ key: args['key'] as string });
    }

    // Projects operations
    if (name === 'figma_get_team_projects') {
      const client = this.clientFactory.createProjectsClient();
      return client.getTeamProjects({ teamId: args['teamId'] as string });
    }

    if (name === 'figma_get_project_files') {
      const client = this.clientFactory.createProjectsClient();
      return client.getProjectFiles({
        projectId: args['projectId'] as string,
        branchData: args['branchData'] as boolean | undefined,
      });
    }

    // Variables operations (Enterprise)
    if (name === 'figma_get_local_variables') {
      const client = this.clientFactory.createVariablesClient();
      return client.getLocalVariables({ fileKey: args['fileKey'] as string });
    }

    if (name === 'figma_get_published_variables') {
      const client = this.clientFactory.createVariablesClient();
      return client.getPublishedVariables({ fileKey: args['fileKey'] as string });
    }

    if (name === 'figma_post_variables') {
      const client = this.clientFactory.createVariablesClient();
      return client.postVariables({
        fileKey: args['fileKey'] as string,
        variableCollections: args['variableCollections'] as any,
        variableModes: args['variableModes'] as any,
        variables: args['variables'] as any,
        variableModeValues: args['variableModeValues'] as any,
      });
    }

    // Webhooks operations
    if (name === 'figma_get_webhooks') {
      const client = this.clientFactory.createWebhooksClient();
      return client.getWebhooks({ teamId: args['teamId'] as string | undefined });
    }

    if (name === 'figma_create_webhook') {
      const client = this.clientFactory.createWebhooksClient();
      return client.createWebhook({
        eventType: args['eventType'] as any,
        teamId: args['teamId'] as string,
        endpoint: args['endpoint'] as string,
        passcode: args['passcode'] as string,
        status: args['status'] as 'ACTIVE' | 'PAUSED' | undefined,
        description: args['description'] as string | undefined,
      });
    }

    if (name === 'figma_delete_webhook') {
      const client = this.clientFactory.createWebhooksClient();
      return client.deleteWebhook({ webhookId: args['webhookId'] as string });
    }

    if (name === 'figma_get_webhook') {
      const client = this.clientFactory.createWebhooksClient();
      return client.getWebhook(args['webhookId'] as string);
    }

    if (name === 'figma_update_webhook') {
      const client = this.clientFactory.createWebhooksClient();
      return client.updateWebhook({
        webhookId: args['webhookId'] as string,
        eventType: args['eventType'] as any,
        endpoint: args['endpoint'] as string | undefined,
        passcode: args['passcode'] as string | undefined,
        status: args['status'] as 'ACTIVE' | 'PAUSED' | undefined,
        description: args['description'] as string | undefined,
      });
    }

    if (name === 'figma_get_webhook_requests') {
      const client = this.clientFactory.createWebhooksClient();
      return client.getWebhookRequests({ webhookId: args['webhookId'] as string });
    }

    // User operations
    if (name === 'figma_get_me') {
      const client = this.clientFactory.createUsersClient();
      return client.getMe();
    }

    // Dev Resources operations
    if (name === 'figma_get_dev_resources') {
      const client = this.clientFactory.createDevResourcesClient();
      return client.getDevResources({
        fileKey: args['fileKey'] as string,
        nodeIds: args['nodeIds'] as string[] | undefined,
      });
    }

    if (name === 'figma_create_dev_resource') {
      const client = this.clientFactory.createDevResourcesClient();
      return client.createDevResources([{
        fileKey: args['fileKey'] as string,
        nodeId: args['nodeId'] as string,
        name: args['name'] as string,
        url: args['url'] as string,
      }]);
    }

    if (name === 'figma_delete_dev_resource') {
      const client = this.clientFactory.createDevResourcesClient();
      return client.deleteDevResource({
        fileKey: args['fileKey'] as string,
        devResourceId: args['devResourceId'] as string,
      });
    }

    if (name === 'figma_update_dev_resource') {
      const client = this.clientFactory.createDevResourcesClient();
      return client.updateDevResources([{
        devResourceId: args['devResourceId'] as string,
        fileKey: args['fileKey'] as string,
        name: args['name'] as string | undefined,
        url: args['url'] as string | undefined,
      }]);
    }

    // Library Analytics operations
    if (name === 'figma_get_component_actions') {
      const client = this.clientFactory.createAnalyticsClient();
      return client.getComponentActions({
        fileKey: args['fileKey'] as string,
        cursor: args['cursor'] as string | undefined,
      });
    }

    if (name === 'figma_get_component_usages') {
      const client = this.clientFactory.createAnalyticsClient();
      return client.getComponentUsages({
        fileKey: args['fileKey'] as string,
        cursor: args['cursor'] as string | undefined,
      });
    }

    if (name === 'figma_get_style_actions') {
      const client = this.clientFactory.createAnalyticsClient();
      return client.getStyleActions({
        fileKey: args['fileKey'] as string,
        cursor: args['cursor'] as string | undefined,
      });
    }

    if (name === 'figma_get_style_usages') {
      const client = this.clientFactory.createAnalyticsClient();
      return client.getStyleUsages({
        fileKey: args['fileKey'] as string,
        cursor: args['cursor'] as string | undefined,
      });
    }

    if (name === 'figma_get_variable_actions') {
      const client = this.clientFactory.createAnalyticsClient();
      return client.getVariableActions({
        fileKey: args['fileKey'] as string,
        cursor: args['cursor'] as string | undefined,
      });
    }

    if (name === 'figma_get_variable_usages') {
      const client = this.clientFactory.createAnalyticsClient();
      return client.getVariableUsages({
        fileKey: args['fileKey'] as string,
        cursor: args['cursor'] as string | undefined,
      });
    }

    // ==================== Orchestration Tools ====================

    if (name === 'figma_inspect') {
      const tool = new InspectTool(this.clientFactory);
      return tool.execute({
        action: args['action'] as 'snapshot' | 'nodes' | 'properties' | 'tree' | 'compare',
        fileKey: args['fileKey'] as string,
        depth: args['depth'] as 'shallow' | 'full' | undefined,
        includeComponents: args['includeComponents'] as boolean | undefined,
        includeStyles: args['includeStyles'] as boolean | undefined,
        includeVariables: args['includeVariables'] as boolean | undefined,
        nodeIds: args['nodeIds'] as string[] | undefined,
        geometry: args['geometry'] as 'paths' | 'bounds' | 'none' | undefined,
        depth_limit: args['depth_limit'] as number | undefined,
        branchKey: args['branchKey'] as string | undefined,
        versionId: args['versionId'] as string | undefined,
      });
    }

    if (name === 'figma_feedback') {
      const tool = new FeedbackTool(this.clientFactory);
      return tool.execute({
        action: args['action'] as 'threads' | 'create' | 'reply' | 'resolve' | 'react' | 'delete',
        fileKey: args['fileKey'] as string,
        includeResolved: args['includeResolved'] as boolean | undefined,
        nodeId: args['nodeId'] as string | undefined,
        message: args['message'] as string | undefined,
        clientMeta: args['clientMeta'] as { x?: number; y?: number; nodeId?: string; nodeOffset?: { x: number; y: number } } | undefined,
        commentId: args['commentId'] as string | undefined,
        emoji: args['emoji'] as string | undefined,
      });
    }

    if (name === 'figma_assets') {
      const tool = new AssetsTool(this.clientFactory);
      return tool.execute({
        action: args['action'] as 'export' | 'batch' | 'list' | 'fill_images',
        fileKey: args['fileKey'] as string,
        nodeIds: args['nodeIds'] as string[] | undefined,
        format: args['format'] as 'png' | 'jpg' | 'svg' | 'pdf' | undefined,
        scale: args['scale'] as number | undefined,
        scales: args['scales'] as number[] | undefined,
        formats: args['formats'] as ('png' | 'jpg' | 'svg' | 'pdf')[] | undefined,
        contentsOnly: args['contentsOnly'] as boolean | undefined,
        useAbsoluteBounds: args['useAbsoluteBounds'] as boolean | undefined,
      });
    }

    if (name === 'figma_tokens') {
      const tool = new TokensTool(this.clientFactory);
      return tool.execute({
        action: args['action'] as 'list' | 'export' | 'diff' | 'collections' | 'modes',
        fileKey: args['fileKey'] as string,
        collectionIds: args['collectionIds'] as string[] | undefined,
        modeIds: args['modeIds'] as string[] | undefined,
        format: args['format'] as 'json' | 'css' | 'scss' | 'tailwind' | undefined,
        compareFileKey: args['compareFileKey'] as string | undefined,
      });
    }

    if (name === 'figma_navigate') {
      const tool = new NavigateTool(this.clientFactory);
      return tool.execute({
        action: args['action'] as 'projects' | 'files' | 'branches' | 'versions' | 'search',
        teamId: args['teamId'] as string | undefined,
        projectId: args['projectId'] as string | undefined,
        fileKey: args['fileKey'] as string | undefined,
        query: args['query'] as string | undefined,
        includeMetadata: args['includeMetadata'] as boolean | undefined,
        maxResults: args['maxResults'] as number | undefined,
      });
    }

    if (name === 'figma_analytics') {
      const tool = new AnalyticsTool(this.clientFactory);
      return tool.execute({
        action: args['action'] as 'library' | 'usage' | 'audit' | 'actions',
        fileKey: args['fileKey'] as string | undefined,
        teamId: args['teamId'] as string | undefined,
        type: args['type'] as 'components' | 'styles' | 'variables' | 'all' | undefined,
        componentKey: args['componentKey'] as string | undefined,
        styleKey: args['styleKey'] as string | undefined,
        cursor: args['cursor'] as string | undefined,
        groupBy: args['groupBy'] as 'component' | 'file' | 'team' | undefined,
      });
    }

    if (name === 'figma_code_connect') {
      const tool = new CodeConnectTool(this.clientFactory);
      return tool.execute({
        action: args['action'] as 'list' | 'create' | 'update' | 'delete',
        fileKey: args['fileKey'] as string,
        nodeIds: args['nodeIds'] as string[] | undefined,
        nodeId: args['nodeId'] as string | undefined,
        url: args['url'] as string | undefined,
        name: args['name'] as string | undefined,
        devResourceId: args['devResourceId'] as string | undefined,
      });
    }

    if (name === 'figma_webhooks') {
      const tool = new WebhooksTool(this.clientFactory);
      return tool.execute({
        action: args['action'] as 'list' | 'create' | 'delete' | 'requests',
        teamId: args['teamId'] as string,
        events: args['events'] as string[] | undefined,
        endpoint: args['endpoint'] as string | undefined,
        passcode: args['passcode'] as string | undefined,
        description: args['description'] as string | undefined,
        webhookId: args['webhookId'] as string | undefined,
      });
    }

    // Unknown tool
    logger.warn('Unknown tool requested', { tool: name });
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }

  public onConnectionClose(handler: () => void | Promise<void>): void {
    this.server.onclose = () => {
      Promise.resolve(handler()).catch((error) => {
        logger.error('Error while handling MCP connection close', error);
      });
    };
  }

  public onConnectionError(handler: (error: Error) => void | Promise<void>): void {
    this.server.onerror = (error: Error) => {
      Promise.resolve(handler(error)).catch((handlerError) => {
        logger.error('Error while handling MCP connection error', handlerError);
      });
    };
  }

  async connect(transport: Transport): Promise<void> {
    this.transport = transport;
    await this.server.connect(transport);
    logger.info('Figma MCP Server connected', {
      transport: transport.constructor?.name ?? 'UnknownTransport',
      toolCount: this.toolDefinitions.length,
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.connect(transport);
    logger.info('Figma MCP Server running with stdio transport');
  }

  async cleanup(options: { disconnect?: boolean } = {}): Promise<void> {
    if (options.disconnect && this.transport) {
      try {
        await this.transport.close();
      } catch (error) {
        logger.warn('Error while closing MCP transport during cleanup', error);
      }
    }

    this.transport = null;
    logger.info('Server resources cleaned up');
  }
}
