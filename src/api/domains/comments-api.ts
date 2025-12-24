import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';

export interface GetCommentsParams {
  fileKey: string;
  asMarkdown?: boolean;
}

export interface PostCommentParams {
  fileKey: string;
  message: string;
  commentId?: string; // For replies
  clientMeta?: {
    x?: number;
    y?: number;
    nodeId?: string;
    nodeOffset?: { x: number; y: number };
  };
}

export interface DeleteCommentParams {
  fileKey: string;
  commentId: string;
}

export interface GetCommentReactionsParams {
  fileKey: string;
  commentId: string;
  cursor?: string;
}

export interface PostCommentReactionParams {
  fileKey: string;
  commentId: string;
  emoji: string;
}

export interface DeleteCommentReactionParams {
  fileKey: string;
  commentId: string;
  emoji: string;
}

/**
 * Comments API Client - Handles comment operations
 * Endpoints: /v1/files/{file_key}/comments
 */
export class CommentsAPIClient extends BaseAPIClient {
  /**
   * Get comments - Returns all comments on a file
   */
  async getComments(params: GetCommentsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/files/${params.fileKey}/comments`,
        { as_markdown: params.asMarkdown }
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Comments retrieved for file ${params.fileKey}`,
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getComments(${params.fileKey})`);
    }
  }

  /**
   * Post comment - Creates a new comment on a file
   */
  async postComment(params: PostCommentParams): Promise<MCPResponse> {
    try {
      const { fileKey, ...body } = params;
      
      const response = await this.post<unknown>(
        `/v1/files/${fileKey}/comments`,
        {
          message: body.message,
          comment_id: body.commentId,
          client_meta: body.clientMeta,
        }
      );

      return ResponseFormatter.formatSuccess(
        response,
        'Comment posted successfully',
        { fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `postComment(${params.fileKey})`);
    }
  }

  /**
   * Delete comment - Deletes a comment
   */
  async deleteComment(params: DeleteCommentParams): Promise<MCPResponse> {
    try {
      await this.delete<unknown>(
        `/v1/files/${params.fileKey}/comments/${params.commentId}`
      );

      return ResponseFormatter.formatSuccess(
        { deleted: true, commentId: params.commentId },
        'Comment deleted successfully',
        { fileKey: params.fileKey }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `deleteComment(${params.fileKey}, ${params.commentId})`);
    }
  }

  /**
   * Get comment reactions - Returns reactions on a comment
   */
  async getCommentReactions(params: GetCommentReactionsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/files/${params.fileKey}/comments/${params.commentId}/reactions`,
        { cursor: params.cursor }
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Reactions retrieved for comment ${params.commentId}`,
        { fileKey: params.fileKey, commentId: params.commentId }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getCommentReactions(${params.commentId})`);
    }
  }

  /**
   * Post comment reaction - Adds a reaction to a comment
   */
  async postCommentReaction(params: PostCommentReactionParams): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>(
        `/v1/files/${params.fileKey}/comments/${params.commentId}/reactions`,
        { emoji: params.emoji }
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Reaction ${params.emoji} added to comment`,
        { fileKey: params.fileKey, commentId: params.commentId }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `postCommentReaction(${params.commentId})`);
    }
  }

  /**
   * Delete comment reaction - Removes a reaction from a comment
   */
  async deleteCommentReaction(params: DeleteCommentReactionParams): Promise<MCPResponse> {
    try {
      await this.delete<unknown>(
        `/v1/files/${params.fileKey}/comments/${params.commentId}/reactions?emoji=${encodeURIComponent(params.emoji)}`
      );

      return ResponseFormatter.formatSuccess(
        { deleted: true, emoji: params.emoji },
        `Reaction ${params.emoji} removed from comment`,
        { fileKey: params.fileKey, commentId: params.commentId }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `deleteCommentReaction(${params.commentId})`);
    }
  }
}
