/**
 * Tool definitions for Figma MCP Server
 * These define the schema for each tool available to MCP clients
 */

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export function createToolDefinitions(): ToolDefinition[] {
  return [
    // ==================== Files Tools ====================
    {
      name: 'figma_get_file',
      description: 'Get a Figma file as JSON. Returns the document structure including all nodes, components, and styles.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file (from the URL: figma.com/file/{fileKey}/...)',
          },
          version: {
            type: 'string',
            description: 'Specific version ID to retrieve',
          },
          ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific node IDs to retrieve (comma-separated in URL)',
          },
          depth: {
            type: 'number',
            description: 'Depth of nodes to retrieve (default: full tree)',
          },
          geometry: {
            type: 'string',
            enum: ['paths'],
            description: 'Include path geometry data',
          },
          pluginData: {
            type: 'string',
            description: 'Plugin ID to include plugin data from',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_get_file_nodes',
      description: 'Get specific nodes from a Figma file by their IDs.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
          ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of node IDs to retrieve',
          },
          version: {
            type: 'string',
            description: 'Specific version ID',
          },
          depth: {
            type: 'number',
            description: 'Depth of child nodes to include',
          },
          geometry: {
            type: 'string',
            enum: ['paths'],
            description: 'Include path geometry data',
          },
        },
        required: ['fileKey', 'ids'],
      },
    },
    {
      name: 'figma_get_images',
      description: 'Render Figma nodes as images (PNG, JPG, SVG, or PDF).',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
          ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of node IDs to render',
          },
          scale: {
            type: 'number',
            description: 'Scale factor (0.01 to 4)',
            minimum: 0.01,
            maximum: 4,
          },
          format: {
            type: 'string',
            enum: ['jpg', 'png', 'svg', 'pdf'],
            description: 'Image format (default: png)',
          },
          svgIncludeId: {
            type: 'boolean',
            description: 'Include node IDs in SVG output',
          },
          svgSimplifyStroke: {
            type: 'boolean',
            description: 'Simplify strokes in SVG output',
          },
          contentsOnly: {
            type: 'boolean',
            description: 'Render only the contents, not the container frame',
          },
          useAbsoluteBounds: {
            type: 'boolean',
            description: 'Use absolute bounds for positioning',
          },
        },
        required: ['fileKey', 'ids'],
      },
    },
    {
      name: 'figma_get_image_fills',
      description: 'Get URLs for all images used as fills in a Figma file.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_get_file_versions',
      description: 'Get version history of a Figma file.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_get_file_meta',
      description: 'Get metadata for a Figma file without the full document tree.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
        },
        required: ['fileKey'],
      },
    },

    // ==================== Comments Tools ====================
    {
      name: 'figma_get_comments',
      description: 'Get all comments on a Figma file.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
          asMarkdown: {
            type: 'boolean',
            description: 'Return comments as Markdown instead of plain text',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_post_comment',
      description: 'Post a comment on a Figma file.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
          message: {
            type: 'string',
            description: 'The comment text',
          },
          commentId: {
            type: 'string',
            description: 'ID of comment to reply to (for threaded replies)',
          },
          nodeId: {
            type: 'string',
            description: 'Node ID to attach the comment to',
          },
          x: {
            type: 'number',
            description: 'X coordinate for the comment pin',
          },
          y: {
            type: 'number',
            description: 'Y coordinate for the comment pin',
          },
        },
        required: ['fileKey', 'message'],
      },
    },
    {
      name: 'figma_delete_comment',
      description: 'Delete a comment from a Figma file.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
          commentId: {
            type: 'string',
            description: 'The ID of the comment to delete',
          },
        },
        required: ['fileKey', 'commentId'],
      },
    },

    // ==================== Comment Reactions Tools ====================
    {
      name: 'figma_get_comment_reactions',
      description: 'Get reactions on a comment.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
          commentId: {
            type: 'string',
            description: 'The ID of the comment',
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor',
          },
        },
        required: ['fileKey', 'commentId'],
      },
    },
    {
      name: 'figma_post_comment_reaction',
      description: 'Add a reaction to a comment.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
          commentId: {
            type: 'string',
            description: 'The ID of the comment',
          },
          emoji: {
            type: 'string',
            description: 'Emoji shortcode (e.g., :heart:, :+1:)',
          },
        },
        required: ['fileKey', 'commentId', 'emoji'],
      },
    },
    {
      name: 'figma_delete_comment_reaction',
      description: 'Remove a reaction from a comment.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
          commentId: {
            type: 'string',
            description: 'The ID of the comment',
          },
          emoji: {
            type: 'string',
            description: 'Emoji shortcode to remove',
          },
        },
        required: ['fileKey', 'commentId', 'emoji'],
      },
    },

    // ==================== Components & Styles Tools ====================
    {
      name: 'figma_get_team_components',
      description: 'Get published components from a team library.',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'The ID of the team',
          },
          pageSize: {
            type: 'number',
            description: 'Number of items per page (default: 30)',
          },
          cursor: {
            type: 'string',
            description: 'Cursor for pagination',
          },
        },
        required: ['teamId'],
      },
    },
    {
      name: 'figma_get_file_components',
      description: 'Get published components from a file library.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_get_component',
      description: 'Get metadata for a specific component by key.',
      inputSchema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'The unique component key',
          },
        },
        required: ['key'],
      },
    },

    // ==================== Component Sets Tools ====================
    {
      name: 'figma_get_team_component_sets',
      description: 'Get published component sets from a team library.',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'The ID of the team',
          },
          pageSize: {
            type: 'number',
            description: 'Number of items per page',
          },
          cursor: {
            type: 'string',
            description: 'Cursor for pagination',
          },
        },
        required: ['teamId'],
      },
    },
    {
      name: 'figma_get_file_component_sets',
      description: 'Get published component sets from a file library.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_get_component_set',
      description: 'Get metadata for a specific component set by key.',
      inputSchema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'The unique component set key',
          },
        },
        required: ['key'],
      },
    },

    // ==================== Styles Tools ====================
    {
      name: 'figma_get_team_styles',
      description: 'Get published styles from a team library.',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'The ID of the team',
          },
          pageSize: {
            type: 'number',
            description: 'Number of items per page',
          },
          cursor: {
            type: 'string',
            description: 'Cursor for pagination',
          },
        },
        required: ['teamId'],
      },
    },
    {
      name: 'figma_get_file_styles',
      description: 'Get published styles from a file library.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_get_style',
      description: 'Get metadata for a specific style by key.',
      inputSchema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'The unique style key',
          },
        },
        required: ['key'],
      },
    },

    // ==================== Projects Tools ====================
    {
      name: 'figma_get_team_projects',
      description: 'Get all projects in a team.',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'The ID of the team',
          },
        },
        required: ['teamId'],
      },
    },
    {
      name: 'figma_get_project_files',
      description: 'Get all files in a project.',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'The ID of the project',
          },
          branchData: {
            type: 'boolean',
            description: 'Include branch metadata',
          },
        },
        required: ['projectId'],
      },
    },

    // ==================== Variables Tools (Enterprise) ====================
    {
      name: 'figma_get_local_variables',
      description: 'Get all local variables in a file (Enterprise only).',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_get_published_variables',
      description: 'Get all published variables in a file (Enterprise only).',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_post_variables',
      description: 'Create, update, or delete variables in a file (Enterprise only).',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
          variableCollections: {
            type: 'array',
            description: 'Variable collection operations',
          },
          variableModes: {
            type: 'array',
            description: 'Variable mode operations',
          },
          variables: {
            type: 'array',
            description: 'Variable operations',
          },
          variableModeValues: {
            type: 'array',
            description: 'Variable mode value assignments',
          },
        },
        required: ['fileKey'],
      },
    },

    // ==================== Webhooks Tools ====================
    {
      name: 'figma_get_webhooks',
      description: 'Get all webhooks for a team.',
      inputSchema: {
        type: 'object',
        properties: {
          teamId: {
            type: 'string',
            description: 'The ID of the team (optional)',
          },
        },
        required: [],
      },
    },
    {
      name: 'figma_create_webhook',
      description: 'Create a new webhook.',
      inputSchema: {
        type: 'object',
        properties: {
          eventType: {
            type: 'string',
            enum: ['PING', 'FILE_UPDATE', 'FILE_DELETE', 'FILE_VERSION_UPDATE', 'LIBRARY_PUBLISH', 'FILE_COMMENT'],
            description: 'The event type to subscribe to',
          },
          teamId: {
            type: 'string',
            description: 'The team ID for the webhook',
          },
          endpoint: {
            type: 'string',
            description: 'The URL to receive webhook events',
          },
          passcode: {
            type: 'string',
            description: 'Passcode for webhook authentication',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'PAUSED'],
            description: 'Initial webhook status',
          },
          description: {
            type: 'string',
            description: 'Description of the webhook',
          },
        },
        required: ['eventType', 'teamId', 'endpoint', 'passcode'],
      },
    },
    {
      name: 'figma_delete_webhook',
      description: 'Delete a webhook.',
      inputSchema: {
        type: 'object',
        properties: {
          webhookId: {
            type: 'string',
            description: 'The ID of the webhook to delete',
          },
        },
        required: ['webhookId'],
      },
    },
    {
      name: 'figma_get_webhook',
      description: 'Get a single webhook by ID.',
      inputSchema: {
        type: 'object',
        properties: {
          webhookId: {
            type: 'string',
            description: 'The ID of the webhook',
          },
        },
        required: ['webhookId'],
      },
    },
    {
      name: 'figma_update_webhook',
      description: 'Update an existing webhook.',
      inputSchema: {
        type: 'object',
        properties: {
          webhookId: {
            type: 'string',
            description: 'The ID of the webhook to update',
          },
          eventType: {
            type: 'string',
            enum: ['PING', 'FILE_UPDATE', 'FILE_DELETE', 'FILE_VERSION_UPDATE', 'LIBRARY_PUBLISH', 'FILE_COMMENT', 'DEV_MODE_STATUS_UPDATE'],
            description: 'The event type to subscribe to',
          },
          endpoint: {
            type: 'string',
            description: 'The URL to receive webhook events',
          },
          passcode: {
            type: 'string',
            description: 'Passcode for webhook authentication',
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'PAUSED'],
            description: 'Webhook status',
          },
          description: {
            type: 'string',
            description: 'Description of the webhook',
          },
        },
        required: ['webhookId'],
      },
    },
    {
      name: 'figma_get_webhook_requests',
      description: 'Get recent webhook requests for debugging.',
      inputSchema: {
        type: 'object',
        properties: {
          webhookId: {
            type: 'string',
            description: 'The ID of the webhook',
          },
        },
        required: ['webhookId'],
      },
    },

    // ==================== User Tools ====================
    {
      name: 'figma_get_me',
      description: 'Get information about the currently authenticated user.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },

    // ==================== Dev Resources Tools ====================
    {
      name: 'figma_get_dev_resources',
      description: 'Get dev resources attached to nodes in a file.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
          nodeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by specific node IDs',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_create_dev_resource',
      description: 'Create a dev resource link on a Figma node.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
          nodeId: {
            type: 'string',
            description: 'The node ID to attach the resource to',
          },
          name: {
            type: 'string',
            description: 'Display name for the resource',
          },
          url: {
            type: 'string',
            description: 'URL of the dev resource',
          },
        },
        required: ['fileKey', 'nodeId', 'name', 'url'],
      },
    },
    {
      name: 'figma_delete_dev_resource',
      description: 'Delete a dev resource from a Figma file.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
          devResourceId: {
            type: 'string',
            description: 'The ID of the dev resource to delete',
          },
        },
        required: ['fileKey', 'devResourceId'],
      },
    },
    {
      name: 'figma_update_dev_resource',
      description: 'Update a dev resource in a Figma file.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the Figma file',
          },
          devResourceId: {
            type: 'string',
            description: 'The ID of the dev resource to update',
          },
          name: {
            type: 'string',
            description: 'New display name for the resource',
          },
          url: {
            type: 'string',
            description: 'New URL for the dev resource',
          },
        },
        required: ['fileKey', 'devResourceId'],
      },
    },

    // ==================== Library Analytics Tools ====================
    {
      name: 'figma_get_component_actions',
      description: 'Get library analytics for component actions (insertions, detachments).',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the library file',
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_get_component_usages',
      description: 'Get library analytics for component usages across files.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the library file',
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_get_style_actions',
      description: 'Get library analytics for style actions.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the library file',
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_get_style_usages',
      description: 'Get library analytics for style usages across files.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the library file',
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_get_variable_actions',
      description: 'Get library analytics for variable actions.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the library file',
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor',
          },
        },
        required: ['fileKey'],
      },
    },
    {
      name: 'figma_get_variable_usages',
      description: 'Get library analytics for variable usages across files.',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'The key of the library file',
          },
          cursor: {
            type: 'string',
            description: 'Pagination cursor',
          },
        },
        required: ['fileKey'],
      },
    },

    // ==================== Orchestration Tools (Domain-Based) ====================
    
    // INSPECT - Deep file/node inspection
    {
      name: 'figma_inspect',
      description: 'Deep inspection of Figma files and nodes. Actions: snapshot (file overview), nodes (get specific nodes), properties (extract design properties), tree (document structure), compare (compare with branch/version).',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['snapshot', 'nodes', 'properties', 'tree', 'compare'],
            description: 'Action to perform',
          },
          fileKey: {
            type: 'string',
            description: 'The Figma file key',
          },
          depth: {
            type: 'string',
            enum: ['shallow', 'full'],
            description: 'For snapshot: shallow (metadata only) or full (with document)',
          },
          includeComponents: {
            type: 'boolean',
            description: 'For snapshot: include components list',
          },
          includeStyles: {
            type: 'boolean',
            description: 'For snapshot: include styles list',
          },
          includeVariables: {
            type: 'boolean',
            description: 'For snapshot: include variables summary',
          },
          nodeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'For nodes/properties: specific node IDs',
          },
          geometry: {
            type: 'string',
            enum: ['paths', 'bounds', 'none'],
            description: 'For nodes: geometry detail level',
          },
          depth_limit: {
            type: 'number',
            description: 'For tree: maximum depth (default: 3)',
          },
          branchKey: {
            type: 'string',
            description: 'For compare: branch file key',
          },
          versionId: {
            type: 'string',
            description: 'For compare: version ID',
          },
        },
        required: ['action', 'fileKey'],
      },
    },

    // FEEDBACK - Comment management
    {
      name: 'figma_feedback',
      description: 'Manage comments and feedback on Figma files. Actions: threads (list comment threads), create (new comment), reply (to existing), resolve, react (add emoji), delete.',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['threads', 'create', 'reply', 'resolve', 'react', 'delete'],
            description: 'Action to perform',
          },
          fileKey: {
            type: 'string',
            description: 'The Figma file key',
          },
          includeResolved: {
            type: 'boolean',
            description: 'For threads: include resolved comments (default: true)',
          },
          nodeId: {
            type: 'string',
            description: 'For threads/create: filter by or attach to node',
          },
          message: {
            type: 'string',
            description: 'For create/reply: comment message',
          },
          clientMeta: {
            type: 'object',
            description: 'For create: position metadata',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
              nodeId: { type: 'string' },
              nodeOffset: {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                },
              },
            },
          },
          commentId: {
            type: 'string',
            description: 'For reply/resolve/react/delete: target comment ID',
          },
          emoji: {
            type: 'string',
            description: 'For react: emoji to add',
          },
        },
        required: ['action', 'fileKey'],
      },
    },

    // ASSETS - Export and organize
    {
      name: 'figma_assets',
      description: 'Export and manage design assets. Actions: export (single format), batch (multiple formats/scales), list (find exportable nodes), fill_images (get image fill URLs).',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['export', 'batch', 'list', 'fill_images'],
            description: 'Action to perform',
          },
          fileKey: {
            type: 'string',
            description: 'The Figma file key',
          },
          nodeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'For export/batch: node IDs to export',
          },
          format: {
            type: 'string',
            enum: ['png', 'jpg', 'svg', 'pdf'],
            description: 'For export: image format (default: png)',
          },
          scale: {
            type: 'number',
            description: 'For export: scale factor (default: 1)',
          },
          formats: {
            type: 'array',
            items: { type: 'string', enum: ['png', 'jpg', 'svg', 'pdf'] },
            description: 'For batch: multiple formats',
          },
          scales: {
            type: 'array',
            items: { type: 'number' },
            description: 'For batch: multiple scales (e.g., [1, 2, 3])',
          },
          contentsOnly: {
            type: 'boolean',
            description: 'Omit containing frame',
          },
          useAbsoluteBounds: {
            type: 'boolean',
            description: 'Use absolute bounds for rendering',
          },
        },
        required: ['action', 'fileKey'],
      },
    },

    // TOKENS - Design token management
    {
      name: 'figma_tokens',
      description: 'Design token and variable management. Actions: list (all variables), collections (list collections), modes (get modes), export (to CSS/SCSS/JSON/Tailwind), diff (compare files).',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'collections', 'modes', 'export', 'diff'],
            description: 'Action to perform',
          },
          fileKey: {
            type: 'string',
            description: 'The Figma file key',
          },
          collectionIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by collection IDs',
          },
          modeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by or export specific modes',
          },
          format: {
            type: 'string',
            enum: ['json', 'css', 'scss', 'tailwind'],
            description: 'For export: output format (default: json)',
          },
          compareFileKey: {
            type: 'string',
            description: 'For diff: file key to compare against',
          },
        },
        required: ['action', 'fileKey'],
      },
    },

    // NAVIGATE - Team/project exploration
    {
      name: 'figma_navigate',
      description: 'Navigate team and project structure. Actions: projects (list team projects), files (list project files), branches (file branches), versions (version history), search (find files by name).',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['projects', 'files', 'branches', 'versions', 'search'],
            description: 'Action to perform',
          },
          teamId: {
            type: 'string',
            description: 'Team ID (required for projects/files/search)',
          },
          projectId: {
            type: 'string',
            description: 'For files: specific project ID',
          },
          fileKey: {
            type: 'string',
            description: 'For branches/versions: file key',
          },
          query: {
            type: 'string',
            description: 'For search: search query',
          },
          includeMetadata: {
            type: 'boolean',
            description: 'For files: fetch additional metadata',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum results to return (default: 50)',
          },
        },
        required: ['action'],
      },
    },

    // ANALYTICS - Library analytics
    {
      name: 'figma_analytics',
      description: 'Library usage and design system analytics. Actions: library (overview), usage (component/style usage), audit (health check), actions (library action history).',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['library', 'usage', 'audit', 'actions'],
            description: 'Action to perform',
          },
          fileKey: {
            type: 'string',
            description: 'Library file key',
          },
          teamId: {
            type: 'string',
            description: 'For library: team-level components/styles',
          },
          type: {
            type: 'string',
            enum: ['components', 'styles', 'variables', 'all'],
            description: 'For library/audit: asset type filter',
          },
          componentKey: {
            type: 'string',
            description: 'For usage: specific component key',
          },
          styleKey: {
            type: 'string',
            description: 'For usage: specific style key',
          },
          cursor: {
            type: 'string',
            description: 'For actions: pagination cursor',
          },
          groupBy: {
            type: 'string',
            enum: ['component', 'file', 'team'],
            description: 'For usage: grouping option',
          },
        },
        required: ['action'],
      },
    },

    // CODE_CONNECT - Dev resources
    {
      name: 'figma_code_connect',
      description: 'Manage dev resources (code links). Actions: list (get existing), create (add new), update (modify), delete (remove).',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'create', 'update', 'delete'],
            description: 'Action to perform',
          },
          fileKey: {
            type: 'string',
            description: 'The Figma file key',
          },
          nodeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'For list: filter by node IDs',
          },
          nodeId: {
            type: 'string',
            description: 'For create: node to attach resource to',
          },
          url: {
            type: 'string',
            description: 'For create/update: resource URL',
          },
          name: {
            type: 'string',
            description: 'For create/update: display name',
          },
          devResourceId: {
            type: 'string',
            description: 'For update/delete: resource ID',
          },
        },
        required: ['action', 'fileKey'],
      },
    },

    // WEBHOOKS - Webhook management
    {
      name: 'figma_webhooks',
      description: 'Manage webhooks for file change notifications. Actions: list (existing webhooks), create (new webhook), delete (remove), requests (recent deliveries).',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'create', 'delete', 'requests'],
            description: 'Action to perform',
          },
          teamId: {
            type: 'string',
            description: 'Team ID',
          },
          events: {
            type: 'array',
            items: { type: 'string' },
            description: 'For create: events to monitor (update, comment, version, delete, publish)',
          },
          endpoint: {
            type: 'string',
            description: 'For create: webhook endpoint URL',
          },
          passcode: {
            type: 'string',
            description: 'For create: optional passcode (auto-generated if omitted)',
          },
          description: {
            type: 'string',
            description: 'For create: webhook description',
          },
          webhookId: {
            type: 'string',
            description: 'For delete/requests: webhook ID',
          },
        },
        required: ['action', 'teamId'],
      },
    },
  ];
}

