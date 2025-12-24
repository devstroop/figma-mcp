// Figma MCP Bridge Plugin
// Auto-generated - connects to MCP command bridge

let BRIDGE_URL = 'http://localhost:3847';
const POLL_INTERVAL = 1000; // ms

let isRunning = false;
const executingCommands = new Set(); // Track commands being executed to prevent duplicates

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
        node[key] = value;
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
      // Skip if already executing this command
      if (executingCommands.has(cmd.id)) {
        continue;
      }
      
      // Mark as executing to prevent duplicate runs
      executingCommands.add(cmd.id);
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
      } finally {
        // Remove from executing set after a delay to ensure server has processed
        setTimeout(() => executingCommands.delete(cmd.id), 5000);
      }
    }
    
  } catch (e) {
    // Bridge not available, silent retry
  }
  
  // Poll again
  setTimeout(pollCommands, POLL_INTERVAL);
}

// Check connection to bridge
async function checkConnection(url) {
  try {
    const response = await fetch(url + '/health', { method: 'GET' });
    if (!response.ok) throw new Error('Bad response');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// UI message handler
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'start') {
    const url = msg.bridgeUrl || BRIDGE_URL;
    
    // Check if bridge is actually reachable
    const check = await checkConnection(url);
    
    if (!check.success) {
      figma.notify('❌ Connection refused - is bridge running on ' + url + '?', { error: true });
      figma.ui.postMessage({ type: 'connection_failed', error: 'Connection refused' });
      return;
    }
    
    BRIDGE_URL = url;
    isRunning = true;
    executingCommands.clear(); // Clear any stale command tracking
    pollCommands();
    figma.notify('🔗 Connected to MCP Bridge at ' + BRIDGE_URL);
    figma.ui.postMessage({ type: 'connection_success' });
    
  } else if (msg.type === 'stop') {
    isRunning = false;
    executingCommands.clear();
    figma.notify('⏹ Disconnected from MCP Bridge');
    figma.ui.postMessage({ type: 'disconnected' });
  }
};

// Inline HTML UI
const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Inter, sans-serif; padding: 16px; margin: 0; background: #2c2c2c; color: #fff; }
    h2 { margin: 0 0 16px 0; font-size: 14px; font-weight: 600; }
    .status { padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 12px; }
    .status.connected { background: #1e3a29; border: 1px solid #30a46c; }
    .status.disconnected { background: #3a1e1e; border: 1px solid #e5484d; }
    button { width: 100%; padding: 10px; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; margin-bottom: 8px; }
    .btn-primary { background: #0d99ff; color: #fff; }
    .btn-primary:hover { background: #0b87e0; }
    .btn-secondary { background: #3c3c3c; color: #fff; }
    .btn-secondary:hover { background: #4a4a4a; }
    .info { font-size: 11px; color: #888; margin-top: 12px; }
    input { width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #444; background: #333; color: #fff; font-size: 11px; margin-top: 4px; box-sizing: border-box; }
  </style>
</head>
<body>
  <h2>🔗 MCP Bridge</h2>
  <div id="status" class="status disconnected">⏹ Disconnected</div>
  <button id="connectBtn" class="btn-primary" onclick="connect()">Connect to MCP</button>
  <button id="disconnectBtn" class="btn-secondary" onclick="disconnect()" style="display:none;">Disconnect</button>
  <div style="margin-bottom: 12px;">
    <label style="font-size: 11px; color: #aaa;">Bridge URL:</label>
    <input type="text" id="bridgeUrl" value="http://localhost:3848">
  </div>
  <div class="info">Commands will execute automatically when connected.</div>
  <script>
    let connected = false;
    let connecting = false;
    
    function connect() {
      if (connecting) return;
      connecting = true;
      const url = document.getElementById('bridgeUrl').value;
      document.getElementById('status').className = 'status disconnected';
      document.getElementById('status').textContent = '⏳ Connecting...';
      document.getElementById('connectBtn').disabled = true;
      parent.postMessage({ pluginMessage: { type: 'start', bridgeUrl: url } }, '*');
    }
    
    function disconnect() {
      parent.postMessage({ pluginMessage: { type: 'stop' } }, '*');
    }
    
    function updateUI() {
      document.getElementById('status').className = 'status ' + (connected ? 'connected' : 'disconnected');
      document.getElementById('status').textContent = connected ? '🟢 Connected to MCP' : '⏹ Disconnected';
      document.getElementById('connectBtn').style.display = connected ? 'none' : 'block';
      document.getElementById('connectBtn').disabled = false;
      document.getElementById('disconnectBtn').style.display = connected ? 'block' : 'none';
      document.getElementById('bridgeUrl').disabled = connected;
    }
    
    // Listen for connection status from plugin
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (!msg) return;
      
      connecting = false;
      
      if (msg.type === 'connection_success') {
        connected = true;
        updateUI();
      } else if (msg.type === 'connection_failed') {
        connected = false;
        document.getElementById('status').className = 'status disconnected';
        document.getElementById('status').textContent = '❌ Connection failed: ' + (msg.error || 'Unknown');
        document.getElementById('connectBtn').disabled = false;
      } else if (msg.type === 'disconnected') {
        connected = false;
        updateUI();
      }
    };
  </script>
</body>
</html>`;

// Show UI
figma.showUI(html, { width: 300, height: 240 });
