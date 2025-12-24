import dotenv from 'dotenv';

dotenv.config();

export interface FigmaConfig {
  figmaToken: string;
  figmaTeamId?: string;
  figmaFileKey?: string;
  baseUrl: string;
}

export interface ServerConfig {
  port: number;
  basePath: string;
  logLevel: string;
}

export class ConfigManager {
  private config: FigmaConfig;
  private serverConfig: ServerConfig;

  constructor() {
    this.config = {
      figmaToken: process.env['FIGMA_TOKEN'] || '',
      figmaTeamId: process.env['FIGMA_TEAM_ID'],
      figmaFileKey: process.env['FIGMA_FILE_KEY'],
      baseUrl: 'https://api.figma.com',
    };

    this.serverConfig = {
      port: parseInt(process.env['PORT'] || '3001', 10),
      basePath: process.env['MCP_BASE_PATH'] || '/mcp',
      logLevel: process.env['LOG_LEVEL'] || 'info',
    };
  }

  validate(): void {
    if (!this.config.figmaToken) {
      throw new Error(
        'FIGMA_TOKEN environment variable is required. ' +
        'Get your token from https://www.figma.com/developers/api#access-tokens'
      );
    }
  }

  get(): FigmaConfig {
    return { ...this.config };
  }

  getServerConfig(): ServerConfig {
    return { ...this.serverConfig };
  }

  hasTeamId(): boolean {
    return !!this.config.figmaTeamId;
  }

  hasFileKey(): boolean {
    return !!this.config.figmaFileKey;
  }
}
