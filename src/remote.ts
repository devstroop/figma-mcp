#!/usr/bin/env node

// Enable MCP server logging before other imports
process.env['MCP_SERVER'] = 'true';

import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { Request, Response } from 'express';
import { logger } from './logger.js';
import { FigmaMCPServer } from './server-core.js';

interface McpSession {
  server: FigmaMCPServer;
  transport: SSEServerTransport;
}

const sessions = new Map<string, McpSession>();

const port = Number.parseInt(process.env['PORT'] ?? '3001', 10);
const basePath = process.env['MCP_BASE_PATH'] ?? '/mcp';

const app = express();
app.disable('x-powered-by');

function normalizeSessionId(sessionId: unknown): string | null {
  if (typeof sessionId !== 'string') return null;
  const trimmed = sessionId.trim();
  if (!trimmed || trimmed.length > 128) return null;
  return trimmed;
}

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    service: 'figma-mcp',
    version: '1.0.0'
  });
});

app.get(`${basePath}/sse`, async (req: Request, res: Response) => {
  logger.info('Incoming MCP SSE connection', { ip: req.ip });

  let figmaServer: FigmaMCPServer;
  try {
    figmaServer = new FigmaMCPServer();
  } catch (error) {
    logger.error('Failed to initialize Figma MCP server for session', error);
    res.status(500).json({ error: 'Failed to initialize Figma MCP server' });
    return;
  }

  const transport = new SSEServerTransport(`${basePath}/messages`, res);
  const sessionId = transport.sessionId;

  sessions.set(sessionId, { server: figmaServer, transport });

  figmaServer.onConnectionClose(async () => {
    sessions.delete(sessionId);
    try {
      await figmaServer.cleanup();
    } catch (closeError) {
      logger.warn('Error while cleaning up MCP session after close', {
        sessionId,
        error: closeError instanceof Error ? closeError.message : closeError,
      });
    }
    logger.info('MCP SSE session closed', { sessionId });
  });

  figmaServer.onConnectionError((error) => {
    logger.error('MCP connection error', {
      sessionId,
      error: error.message,
    });
  });

  try {
    await figmaServer.connect(transport);
    logger.info('MCP SSE session established', { sessionId });
  } catch (error) {
    sessions.delete(sessionId);
    logger.error('Failed to establish MCP connection', {
      sessionId,
      error: error instanceof Error ? error.message : error,
    });
  }
});

app.post(`${basePath}/messages`, express.json(), async (req: Request, res: Response) => {
  const sessionId = normalizeSessionId(req.query['sessionId']);

  if (!sessionId) {
    res.status(400).json({ error: 'Invalid or missing session ID' });
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    logger.warn('Unknown MCP session requested', { sessionId });
    res.status(404).json({ error: 'Unknown MCP session' });
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    logger.error('Failed to handle MCP message', {
      sessionId,
      error: error instanceof Error ? error.message : error,
    });
  }
});

const httpServer = app.listen(port, () => {
  logger.info('Figma MCP remote server listening', {
    port,
    basePath,
  });
});

let shuttingDown = false;

const shutdown = (signal: NodeJS.Signals) => {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(`Received ${signal}, shutting down remote MCP server`);

  const closeHttpServer = new Promise<void>((resolve) => {
    httpServer.close((error) => {
      if (error) {
        logger.error('Error while closing HTTP server', error);
      }
      resolve();
    });
  });

  const closeSessions = Promise.allSettled(
    Array.from(sessions.entries()).map(async ([sessionId, session]) => {
      try {
        await session.server.cleanup({ disconnect: true });
        logger.info('MCP session cleaned up during shutdown', { sessionId });
      } catch (error) {
        logger.warn('Error while cleaning up MCP session during shutdown', {
          sessionId,
          error: error instanceof Error ? error.message : error,
        });
      }
    })
  );

  Promise.all([closeHttpServer, closeSessions])
    .then(() => {
      logger.info('Figma MCP remote server shut down successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error during shutdown', error);
      process.exit(1);
    });
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
