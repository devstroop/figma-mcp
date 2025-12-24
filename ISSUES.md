# Figma MCP Server - Known Issues & Gaps

> This document tracks identified limitations, gaps, and potential improvements for the Figma MCP Server.

---

## ✅ SOLVED: Design Modifications via Plugin Bridge

### Problem
The Figma REST API is **read-only** for document structure. Cannot programmatically modify designs.

### Solution: Command Bridge Architecture

We implemented a **Plugin + HTTP Bridge** pattern:

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  MCP Server │────▶│  Command Bridge  │◀────│  Figma Plugin   │
│  (commands) │     │  (HTTP server)   │     │  (executes)     │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

**How it works:**
1. MCP queues design commands via `figma_bridge` tool
2. HTTP bridge server stores commands in memory
3. Figma plugin polls the bridge for pending commands
4. Plugin executes commands using Figma's Plugin API (full write access)
5. Plugin reports completion/failure back to bridge

**New tool: `figma_bridge`**

| Action | Description |
|--------|-------------|
| `start` | Start the HTTP bridge server (default port 3847) |
| `stop` | Stop the bridge server |
| `status` | Check server status and command queue |
| `queue` | Add design modification commands |
| `clear` | Clear pending commands |
| `plugin` | Get plugin installation instructions and code |

**Supported Commands:**
- `create_page`, `rename_page`, `delete_page`
- `move_node`, `rename_node`, `delete_node`
- `create_frame`, `create_component`, `create_style`
- `group_nodes`, `ungroup_node`
- `set_property`
- `batch` (multiple commands)

---

## 🚫 API Limitations (Figma REST API)

### Critical: No Write Access to Design Documents

The Figma REST API is **read-only** for document structure. Cannot programmatically:

| Operation | Status | Impact |
|-----------|--------|--------|
| Create/rename pages | ❌ Not supported | Cannot reorganize file structure |
| Move nodes between pages | ❌ Not supported | Cannot automate cleanup |
| Rename layers/frames | ❌ Not supported | Cannot fix naming conventions |
| Create components | ❌ Not supported | Cannot componentize designs |
| Create/apply styles | ❌ Not supported | Cannot enforce design systems |
| Delete elements | ❌ Not supported | Cannot remove orphaned nodes |
| Group/ungroup elements | ❌ Not supported | Cannot organize hierarchies |
| Modify properties (color, size, position) | ❌ Not supported | Cannot make design changes |

**Workaround:** Build a Figma Plugin (uses Plugin API which has full write access)

---

### Enterprise-Only Features

| Feature | Endpoint | Status |
|---------|----------|--------|
| Create/Update Variables | `POST /v1/files/:key/variables` | ⚠️ Enterprise only |
| Variable Collections | Write operations | ⚠️ Enterprise only |
| Branching (create/merge) | Branch management | ⚠️ Enterprise/Org only |

**Note:** `figma_post_variables` tool was removed due to VS Code MCP extension validation bug with array schemas.

---

## 🐛 Known Bugs

### 1. VS Code MCP Extension - Array Schema Validation

**Status:** 🔴 Active (External bug)

**Description:** VS Code's MCP extension incorrectly validates array schemas, even when `items` property is correctly defined.

**Error:**
```
array type must have items
```

**Affected Tool:** `figma_post_variables` (removed as workaround)

**Schema that fails validation:**
```typescript
variableChanges: {
  type: 'array',
  items: {
    type: 'object',
    properties: { /* ... */ }
  }
}
```

**Workaround:** Remove tools with complex nested array schemas until VS Code fixes the bug.

---

## 📋 Feature Gaps

### 1. No Design System Audit Tool

**Priority:** 🟡 Medium

**Description:** Need a comprehensive tool to audit design system health:
- Identify inconsistent colors (similar but not identical)
- Find text styles that should be unified
- Detect spacing inconsistencies
- Report accessibility issues (contrast ratios)

---

### 2. No Batch Export with Smart Naming

**Priority:** 🟢 Low

