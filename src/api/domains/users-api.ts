import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';

/**
 * Users API Client - Handles user operations
 * Endpoints: /v1/me
 */
export class UsersAPIClient extends BaseAPIClient {
  /**
   * Get current user - Returns the authenticated user's info
   */
  async getMe(): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>('/v1/me');

      return ResponseFormatter.formatSuccess(
        response,
        'Current user retrieved'
      );
    } catch (error) {
      return ErrorHandler.handle(error, 'getMe');
    }
  }
}
