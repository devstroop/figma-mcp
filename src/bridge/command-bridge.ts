/**
 * Command Bridge Server
 * 
 * HTTP server that bridges MCP commands to Figma Plugin.
 * - MCP queues commands via POST /commands
 * - Plugin polls commands via GET /commands
 * - Plugin reports completion via POST /commands/:id/complete
 */

import http from 'http';
import { logger } from '../logger.js';

export interface DesignCommand {
  id: string;
  type: 'create_page' | 'rename_page' | 'delete_page' | 
        'move_node' | 'rename_node' | 'delete_node' |
        'create_frame' | 'create_component' | 'create_style' |
        'group_nodes' | 'ungroup_node' |
        'set_property' | 'batch';
  params: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

interface CommandQueue {
  commands: DesignCommand[];
  fileKey: string | null;
}

// In-memory command queue
const queue: CommandQueue = {
  commands: [],
  fileKey: null
};

let server: http.Server | null = null;
let serverPort = 3847;

/**
 * Add a command to the queue
 */
export function queueCommand(command: Omit<DesignCommand, 'id' | 'status' | 'createdAt'>): DesignCommand {
  const cmd: DesignCommand = {
    ...command,
    id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    createdAt: Date.now()
  };
  queue.commands.push(cmd);
  logger.info(`Command queued: ${cmd.type} (${cmd.id})`);
  return cmd;
}

/**
 * Queue multiple commands as a batch
 */
export function queueBatch(fileKey: string, commands: Array<Omit<DesignCommand, 'id' | 'status' | 'createdAt'>>): DesignCommand[] {
  queue.fileKey = fileKey;
  return commands.map(cmd => queueCommand(cmd));
}

/**
 * Get pending commands
 */
export function getPendingCommands(): DesignCommand[] {
  return queue.commands.filter(c => c.status === 'pending');
}

/**
 * Get all commands
 */
export function getAllCommands(): CommandQueue {
  return queue;
}

/**
 * Mark command as completed
 */
export function completeCommand(id: string, result?: any, error?: string): boolean {
  const cmd = queue.commands.find(c => c.id === id);
  if (!cmd) return false;
  
  cmd.status = error ? 'failed' : 'completed';
  cmd.result = result;
  cmd.error = error;
  cmd.completedAt = Date.now();
  
  logger.info(`Command ${error ? 'failed' : 'completed'}: ${cmd.type} (${id})`);
  return true;
}

/**
 * Clear all commands
 */
export function clearCommands(): void {
  queue.commands = [];
  queue.fileKey = null;
  logger.info('Command queue cleared');
}

/**
 * Start the HTTP bridge server
 */
export function startBridgeServer(port: number = 3847): Promise<number> {
  return new Promise((resolve, reject) => {
    if (server) {
      resolve(serverPort);
      return;
    }

    server = http.createServer((req, res) => {
      // CORS headers for Figma plugin
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url || '/', `http://localhost:${port}`);
      
      // GET /commands - Get pending commands
      if (req.method === 'GET' && url.pathname === '/commands') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          fileKey: queue.fileKey,
          commands: getPendingCommands()
        }));
        return;
      }

      // GET /commands/all - Get all commands with status
      if (req.method === 'GET' && url.pathname === '/commands/all') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(queue));
        return;
      }

      // POST /commands/:id/complete - Mark command as done
      const completeMatch = url.pathname.match(/^\/commands\/([^/]+)\/complete$/);
      if (req.method === 'POST' && completeMatch && completeMatch[1]) {
        const commandId = completeMatch[1];
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const data = body ? JSON.parse(body) : {};
            const success = completeCommand(commandId, data.result, data.error);
            res.writeHead(success ? 200 : 404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
        return;
      }

      // DELETE /commands - Clear all commands
      if (req.method === 'DELETE' && url.pathname === '/commands') {
        clearCommands();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // GET /health - Health check
      if (req.method === 'GET' && url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'ok', 
          pendingCommands: getPendingCommands().length,
          totalCommands: queue.commands.length
        }));
        return;
      }

      // GET /plugin - Serve the Figma plugin code
      if (req.method === 'GET' && url.pathname === '/plugin') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(generatePluginCode(port));
        return;
      }

      // 404
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // Try next port
        server = null;
        startBridgeServer(port + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });

    server.listen(port, () => {
      serverPort = port;
      logger.info(`Command bridge server started on port ${port}`);
      resolve(port);
    });
  });
}

/**
 * Stop the bridge server
 */
export function stopBridgeServer(): void {
  if (server) {
    server.close();
    server = null;
    logger.info('Command bridge server stopped');
  }
}

/**
 * Get the current server port
 */
export function getBridgePort(): number | null {
  return server ? serverPort : null;
}

/**
 * Generate the Figma plugin code that connects to the bridge
 */
