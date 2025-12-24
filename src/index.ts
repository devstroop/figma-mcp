#!/usr/bin/env node

// Set MCP server mode FIRST, before any imports that use logger
process.env['MCP_SERVER'] = 'true';

import { logger } from './logger.js';
import { FigmaMCPServer } from './server-core.js';

const skipRuntime = process.env['SKIP_CONFIG_VALIDATION'] === 'true' || process.env['CI'] === 'true';

let server: FigmaMCPServer | null = null;

try {
  server = new FigmaMCPServer();

  if (skipRuntime) {
    logger.info('Configuration missing or CI mode detected - skipping runtime server startup');
  } else {
    const handleShutdown = (signal: NodeJS.Signals) => {
      logger.info(`Received ${signal}, shutting down`);

      if (!server) {
        process.exit(0);
        return;
      }

      server
        .cleanup({ disconnect: true })
        .catch((error) => {
          logger.warn('Error while cleaning up server during shutdown', error);
        })
        .finally(() => process.exit(0));
    };

    process.once('SIGINT', handleShutdown);
    process.once('SIGTERM', handleShutdown);

    server.run().catch((error) => {
      logger.error('Failed to start Figma MCP server', error);
      process.exit(1);
    });
  }
} catch (error) {
  logger.error('Failed to initialize Figma MCP server', error);
  process.exit(1);
}