**Description:** Current export generates files but lacks:
- Automatic naming based on layer hierarchy
- Platform-specific exports (iOS @2x/@3x, Android mdpi/hdpi/etc.)
- Manifest/index file generation

---

### 3. No Diff Visualization

**Priority:** 🟡 Medium

**Description:** `figma_inspect` has `compare` action but only returns JSON diff. Need:
- Visual diff rendering
- Side-by-side comparison export
- Change summary report

---

### 4. No Component Usage Recommendations

**Priority:** 🟡 Medium

**Description:** Can detect component usage but cannot:
- Suggest which elements should become components
- Identify duplicate patterns that could be unified
- Recommend component variants

---

## 🔧 Potential Improvements

### 1. Add Figma Plugin Generator

**Priority:** 🟢 High

**Description:** Since REST API can't modify designs, add a tool that generates Figma plugins for common tasks:
- File reorganization plugin
- Naming convention enforcer
- Component creator
- Style extractor/applier

---

### 2. Add AI-Powered Analysis

**Priority:** 🟡 Medium

**Description:** Integrate with AI to provide:
- Design system recommendations
- Accessibility suggestions
- UX pattern recognition
- Naming suggestions for generic frames

---

### 3. Add Code Generation Tools

**Priority:** 🟡 Medium

**Description:** Generate code from Figma designs:
- React/Vue/Svelte components
- CSS/Tailwind styles
- Design token exports (already partial)

---

### 4. Add Webhook Event Handlers

**Priority:** 🟢 Low

**Description:** Current webhook tools only manage webhooks. Add:
- Event processor templates
- Common automation patterns (Slack notifications, GitHub issues, etc.)

---

## 📊 Tool Coverage Matrix

| Domain | Read | Write | Notes |
|--------|------|-------|-------|
| Files & Documents | ✅ Full | ❌ None | Can read, cannot modify |
| Comments | ✅ Full | ✅ Full | Full CRUD support |
| Components | ✅ Full | ❌ None | Can read metadata only |
| Styles | ✅ Full | ❌ None | Can read, cannot create |
| Variables | ✅ Full | ⚠️ Enterprise | Write requires Enterprise |
| Images/Exports | ✅ Full | N/A | Export-only operation |
| Projects/Teams | ✅ Full | ❌ None | Navigation only |
| Webhooks | ✅ Full | ✅ Full | Full CRUD support |
| Dev Resources | ✅ Full | ✅ Full | Full CRUD support |
| Users | ✅ Read | N/A | Read current user only |

---

## � File Analysis: Frontend (fT3zY6SaCMwDOUbhsCr1dZ)

> Last analyzed: 2025-12-24

### File Overview

| Metric | Value |
|--------|-------|
| File Name | Frontend |
| Total Nodes | 1,440 |
| Pages | 2 (Page 1, ICONS) |
| Health Score | 80/100 |
| Components | ~10 (embedded) |
| Styles | 0 |
| Variables | 0 |

### Structure Analysis

#### Page 1 - Main Content
Contains a mix of:
- **Desktop Frames** (3 instances) - Website layouts
- **Dashboard Frames** (3 instances) - Admin/dashboard UIs  
- **Mobile Frames** (Android Large) - Mobile app designs
- **Components Section** - Contains reusable elements
- **Docs Section** - Text documentation/specs
- **Various Logo Assets** - Multiple brand logos (Devstroop, ERP, Buckit, IRCTCX, etc.)
- **Miscellaneous Assets** - Icons, markers, UI elements

#### Page 2 - ICONS
- Icon grid with various vector icons (30+ icons)

### 🔴 Critical Issues Found

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| No fill/color styles | Inconsistent colors across 1,440 nodes | Create color palette as Figma styles |
| No text styles | Typography inconsistency | Define heading/body text styles |
| No variable collections | Cannot use design tokens | Create variables for colors, spacing |
| Poor naming conventions | Frames named "Frame 1", "Frame 2", etc. | Rename with semantic names |
| Mixed content on Page 1 | Hard to navigate, cluttered | Split into multiple pages by project |

