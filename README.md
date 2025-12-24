<div align="center">

# Figma MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-green.svg)](https://modelcontextprotocol.io/)
[![Figma API](https://img.shields.io/badge/Figma%20API-v0.35-purple.svg)](https://www.figma.com/developers/api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A comprehensive MCP server providing AI assistants with full access to the Figma REST API**

*46 tools: 38 atomic API tools + 8 orchestration tools with domain-based actions.*

[Quick Start](#quick-start) • [Features](#features) • [Tools](#available-tools) • [Orchestration](#orchestration-tools) • [Configuration](#configuration)

</div>

---

## Quick Start

```bash
# Clone and setup
git clone https://github.com/devstroop/figma-mcp.git
cd figma-mcp
npm install

# Configure
cp .env.example .env
# Edit .env and add your FIGMA_TOKEN

# Build and run
npm run build
npm start
```

**Remote mode** (SSE transport for hosted deployments):
```bash
npm run start:remote      # Starts on http://localhost:3001
curl http://localhost:3001/health
```

---

## Features

| Category | Description | Tools |
|----------|-------------|-------|
| 📄 **Files** | Get file JSON, specific nodes, images, versions, and metadata | 6 |
| 💬 **Comments** | Full comment lifecycle with reaction support | 6 |
| 🧩 **Components** | Team/file components and component sets | 6 |
| 🎨 **Styles** | Published styles from files and teams | 3 |
| 📁 **Projects** | Browse team projects and files | 2 |
| 🔢 **Variables** | Design tokens management (Enterprise) | 3 |
| 🔗 **Webhooks** | Create, manage, and monitor webhooks | 5 |
| 🔧 **Dev Resources** | Link code references to design nodes | 4 |
| 📊 **Analytics** | Library usage analytics for components, styles, variables | 6 |
| 👤 **Users** | Authenticated user information | 1 |
| 🚀 **Orchestration** | Domain-based tools with multiple actions per tool | 8 |

**Total: 46 tools** — 38 atomic API tools + 8 orchestration tools

---

## Installation

### Prerequisites

- **Node.js** 18+ 
- **npm** or yarn
- **Figma Personal Access Token** ([Get one here](#getting-a-figma-token))

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/devstroop/figma-mcp.git
cd figma-mcp

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
```

Edit `.env` with your credentials:
```env
FIGMA_TOKEN=figd_xxxxxxxxxxxxxxxxxxxxx
FIGMA_TEAM_ID=123456789              # Optional: default team
FIGMA_FILE_KEY=abc123XYZ             # Optional: default file
```

```bash
# 4. Build and run
npm run build
npm start
```

### Getting a Figma Token

1. Log in to [Figma](https://figma.com)
2. Go to **Settings** → **Account** → **Personal access tokens**
3. Click **Generate new token**
4. Give it a descriptive name and copy the token

---

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FIGMA_TOKEN` | ✅ | — | Figma personal access token |
| `FIGMA_TEAM_ID` | ❌ | — | Default team ID for team operations |
| `FIGMA_FILE_KEY` | ❌ | — | Default file key for file operations |
| `PORT` | ❌ | `3001` | Server port (remote mode) |
| `MCP_BASE_PATH` | ❌ | `/mcp` | Base path for SSE endpoints |
| `LOG_LEVEL` | ❌ | `info` | `debug` \| `info` \| `warn` \| `error` |

---

## MCP Client Integration

### Claude Desktop

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "figma": {
      "command": "node",
      "args": ["/path/to/figma-mcp/dist/index.js"],
      "env": {
        "FIGMA_TOKEN": "figd_your_token_here"
      }
    }
  }
}
```

### VS Code (Copilot/MCP Extension)

Add to your VS Code `settings.json` or workspace settings:

```json
{
  "mcp.servers": {
    "figma": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"],
      "env": {
        "FIGMA_TOKEN": "figd_your_token_here"
      }
    }
  }
}
```

### Remote/SSE Mode

For hosted deployments, web integrations, or shared access:

```bash
npm run start:remote   # Starts SSE server
```

Connect via SSE:
```json
{
  "mcpServers": {
    "figma": {
      "type": "sse",
      "url": "http://localhost:3001/mcp/sse"
    }
  }
}
```

---

## Available Tools

### 📄 Files (6 tools)

| Tool | Description |
|------|-------------|
| `figma_get_file` | Get complete file JSON with nodes, components, and styles |
| `figma_get_file_nodes` | Get specific nodes by ID with optional geometry |
| `figma_get_images` | Export nodes as PNG, JPG, SVG, or PDF |
| `figma_get_image_fills` | Get download URLs for images used in fills |
| `figma_get_file_versions` | Get version history of a file |
| `figma_get_file_meta` | Get file metadata (name, last modified, thumbnail) |

### 💬 Comments (6 tools)

| Tool | Description |
|------|-------------|
| `figma_get_comments` | Get all comments on a file |
| `figma_post_comment` | Add a new comment or reply |
| `figma_delete_comment` | Delete a comment |
| `figma_get_comment_reactions` | Get reactions on a comment |
| `figma_post_comment_reaction` | Add an emoji reaction to a comment |
| `figma_delete_comment_reaction` | Remove a reaction from a comment |

### 🧩 Components (6 tools)

| Tool | Description |
|------|-------------|
| `figma_get_team_components` | Get all published components in a team library |
| `figma_get_file_components` | Get components published from a file |
| `figma_get_component` | Get a single component by key |
| `figma_get_team_component_sets` | Get all component sets in a team library |
| `figma_get_file_component_sets` | Get component sets from a file |
| `figma_get_component_set` | Get a single component set by key |

### 🎨 Styles (3 tools)

| Tool | Description |
|------|-------------|
| `figma_get_team_styles` | Get all published styles in a team library |
| `figma_get_file_styles` | Get styles published from a file |
| `figma_get_style` | Get a single style by key |

### 📁 Projects (2 tools)

| Tool | Description |
|------|-------------|
| `figma_get_team_projects` | List all projects in a team |
| `figma_get_project_files` | List all files in a project |

### 🔢 Variables (3 tools) — *Enterprise*

| Tool | Description |
|------|-------------|
| `figma_get_local_variables` | Get all local variables in a file |
| `figma_get_published_variables` | Get published variables from a library |
| `figma_post_variables` | Create, update, or delete variables |

### 🔗 Webhooks (5 tools)

| Tool | Description |
|------|-------------|
| `figma_get_webhooks` | List all webhooks for a team |
| `figma_get_webhook` | Get details of a specific webhook |
| `figma_create_webhook` | Create a new webhook subscription |
| `figma_update_webhook` | Update webhook configuration |
| `figma_delete_webhook` | Delete a webhook |
| `figma_get_webhook_requests` | Get recent webhook delivery requests |

### 🔧 Dev Resources (4 tools)

| Tool | Description |
|------|-------------|
| `figma_get_dev_resources` | Get code links attached to nodes |
| `figma_create_dev_resource` | Attach a code link to a node |
| `figma_update_dev_resource` | Update an existing dev resource |
| `figma_delete_dev_resource` | Remove a dev resource |

### 📊 Library Analytics (6 tools)

| Tool | Description |
|------|-------------|
| `figma_get_component_actions` | Get usage actions for components |
| `figma_get_component_usages` | Get files using specific components |
| `figma_get_style_actions` | Get usage actions for styles |
| `figma_get_style_usages` | Get files using specific styles |
| `figma_get_variable_actions` | Get usage actions for variables |
| `figma_get_variable_usages` | Get files using specific variables |

### 👤 Users (1 tool)

| Tool | Description |
|------|-------------|
| `figma_get_me` | Get the authenticated user's profile |

---

## Orchestration Tools

Domain-based tools that combine multiple API calls with flexible actions. Each tool covers a specific domain and supports multiple operations via the `action` parameter.

### 🔍 figma_inspect

Inspect and analyze Figma files, nodes, and document structure.

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `snapshot` | Get file overview with optional components/styles/variables | `fileKey`, `depth`, `includeComponents`, `includeStyles`, `includeVariables` |
| `nodes` | Get specific nodes by ID | `fileKey`, `nodeIds`, `geometry` |
| `properties` | Extract dev-ready node properties | `fileKey`, `nodeIds` |
| `tree` | Get document hierarchy | `fileKey`, `depth`, `maxChildren` |
| `compare` | Compare file with branch or version | `fileKey`, `branchKey` or `versionId` |

### 💬 figma_feedback

Manage comments and reactions for design review workflows.

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `threads` | Get all comment threads with filters | `fileKey`, `asMarkdown`, `after` |
| `create` | Post a new comment | `fileKey`, `message`, `clientMeta` |
| `reply` | Reply to existing comment | `fileKey`, `commentId`, `message` |
| `resolve` | Mark comment as resolved | `fileKey`, `commentId` |
| `react` | Add emoji reaction | `fileKey`, `commentId`, `emoji` |
| `delete` | Delete comment or reaction | `fileKey`, `commentId`, `emoji` |

### 📦 figma_assets

Export and manage design assets in multiple formats.

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `export` | Export single node | `fileKey`, `nodeId`, `format`, `scale` |
| `batch` | Export multiple nodes in multiple formats/scales | `fileKey`, `nodeIds`, `formats`, `scales` |
| `list` | Find exportable nodes in file | `fileKey`, `types` |
| `fill_images` | Get image fill URLs | `fileKey` |

### 🎨 figma_tokens

Design token management and export.

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `list` | List all variables in file | `fileKey`, `collectionId` |
| `collections` | Get variable collections | `fileKey` |
| `modes` | Get collection modes | `fileKey`, `collectionId` |
| `export` | Export tokens as CSS/SCSS/JSON/Tailwind | `fileKey`, `format`, `collectionIds`, `modeIds` |
| `diff` | Compare tokens between files | `fileKey`, `compareFileKey` |

### 🗂️ figma_navigate

Navigate team structure, projects, and files.

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `projects` | List team projects | `teamId` |
| `files` | List files in project | `teamId`, `projectId`, `branchData` |
| `branches` | Get file branches | `fileKey` |
| `versions` | Get file version history | `fileKey` |
| `search` | Search for files/projects | `teamId`, `query` |

### 📊 figma_analytics

Library analytics and health audits.

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `library` | Get library overview | `fileKey` or `teamId`, `type` |
| `usage` | Get component/style usage data | `fileKey`, `componentKey` or `styleKey` |
| `audit` | Health check with recommendations | `fileKey` or `teamId`, `type` |
| `actions` | Get library action history | `fileKey`, `cursor` |

### 🔗 figma_code_connect

Manage dev resources (code links) attached to nodes.

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `list` | Get dev resources | `fileKey`, `nodeIds` |
| `create` | Create code link | `fileKey`, `nodeId`, `url`, `name` |
| `update` | Update existing link | `fileKey`, `devResourceId`, `url`, `name` |
| `delete` | Remove code link | `fileKey`, `devResourceId` |

### 🔔 figma_webhooks

Webhook subscription management.

| Action | Description | Key Parameters |
|--------|-------------|----------------|
| `list` | List team webhooks | `teamId` |
| `create` | Create webhook subscription | `teamId`, `endpoint`, `events`, `passcode` |
| `delete` | Remove webhook | `webhookId` |
| `requests` | Get recent webhook deliveries | `webhookId` |

### When to Use Orchestration vs Atomic Tools

| Scenario | Recommended | Why |
|----------|-------------|-----|
| Quick file lookup | `figma_get_file` (atomic) | Simple, single operation |
| Design review workflow | `figma_feedback` (orchestration) | Threads + create + react in one tool |
| Export one image | `figma_get_images` (atomic) | Direct and simple |
| Export multiple formats/scales | `figma_assets` (orchestration) | Batch all combinations |
| Check one component | `figma_get_component` (atomic) | Targeted retrieval |
| Audit entire library | `figma_analytics` (orchestration) | Full audit with usage stats |
| Get file structure | `figma_inspect` (orchestration) | Rich snapshot with optional includes |

---

## Usage Examples

**Get file structure:**
```
"Show me the structure of Figma file abc123xyz"
→ Uses figma_get_file
```

**Export designs:**
```
"Export frames 1:23 and 1:45 from file xyz as 2x PNG"
→ Uses figma_get_images with scale: 2, format: "png"
```

**Batch export for handoff:**
```
"Export button-primary as PNG at 1x, 2x, 3x and SVG"
→ Uses figma_assets with action: "batch", formats: ["png", "svg"], scales: [1, 2, 3]
```

**Browse component library:**
```
"List all button components in team 123456"
→ Uses figma_get_team_components
```

**Full library audit:**
```
"Audit the design library in team 123456 and show usage stats"
→ Uses figma_analytics with action: "audit"
```

**Manage comments:**
```
"Add a comment 'Needs more contrast' to node 4:56 in file abc123"
→ Uses figma_feedback with action: "create"
```

**Complete design review:**
```
"Review file abc123, show me comments, and add feedback 'Great work!'"
→ Uses figma_feedback with action: "threads" then action: "create"
```

**Check library usage:**
```
"Which files are using the primary button component?"
→ Uses figma_analytics with action: "usage"
```

**Export design tokens:**
```
"Export all design tokens from file xyz as CSS variables"
→ Uses figma_tokens with action: "export", format: "css"
```

---

## Architecture

```
figma-mcp/
├── src/
│   ├── index.ts              # Entry point (stdio transport)
│   ├── remote.ts             # SSE transport server
│   ├── server-core.ts        # MCP server with 46 tool handlers
│   ├── config.ts             # Environment configuration
│   ├── logger.ts             # Structured logging
│   │
│   ├── api/
│   │   ├── base/
│   │   │   ├── base-client.ts       # Axios HTTP client with auth
│   │   │   ├── response-formatter.ts # MCP response formatting
│   │   │   └── error-handler.ts     # Error normalization
│   │   │
│   │   ├── domains/
│   │   │   ├── files-api.ts         # File operations
│   │   │   ├── comments-api.ts      # Comments & reactions
│   │   │   ├── components-api.ts    # Components & styles
│   │   │   ├── projects-api.ts      # Projects & team files
│   │   │   ├── variables-api.ts     # Variables (Enterprise)
│   │   │   ├── webhooks-api.ts      # Webhook management
│   │   │   ├── users-api.ts         # User info
│   │   │   ├── dev-resources-api.ts # Dev resources
│   │   │   └── analytics-api.ts     # Library analytics
│   │   │
│   │   └── client-factory.ts    # Creates all API clients
│   │
│   └── tools/
│       ├── tool-definitions.ts  # MCP tool schemas (46 tools)
│       └── orchestration/       # Domain-based orchestration tools
│           ├── types.ts             # Shared interfaces
│           ├── inspect.ts           # File inspection (5 actions)
│           ├── feedback.ts          # Comments & reactions (6 actions)
│           ├── assets.ts            # Asset export (4 actions)
│           ├── tokens.ts            # Design tokens (5 actions)
│           ├── navigate.ts          # Project navigation (5 actions)
│           ├── analytics.ts         # Library analytics (4 actions)
│           ├── code-connect.ts      # Dev resources (4 actions)
│           └── webhooks.ts          # Webhook management (4 actions)
│
├── dist/                     # Compiled output
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Development

```bash
npm install          # Install dependencies
npm run dev          # Watch mode with auto-rebuild
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript validation
```

### Adding a New Tool

1. **Add API method** in `src/api/domains/<domain>-api.ts`
2. **Define tool schema** in `src/tools/tool-definitions.ts`
3. **Add handler** in `src/server-core.ts` (`handleToolCall` method)
4. **Export** from `src/api/domains/index.ts` if new domain

---

## API Coverage

| Figma API Section | Coverage | Notes |
|-------------------|----------|-------|
| Files | ✅ 100% | All endpoints |
| Comments | ✅ 100% | Including reactions |
| Components | ✅ 100% | Including component sets |
| Styles | ✅ 100% | All endpoints |
| Projects | ✅ 100% | Team projects and files |
| Variables | ✅ 100% | Enterprise feature |
| Webhooks | ✅ 100% | Full CRUD + requests |
| Dev Resources | ✅ 100% | Full CRUD |
| Library Analytics | ✅ 100% | Components, styles, variables |
| Users | ✅ 100% | Get current user |
| Activity Logs | ❌ | Requires Organization OAuth2 |
| Payments | ❌ | Plugin monetization only |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [Devstroop Technologies](https://devstroop.com)**

[Figma API Docs](https://www.figma.com/developers/api) • [MCP Protocol](https://modelcontextprotocol.io/) • [Report Issue](https://github.com/devstroop/figma-mcp/issues)

</div>
