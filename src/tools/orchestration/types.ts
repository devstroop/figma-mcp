/**
 * Orchestration Tools - Domain-Based with Action Parameters
 * 
 * Pattern: Each tool covers a DOMAIN with multiple ACTIONS
 * This allows any professional (designer, developer, reviewer, PM, etc.)
 * to use the same tools for their specific workflows.
 * 
 * Tools:
 * - figma_inspect: Deep inspection of files, nodes, and properties
 * - figma_feedback: Comment threads, reviews, reactions
 * - figma_assets: Export and organize design assets
 * - figma_tokens: Design token management and sync
 * - figma_navigate: Explore teams, projects, files, branches
 * - figma_analytics: Library usage, adoption, and health audits
 */

import { MCPResponse } from '../../api/base/index.js';

// ==================== INSPECT TOOL ====================

export interface InspectParams {
  action: 'snapshot' | 'nodes' | 'properties' | 'tree' | 'compare';
  fileKey: string;
  
  // For 'snapshot' action
  depth?: 'shallow' | 'full';
  includeComponents?: boolean;
  includeStyles?: boolean;
  includeVariables?: boolean;
  
  // For 'nodes' and 'properties' actions
  nodeIds?: string[];
  geometry?: 'paths' | 'bounds' | 'none';
  
  // For 'tree' action
  depth_limit?: number;
  
  // For 'compare' action
  branchKey?: string;
  versionId?: string;
}

// ==================== FEEDBACK TOOL ====================

export interface FeedbackParams {
  action: 'threads' | 'create' | 'reply' | 'resolve' | 'react' | 'delete';
  fileKey: string;
  
  // For 'threads' action
  includeResolved?: boolean;
  nodeId?: string;
  
  // For 'create' action
  message?: string;
  clientMeta?: {
    x?: number;
    y?: number;
    nodeId?: string;
    nodeOffset?: { x: number; y: number };
  };
  
  // For 'reply' and 'resolve' actions
  commentId?: string;
  
  // For 'react' action
  emoji?: string;
}

// ==================== ASSETS TOOL ====================

export interface AssetsParams {
  action: 'export' | 'batch' | 'list' | 'fill_images';
  fileKey: string;
  
  // For 'export' and 'batch' actions
  nodeIds?: string[];
  format?: 'png' | 'jpg' | 'svg' | 'pdf';
  scale?: number;
  scales?: number[];
  formats?: ('png' | 'jpg' | 'svg' | 'pdf')[];
  contentsOnly?: boolean;
  useAbsoluteBounds?: boolean;
  
  // For 'fill_images' action (image fills)
  // Returns URLs of images used as fills
}

// ==================== TOKENS TOOL ====================

export interface TokensParams {
  action: 'list' | 'export' | 'diff' | 'collections' | 'modes';
  fileKey: string;
  
  // For 'list' and 'export' actions
  collectionIds?: string[];
  modeIds?: string[];
  
  // For 'export' action
  format?: 'json' | 'css' | 'scss' | 'tailwind';
  
  // For 'diff' action
  compareFileKey?: string;
}

// ==================== NAVIGATE TOOL ====================

export interface NavigateParams {
  action: 'projects' | 'files' | 'branches' | 'versions' | 'search';
  
  // Context identifiers
  teamId?: string;
  projectId?: string;
  fileKey?: string;
  
  // For 'search' action
  query?: string;
  
  // Options
  includeMetadata?: boolean;
  maxResults?: number;
}

// ==================== ANALYTICS TOOL ====================

export interface AnalyticsParams {
  action: 'library' | 'usage' | 'audit' | 'actions';
  
  // Required context
  fileKey?: string;
  teamId?: string;
  
  // For 'library' and 'audit' actions
  type?: 'components' | 'styles' | 'variables' | 'all';
  
  // For 'usage' and 'actions' actions
  componentKey?: string;
  styleKey?: string;
  
  // For 'actions' action
  cursor?: string;
  