function generatePluginCode(port: number): string {
  return `
// Figma MCP Bridge Plugin
// Auto-generated - connects to MCP command bridge

const BRIDGE_URL = 'http://localhost:${port}';
const POLL_INTERVAL = 1000; // ms

let isRunning = false;

// Command handlers
const handlers = {
  create_page: async (params) => {
    const page = figma.createPage();
    page.name = params.name || 'New Page';
    return { pageId: page.id, name: page.name };
  },
  
  rename_page: async (params) => {
    const page = figma.root.children.find(p => p.id === params.pageId || p.name === params.oldName);
    if (!page) throw new Error('Page not found');
    page.name = params.name;
    return { pageId: page.id, name: page.name };
  },
  
  delete_page: async (params) => {
    const page = figma.root.children.find(p => p.id === params.pageId || p.name === params.name);
    if (!page) throw new Error('Page not found');
    if (figma.root.children.length <= 1) throw new Error('Cannot delete last page');
    page.remove();
    return { deleted: true };
  },
  
  move_node: async (params) => {
    const node = await figma.getNodeByIdAsync(params.nodeId);
    if (!node) throw new Error('Node not found');
    
    let target;
    if (params.targetPageId) {
      target = figma.root.children.find(p => p.id === params.targetPageId || p.name === params.targetPageName);
    } else if (params.targetNodeId) {
      target = await figma.getNodeByIdAsync(params.targetNodeId);
    }
    
    if (!target) throw new Error('Target not found');
    if ('appendChild' in target) {
      target.appendChild(node);
      return { moved: true, newParent: target.id };
    }
    throw new Error('Target cannot contain children');
  },
  
  rename_node: async (params) => {
    const node = await figma.getNodeByIdAsync(params.nodeId);
    if (!node) throw new Error('Node not found');
    node.name = params.name;
    return { nodeId: node.id, name: node.name };
  },
  
  delete_node: async (params) => {
    const node = await figma.getNodeByIdAsync(params.nodeId);
    if (!node) throw new Error('Node not found');
    node.remove();
    return { deleted: true };
  },
  
  create_frame: async (params) => {
    const frame = figma.createFrame();
    frame.name = params.name || 'Frame';
    frame.resize(params.width || 100, params.height || 100);
    if (params.x !== undefined) frame.x = params.x;
    if (params.y !== undefined) frame.y = params.y;
    
    if (params.parentId) {
      const parent = await figma.getNodeByIdAsync(params.parentId);
      if (parent && 'appendChild' in parent) {
        parent.appendChild(frame);
      }
    }
    
    return { nodeId: frame.id, name: frame.name };
  },
  
  create_component: async (params) => {
    let component;
    
    if (params.fromNodeId) {
      const node = await figma.getNodeByIdAsync(params.fromNodeId);
      if (!node) throw new Error('Source node not found');
      if (node.type === 'FRAME' || node.type === 'GROUP') {
        component = figma.createComponentFromNode(node);
      } else {
        throw new Error('Can only create component from frame or group');
      }
    } else {
      component = figma.createComponent();
      component.resize(params.width || 100, params.height || 100);
    }
    
    if (params.name) component.name = params.name;
    return { componentId: component.id, name: component.name };
  },
  
  create_style: async (params) => {
    let style;
    
    switch (params.styleType) {
      case 'paint':
      case 'fill':
        style = figma.createPaintStyle();
        if (params.color) {
          style.paints = [{
            type: 'SOLID',
            color: {
              r: (params.color.r || 0) / 255,
              g: (params.color.g || 0) / 255,
              b: (params.color.b || 0) / 255
            }
          }];
        }
        break;
      case 'text':
        style = figma.createTextStyle();
        if (params.fontSize) style.fontSize = params.fontSize;
        if (params.fontFamily) {
          await figma.loadFontAsync({ family: params.fontFamily, style: params.fontStyle || 'Regular' });
          style.fontName = { family: params.fontFamily, style: params.fontStyle || 'Regular' };
        }
        break;
      case 'effect':
        style = figma.createEffectStyle();
        break;
      case 'grid':
        style = figma.createGridStyle();
        break;
      default:
        throw new Error('Invalid style type');
    }
    
    style.name = params.name || 'New Style';
    return { styleId: style.id, name: style.name };
  },
  
  group_nodes: async (params) => {
    const nodes = [];
    for (const id of params.nodeIds) {
      const node = await figma.getNodeByIdAsync(id);
      if (node && 'parent' in node) nodes.push(node);
    }
    
    if (nodes.length === 0) throw new Error('No valid nodes to group');
    
    const group = figma.group(nodes, nodes[0].parent);
    if (params.name) group.name = params.name;
    
    return { groupId: group.id, name: group.name };
  },
  
  ungroup_node: async (params) => {
    const node = await figma.getNodeByIdAsync(params.nodeId);
    if (!node || node.type !== 'GROUP') throw new Error('Node is not a group');
    
    const parent = node.parent;
    const children = [...node.children];
    
    for (const child of children) {
      if (parent && 'appendChild' in parent) {
        parent.appendChild(child);
      }
    }
    
    node.remove();
    return { ungrouped: true, childCount: children.length };
  },
  
  set_property: async (params) => {
    const node = await figma.getNodeByIdAsync(params.nodeId);
    if (!node) throw new Error('Node not found');
    
    for (const [key, value] of Object.entries(params.properties || {})) {
      if (key in node) {
        (node as any)[key] = value;
      }
    }
    
    return { nodeId: node.id, updated: Object.keys(params.properties || {}) };
  },
  
  batch: async (params) => {
    const results = [];
    for (const cmd of params.commands || []) {
      if (handlers[cmd.type]) {
        try {
          const result = await handlers[cmd.type](cmd.params);
          results.push({ type: cmd.type, success: true, result });
        } catch (e) {
          results.push({ type: cmd.type, success: false, error: e.message });
        }
      }
    }
    return { batchResults: results };
  }
};

// Poll for commands
async function pollCommands() {
  if (!isRunning) return;
  
  try {
    const response = await fetch(BRIDGE_URL + '/commands');
    const data = await response.json();
    
    for (const cmd of data.commands) {
      console.log('Executing command:', cmd.type, cmd.id);
      
      try {
        const handler = handlers[cmd.type];
        if (!handler) {
          throw new Error('Unknown command type: ' + cmd.type);
        }
        
        const result = await handler(cmd.params);
        
        // Report success
        await fetch(BRIDGE_URL + '/commands/' + cmd.id + '/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ result })
        });
        
        figma.notify('✓ ' + cmd.type);
        
      } catch (error) {
        // Report failure
        await fetch(BRIDGE_URL + '/commands/' + cmd.id + '/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: error.message })
        });
        
        figma.notify('✗ ' + cmd.type + ': ' + error.message, { error: true });
      }
    }
    
  } catch (e) {
    // Bridge not available, silent retry
  }
  
  // Poll again
  setTimeout(pollCommands, POLL_INTERVAL);
}

// UI message handler
figma.ui.onmessage = (msg) => {
  if (msg.type === 'start') {
    isRunning = true;
    pollCommands();
    figma.notify('🔗 Connected to MCP Bridge');
  } else if (msg.type === 'stop') {
    isRunning = false;
    figma.notify('⏹ Disconnected from MCP Bridge');
  }
};

// Show UI
figma.showUI(__html__, { width: 300, height: 200 });
`;
}

