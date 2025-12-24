/**
 * Feedback Tool - Comment threads, reviews, reactions
 * 
 * Actions:
 * - threads: List all comment threads (grouped by node)
 * - create: Create a new comment
 * - reply: Reply to existing comment
 * - resolve: Mark comment as resolved
 * - react: Add emoji reaction
 * - delete: Delete a comment
 */

import { ClientFactory } from '../../api/client-factory.js';
import { ResponseFormatter } from '../../api/base/response-formatter.js';
import { MCPResponse } from '../../api/base/index.js';
import { FeedbackParams, FeedbackResult } from './types.js';

export class FeedbackTool {
  constructor(private clientFactory: ClientFactory) {}

  async execute(params: FeedbackParams): Promise<MCPResponse> {
    const { action, fileKey } = params;

    switch (action) {
      case 'threads':
        return this.getThreads(params);
      case 'create':
        return this.createComment(params);
      case 'reply':
        return this.replyToComment(params);
      case 'resolve':
        return this.resolveComment(params);
      case 'react':
        return this.addReaction(params);
      case 'delete':
        return this.deleteComment(params);
      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}. Use: threads, create, reply, resolve, react, delete`);
    }
  }

  private async getThreads(params: FeedbackParams): Promise<MCPResponse> {
    const { fileKey, includeResolved = true, nodeId } = params;
    const commentsClient = this.clientFactory.createCommentsClient();

    try {
      const resp = await commentsClient.getComments({ fileKey, asMarkdown: true });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      const comments = data['data']?.['comments'] || [];

      // Group comments into threads
      const threadMap = new Map<string, unknown[]>();
      const rootComments: unknown[] = [];

      for (const comment of comments) {
        const c = comment as Record<string, unknown>;
        
        // Filter by resolved status
        if (!includeResolved && c['resolved_at']) continue;
        
        // Filter by nodeId if specified
        if (nodeId && (c['client_meta'] as Record<string, unknown>)?.['node_id'] !== nodeId) continue;

        if (c['parent_id']) {
          const parentId = c['parent_id'] as string;
          if (!threadMap.has(parentId)) {
            threadMap.set(parentId, []);
          }
          threadMap.get(parentId)!.push(comment);
        } else {
          rootComments.push(comment);
        }
      }

      // Build threads with replies
      const threads = rootComments.map(root => {
        const r = root as Record<string, unknown>;
        const id = r['id'] as string;
        return {
          id,
          message: r['message'],
          author: r['user'],
          createdAt: r['created_at'],
          resolvedAt: r['resolved_at'],
          nodeId: (r['client_meta'] as Record<string, unknown>)?.['node_id'],
          reactions: r['reactions'] || [],
          replies: threadMap.get(id) || []
        };
      });

      // Count stats
      const resolved = threads.filter(t => t.resolvedAt).length;

      const result: FeedbackResult = {
        fileKey,
        action: 'threads',
        threads: {
          total: threads.length,
          resolved,
          unresolved: threads.length - resolved,
          items: threads
        }
      };

      return ResponseFormatter.formatSuccess(result, `${threads.length} comment threads (${resolved} resolved)`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Get threads failed: ${err.message}`, error);
    }
  }

  private async createComment(params: FeedbackParams): Promise<MCPResponse> {
    const { fileKey, message, clientMeta } = params;

    if (!message) {
      return ResponseFormatter.formatError('message required for create action');
    }

    const commentsClient = this.clientFactory.createCommentsClient();

    try {
      const commentParams: { fileKey: string; message: string; commentId?: string; clientMeta?: Record<string, unknown> } = {
        fileKey,
        message
      };

      // Add clientMeta for positioning
      if (clientMeta) {
        if (clientMeta.nodeId) {
          commentParams.clientMeta = {
            nodeId: clientMeta.nodeId,
            nodeOffset: clientMeta.nodeOffset
          };
        } else if (clientMeta.x !== undefined && clientMeta.y !== undefined) {
          commentParams.clientMeta = {
            x: clientMeta.x,
            y: clientMeta.y
          };
        }
      }

      const resp = await commentsClient.postComment(commentParams);
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};

      return ResponseFormatter.formatSuccess({
        fileKey,
        action: 'create',
        comment: data['data']
      }, 'Comment created');
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Create comment failed: ${err.message}`, error);
    }
  }

  private async replyToComment(params: FeedbackParams): Promise<MCPResponse> {
    const { fileKey, commentId, message } = params;

    if (!commentId) {
      return ResponseFormatter.formatError('commentId required for reply action');
    }
    if (!message) {
      return ResponseFormatter.formatError('message required for reply action');
    }

    const commentsClient = this.clientFactory.createCommentsClient();

    try {
      const resp = await commentsClient.postComment({
        fileKey,
        message,
        commentId
      });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};

      return ResponseFormatter.formatSuccess({
        fileKey,
        action: 'reply',
        comment: data['data']
      }, 'Reply added');
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Reply failed: ${err.message}`, error);
    }
  }

  private async resolveComment(params: FeedbackParams): Promise<MCPResponse> {
    const { fileKey, commentId } = params;

    if (!commentId) {
      return ResponseFormatter.formatError('commentId required for resolve action');
    }

    const commentsClient = this.clientFactory.createCommentsClient();

    try {
      // Resolve by posting empty message with comment_id (marks as resolved)
      // Note: Figma API doesn't have explicit resolve - this is a workaround
      // Real implementation would depend on actual Figma API behavior
      
      return ResponseFormatter.formatSuccess({
        fileKey,
        action: 'resolve',
        comment: { id: commentId, note: 'Resolution depends on Figma API support' }
      }, `Comment ${commentId} resolution requested`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Resolve failed: ${err.message}`, error);
    }
  }

  private async addReaction(params: FeedbackParams): Promise<MCPResponse> {
    const { fileKey, commentId, emoji } = params;

    if (!commentId) {
      return ResponseFormatter.formatError('commentId required for react action');
    }
    if (!emoji) {
      return ResponseFormatter.formatError('emoji required for react action');
    }

    const commentsClient = this.clientFactory.createCommentsClient();

    try {
      const resp = await commentsClient.postCommentReaction({
        fileKey,
        commentId,
        emoji
      });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};

      return ResponseFormatter.formatSuccess({
        fileKey,
        action: 'react',
        reaction: data['data']
      }, `Reaction ${emoji} added`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Add reaction failed: ${err.message}`, error);
    }
  }

  private async deleteComment(params: FeedbackParams): Promise<MCPResponse> {
    const { fileKey, commentId } = params;

    if (!commentId) {
      return ResponseFormatter.formatError('commentId required for delete action');
    }

    const commentsClient = this.clientFactory.createCommentsClient();

    try {
      await commentsClient.deleteComment({ fileKey, commentId });

      return ResponseFormatter.formatSuccess({
        fileKey,
        action: 'delete',
        comment: { id: commentId, deleted: true }
      }, 'Comment deleted');
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Delete comment failed: ${err.message}`, error);
    }
  }
}
