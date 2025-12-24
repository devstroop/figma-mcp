import { FigmaClientConfig } from './base/index.js';
import {
  FilesAPIClient,
  CommentsAPIClient,
  ComponentsAPIClient,
  ProjectsAPIClient,
  VariablesAPIClient,
  WebhooksAPIClient,
  UsersAPIClient,
  DevResourcesAPIClient,
  AnalyticsAPIClient,
} from './domains/index.js';

export interface ClientFactoryConfig extends FigmaClientConfig {}

/**
 * Client Factory - Creates instances of domain-specific API clients
 */
export class ClientFactory {
  private config: ClientFactoryConfig;

  constructor(config: ClientFactoryConfig) {
    this.config = config;
  }

  createFilesClient(): FilesAPIClient {
    return new FilesAPIClient(this.config);
  }

  createCommentsClient(): CommentsAPIClient {
    return new CommentsAPIClient(this.config);
  }

  createComponentsClient(): ComponentsAPIClient {
    return new ComponentsAPIClient(this.config);
  }

  createProjectsClient(): ProjectsAPIClient {
    return new ProjectsAPIClient(this.config);
  }

  createVariablesClient(): VariablesAPIClient {
    return new VariablesAPIClient(this.config);
  }

  createWebhooksClient(): WebhooksAPIClient {
    return new WebhooksAPIClient(this.config);
  }

  createUsersClient(): UsersAPIClient {
    return new UsersAPIClient(this.config);
  }

  createDevResourcesClient(): DevResourcesAPIClient {
    return new DevResourcesAPIClient(this.config);
  }

  createAnalyticsClient(): AnalyticsAPIClient {
    return new AnalyticsAPIClient(this.config);
  }

  /**
   * Create all clients at once for convenience
   */
  createAllClients() {
    return {
      files: this.createFilesClient(),
      comments: this.createCommentsClient(),
      components: this.createComponentsClient(),
      projects: this.createProjectsClient(),
      variables: this.createVariablesClient(),
      webhooks: this.createWebhooksClient(),
      users: this.createUsersClient(),
      devResources: this.createDevResourcesClient(),
      analytics: this.createAnalyticsClient(),
    };
  }
}