/**
 * Generate the full plugin package (manifest + code + UI)
 */
export function generatePluginPackage(port: number): { manifest: string; code: string; ui: string } {
  return {
    manifest: JSON.stringify({
      name: "Figma MCP Bridge",
      id: "figma-mcp-bridge",
      api: "1.0.0",
      main: "code.js",
      ui: "ui.html",
      capabilities: [],
      enableProposedApi: false,
      editorType: ["figma"],
      documentAccess: "dynamic-page",
      networkAccess: {
        allowedDomains: ["localhost"],
        reasoning: "Connect to local MCP command bridge server"
      }
    }, null, 2),
    
    code: generatePluginCode(port),
    
    ui: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Inter, sans-serif;
      padding: 16px;
      margin: 0;
      background: #2c2c2c;
      color: #fff;
    }
    h2 { margin: 0 0 16px 0; font-size: 14px; font-weight: 600; }
    .status {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .status.connected { background: #1e3a29; border: 1px solid #30a46c; }
    .status.disconnected { background: #3a1e1e; border: 1px solid #e5484d; }
    button {
      width: 100%;
      padding: 10px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 8px;
    }
    .btn-primary { background: #0d99ff; color: #fff; }
    .btn-primary:hover { background: #0b87e0; }
    .btn-secondary { background: #3c3c3c; color: #fff; }
    .btn-secondary:hover { background: #4a4a4a; }
    .info { font-size: 11px; color: #888; margin-top: 12px; }
  </style>
</head>
<body>
  <h2>🔗 MCP Bridge</h2>
  <div id="status" class="status disconnected">
    ⏹ Disconnected
  </div>
  <button id="connectBtn" class="btn-primary" onclick="connect()">
    Connect to MCP
  </button>
  <button id="disconnectBtn" class="btn-secondary" onclick="disconnect()" style="display:none;">
    Disconnect
  </button>
  <div class="info">
    Bridge URL: http://localhost:${port}<br>
    Commands will execute automatically when connected.
  </div>
  
  <script>
    let connected = false;
    
    function connect() {
      parent.postMessage({ pluginMessage: { type: 'start' } }, '*');
      connected = true;
      updateUI();
    }
    
    function disconnect() {
      parent.postMessage({ pluginMessage: { type: 'stop' } }, '*');
      connected = false;
      updateUI();
    }
    
    function updateUI() {
      document.getElementById('status').className = 'status ' + (connected ? 'connected' : 'disconnected');
      document.getElementById('status').textContent = connected ? '🟢 Connected to MCP' : '⏹ Disconnected';
      document.getElementById('connectBtn').style.display = connected ? 'none' : 'block';
      document.getElementById('disconnectBtn').style.display = connected ? 'block' : 'none';
    }
  </script>
</body>
</html>`
  };
}
