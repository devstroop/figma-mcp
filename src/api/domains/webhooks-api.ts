import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';

export interface GetWebhooksParams {
  teamId?: string;
}

export interface CreateWebhookParams {
  eventType: WebhookEventType;
  teamId: string;
  endpoint: string;
  passcode: string;
  status?: 'ACTIVE' | 'PAUSED';
  description?: string;
}

export interface UpdateWebhookParams {
  webhookId: string;
  eventType?: WebhookEventType;
  endpoint?: string;
  passcode?: string;
  status?: 'ACTIVE' | 'PAUSED';
  description?: string;
}

export interface DeleteWebhookParams {
  webhookId: string;
}

export interface GetWebhookRequestsParams {
  webhookId: string;
}

export type WebhookEventType =
  | 'PING'
  | 'FILE_UPDATE'
  | 'FILE_DELETE'
  | 'FILE_VERSION_UPDATE'
  | 'LIBRARY_PUBLISH'
  | 'FILE_COMMENT';

/**
 * Webhooks API Client - Handles webhook operations
 * Endpoints: /v2/webhooks
 */
export class WebhooksAPIClient extends BaseAPIClient {
  /**
   * Get webhooks - Returns webhooks for a team
   */
  async getWebhooks(params?: GetWebhooksParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>('/v2/webhooks', {
        team_id: params?.teamId,
      });

      return ResponseFormatter.formatSuccess(
        response,
        'Webhooks retrieved',
        { teamId: params?.teamId }
      );
    } catch (error) {
      return ErrorHandler.handle(error, 'getWebhooks');
    }
  }

  /**
   * Get webhook - Returns a single webhook by ID
   */
  async getWebhook(webhookId: string): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(`/v2/webhooks/${webhookId}`);

      return ResponseFormatter.formatSuccess(
        response,
        `Webhook ${webhookId} retrieved`,
        { webhookId }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getWebhook(${webhookId})`);
    }
  }

  /**
   * Create webhook - Creates a new webhook
   */
  async createWebhook(params: CreateWebhookParams): Promise<MCPResponse> {
    try {
      const response = await this.post<unknown>('/v2/webhooks', {
        event_type: params.eventType,
        team_id: params.teamId,
        endpoint: params.endpoint,
        passcode: params.passcode,
        status: params.status,
        description: params.description,
      });

      return ResponseFormatter.formatSuccess(
        response,
        'Webhook created successfully',
        { teamId: params.teamId, eventType: params.eventType }
      );
    } catch (error) {
      return ErrorHandler.handle(error, 'createWebhook');
    }
  }

  /**
   * Update webhook - Updates an existing webhook
   */
  async updateWebhook(params: UpdateWebhookParams): Promise<MCPResponse> {
    try {
      const { webhookId, ...body } = params;
      
      const response = await this.put<unknown>(`/v2/webhooks/${webhookId}`, {
        event_type: body.eventType,
        endpoint: body.endpoint,
        passcode: body.passcode,
        status: body.status,
        description: body.description,
      });

      return ResponseFormatter.formatSuccess(
        response,
        `Webhook ${webhookId} updated`,
        { webhookId }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `updateWebhook(${params.webhookId})`);
    }
  }

  /**
   * Delete webhook - Deletes a webhook
   */
  async deleteWebhook(params: DeleteWebhookParams): Promise<MCPResponse> {
    try {
      await this.delete<unknown>(`/v2/webhooks/${params.webhookId}`);

      return ResponseFormatter.formatSuccess(
        { deleted: true, webhookId: params.webhookId },
        `Webhook ${params.webhookId} deleted`
      );
    } catch (error) {
      return ErrorHandler.handle(error, `deleteWebhook(${params.webhookId})`);
    }
  }

  /**
   * Get webhook requests - Returns recent webhook requests for debugging
   */
  async getWebhookRequests(params: GetWebhookRequestsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v2/webhooks/${params.webhookId}/requests`
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Webhook requests retrieved for ${params.webhookId}`,
        { webhookId: params.webhookId }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getWebhookRequests(${params.webhookId})`);
    }
  }
}
