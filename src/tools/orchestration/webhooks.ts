/**
 * Webhooks Tool - Setup and manage webhooks
 * 
 * Actions:
 * - list: List existing webhooks for a team
 * - create: Create a new webhook
 * - delete: Delete a webhook
 * - requests: Get recent webhook requests
 */

import { ClientFactory } from '../../api/client-factory.js';
import { ResponseFormatter } from '../../api/base/response-formatter.js';
import { MCPResponse } from '../../api/base/index.js';
import { WebhooksParams, WebhooksResult, WebhookEventType } from './types.js';

// Event type mapping
const EVENT_ALIASES: Record<string, WebhookEventType> = {
  'update': 'FILE_UPDATE',
  'delete': 'FILE_DELETE',
  'version': 'FILE_VERSION_UPDATE',
  'comment': 'FILE_COMMENT',
  'publish': 'LIBRARY_PUBLISH'
};

export class WebhooksTool {
  constructor(private clientFactory: ClientFactory) {}

  async execute(params: WebhooksParams): Promise<MCPResponse> {
    const { action, teamId } = params;

    switch (action) {
      case 'list':
        return this.listWebhooks(params);
      case 'create':
        return this.createWebhook(params);
      case 'delete':
        return this.deleteWebhook(params);
      case 'requests':
        return this.getWebhookRequests(params);
      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}. Use: list, create, delete, requests`);
    }
  }

  private async listWebhooks(params: WebhooksParams): Promise<MCPResponse> {
    const { teamId } = params;
    const webhooksClient = this.clientFactory.createWebhooksClient();

    try {
      const resp = await webhooksClient.getWebhooks({ teamId });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      const webhooks = data['data']?.['webhooks'] || [];

      const result: WebhooksResult = {
        teamId,
        action: 'list',
        webhooks: webhooks.map((w: Record<string, unknown>) => ({
          id: w['id'],
          teamId: w['team_id'],
          events: w['event_type'] ? [w['event_type']] : [],
          endpoint: w['endpoint'],
          status: w['status'],
          description: w['description']
        }))
      };

      return ResponseFormatter.formatSuccess(result, `${webhooks.length} webhooks`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`List webhooks failed: ${err.message}`, error);
    }
  }

  private async createWebhook(params: WebhooksParams): Promise<MCPResponse> {
    const { teamId, events, endpoint, passcode, description } = params;

    if (!events || events.length === 0) {
      return ResponseFormatter.formatError('events required for create action (e.g., ["update", "comment"])');
    }
    if (!endpoint) {
      return ResponseFormatter.formatError('endpoint required for create action');
    }

    const webhooksClient = this.clientFactory.createWebhooksClient();

    try {
      // Map event aliases to Figma event types
      const mappedEvents = events.map(e => {
        const alias = e.toLowerCase();
        return EVENT_ALIASES[alias] || e;
      });

      // Generate passcode if not provided
      const webhookPasscode = passcode || this.generatePasscode();

      // Create webhook for each event (Figma API creates one webhook per event)
      const createdWebhooks: unknown[] = [];
      
      for (const eventType of mappedEvents) {
        const resp = await webhooksClient.createWebhook({
          teamId,
          eventType: eventType as WebhookEventType,
          endpoint,
          passcode: webhookPasscode,
          description
        });
        const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
        if (data['data']) {
          createdWebhooks.push(data['data']);
        }
      }

      const result: WebhooksResult = {
        teamId,
        action: 'create',
        created: {
          webhooks: createdWebhooks,
          passcode: webhookPasscode,
          note: 'Store this passcode securely - it cannot be retrieved later'
        }
      };

      return ResponseFormatter.formatSuccess(result, `Created ${createdWebhooks.length} webhook(s)`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Create webhook failed: ${err.message}`, error);
    }
  }

  private async deleteWebhook(params: WebhooksParams): Promise<MCPResponse> {
    const { teamId, webhookId } = params;

    if (!webhookId) {
      return ResponseFormatter.formatError('webhookId required for delete action');
    }

    const webhooksClient = this.clientFactory.createWebhooksClient();

    try {
      await webhooksClient.deleteWebhook({ webhookId });

      const result: WebhooksResult = {
        teamId,
        action: 'delete',
        deleted: true
      };

      return ResponseFormatter.formatSuccess(result, `Webhook ${webhookId} deleted`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Delete webhook failed: ${err.message}`, error);
    }
  }

  private async getWebhookRequests(params: WebhooksParams): Promise<MCPResponse> {
    const { teamId, webhookId } = params;

    if (!webhookId) {
      return ResponseFormatter.formatError('webhookId required for requests action');
    }

    const webhooksClient = this.clientFactory.createWebhooksClient();

    try {
      const resp = await webhooksClient.getWebhookRequests({ webhookId });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      const requests = data['data']?.['requests'] || [];

      const result: WebhooksResult = {
        teamId,
        action: 'requests',
        requests
      };

      return ResponseFormatter.formatSuccess(result, `${requests.length} recent requests`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Get webhook requests failed: ${err.message}`, error);
    }
  }

  // Generate secure random passcode
  private generatePasscode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