  // Options
  groupBy?: 'component' | 'file' | 'team';
}

// ==================== CODE CONNECT TOOL ====================

export interface CodeConnectParams {
  action: 'list' | 'create' | 'update' | 'delete';
  fileKey: string;
  
  // For 'list' action
  nodeIds?: string[];
  
  // For 'create' and 'update' actions
  nodeId?: string;
  url?: string;
  name?: string;
  
  // For 'update' and 'delete' actions
  devResourceId?: string;
}

// ==================== WEBHOOKS TOOL ====================

export type WebhookEventType = 
  | 'FILE_UPDATE'
  | 'FILE_DELETE'
  | 'FILE_VERSION_UPDATE'
  | 'FILE_COMMENT'
  | 'LIBRARY_PUBLISH';

export interface WebhooksParams {
  action: 'list' | 'create' | 'delete' | 'requests';
  teamId: string;
  
  // For 'create' action
  events?: string[];
  endpoint?: string;
  passcode?: string;
  description?: string;
  
  // For 'delete' and 'requests' actions
  webhookId?: string;
}

// ==================== ORCHESTRATION RESULT TYPES ====================

export interface InspectResult {
  fileKey: string;
  action: string;
  file?: {
    name: string;
    lastModified: string;
    version: string;
    thumbnailUrl?: string;
    editorType?: string;
  };
  nodes?: unknown[];
  components?: {
    count: number;
    items: unknown[];
  };
  styles?: {
    count: number;
    items: unknown[];
  };
  variables?: {
    collections: number;
    count: number;
    modes: number;
  };
  tree?: unknown;
  comparison?: {
    from: string;
    to: string;
    changes: unknown[];
  };
}

export interface FeedbackResult {
  fileKey: string;
  action: string;
  threads?: {
    total: number;
    resolved: number;
    unresolved: number;
    items: unknown[];
  };
  comment?: unknown;
  reaction?: unknown;
}

export interface AssetsResult {
  fileKey: string;
  action: string;
  exports?: {
    nodeId: string;
    nodeName?: string;
    images: {
      format: string;
      scale: number;
      url: string;
    }[];
  }[];
  totalImages?: number;
  fillImages?: unknown[];
}

export interface TokensResult {
  fileKey: string;
  action: string;
  collections?: unknown[];
  variables?: {
    count: number;
    items: unknown[];
  };
  modes?: unknown[];
  exported?: {
    format: string;
    content: string;
    filename: string;
  };
  diff?: {
    added: unknown[];
    removed: unknown[];
    modified: unknown[];
  };
}

export interface NavigateResult {
  action: string;
  teamId?: string;
  projectId?: string;
  fileKey?: string;
  projects?: unknown[];
  files?: unknown[];
  branches?: unknown[];
  versions?: unknown[];
  searchResults?: unknown[];
  summary: {
    count: number;
    hasMore?: boolean;
  };
}

export interface AnalyticsResult {
  action: string;
  fileKey?: string;
  teamId?: string;
  library?: {
    components?: { count: number; items: unknown[] };
    styles?: { count: number; items: unknown[] };
    variables?: { count: number; items: unknown[] };
  };
  usage?: {
    fileKey: string;
    usages: unknown[];
    totalUsages: number;
  };
  audit?: {
    healthScore: number;
    issues: unknown[];
    recommendations: string[];
  };
  actions?: {
    items: unknown[];
    cursor?: string;
  };
}

export interface CodeConnectResult {
  fileKey: string;
  action: string;
  devResources?: unknown[];
  created?: unknown;
  updated?: unknown;
  deleted?: boolean;
}

export interface WebhooksResult {
  teamId: string;
  action: string;
  webhooks?: unknown[];
  created?: unknown;
  deleted?: boolean;
  requests?: unknown[];
}

// ==================== TOOL INTERFACE ====================

export interface OrchestrationTool<TParams, TResult> {
  execute(params: TParams): Promise<MCPResponse>;
}