### 🟡 Organization Issues

1. **Page 1 is overloaded** - Contains:
   - Multiple unrelated projects (Buckit, IRCTCX, Tripbuk, etc.)
   - Test designs mixed with production assets
   - Logo variations scattered throughout
   - Documentation text mixed with designs

2. **Generic frame naming** - Most frames have auto-generated names:
   - `Frame 1` through `Frame 222+`
   - `Vector` repeated many times
   - `Rectangle 1`, `Rectangle 2`, etc.

3. **No component organization**:
   - Components embedded in main canvas
   - No component sets with variants
   - `ElevatedButton`, `BottomAppBar` should be in component library

4. **Duplicate elements**:
   - Multiple `Desktop` frames (some components, some frames)
   - Multiple logo variations not organized
   - Repeated icon instances

### 📁 Suggested Organization Structure

```
📄 Frontend File
├── 📑 🏠 Homepage
│   ├── Desktop Layout
│   ├── Tablet Layout
│   └── Mobile Layout
├── 📑 📊 Dashboard
│   ├── Overview
│   ├── Analytics
│   └── Settings
├── 📑 🧩 Components
│   ├── Buttons
│   ├── Navigation
│   ├── Cards
│   └── Forms
├── 📑 🎨 Brand Assets
│   ├── Devstroop Logos
│   ├── Project Logos (Buckit, IRCTCX, etc.)
│   └── Icons
├── 📑 🎨 Style Guide
│   ├── Colors
│   ├── Typography
│   └── Spacing
└── 📑 📝 Documentation
    └── Specs & Notes
```

---

## ⚠️ MCP Tool Gaps Discovered During Analysis

### 1. Cannot Reorganize Files (Critical)

**Problem:** The analysis identified severe organization issues but MCP cannot fix them.

**Blocked Operations:**
- ❌ Create new pages ("Homepage", "Dashboard", "Components")
- ❌ Move nodes between pages
- ❌ Rename generic "Frame X" to semantic names
- ❌ Delete orphaned/test elements
- ❌ Group related elements into sections

**Workaround:** Use `figma_bridge` tool with Figma plugin to execute:
```javascript
// Example commands (via bridge)
{ type: "create_page", params: { name: "🏠 Homepage" } }
{ type: "rename_node", params: { nodeId: "3:86", name: "Desktop - Homepage" } }
{ type: "move_node", params: { nodeId: "246:32", targetPageId: "new-page-id" } }
```

### 2. Cannot Create Styles from Analysis

**Problem:** Audit identified missing color/text styles but cannot create them.

**What's Needed:**
- Analyze existing colors in file → Create style recommendations
- Tool to generate styles programmatically

### 3. Cannot Detect Duplicate Colors

**Problem:** File likely has many similar-but-not-identical colors, but no tool to detect them.

**Recommendation:** Add color analysis tool that:
- Extracts all colors from file
- Clusters similar colors
- Recommends consolidation

### 4. No Semantic Naming Suggestions

**Problem:** 200+ frames named "Frame X" need semantic names.

**Recommendation:** Add AI-powered naming tool that:
- Analyzes frame content/context
- Suggests meaningful names
- Batch renames with approval

---

## 🗓️ Changelog

### 2025-12-24
- Analyzed Frontend file (fT3zY6SaCMwDOUbhsCr1dZ)
- Identified 1,440 nodes, 0 styles, 0 variables
- Health score: 80/100
- Documented critical organization issues
- Identified 4 new MCP tool gaps
- Created suggested organization structure

### 2024-12-24
- Initial documentation created
- Identified REST API write limitations
- Documented VS Code MCP extension array schema bug
- Listed feature gaps and improvement opportunities

---

## 📝 Contributing

When adding new issues:
1. Categorize appropriately (API Limitation, Bug, Gap, Improvement)
2. Include priority (🔴 Critical, 🟡 Medium, 🟢 Low)
3. Provide workarounds if available
4. Update the changelog
