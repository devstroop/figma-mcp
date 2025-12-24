/**
 * Navigate Tool - Explore teams, projects, files, branches
 * 
 * Actions:
 * - projects: List projects in a team
 * - files: List files in a project
 * - branches: List branches for a file
 * - versions: List version history for a file
 * - search: Search across team files
 */

import { ClientFactory } from '../../api/client-factory.js';
import { ResponseFormatter } from '../../api/base/response-formatter.js';
import { MCPResponse } from '../../api/base/index.js';
import { NavigateParams, NavigateResult } from './types.js';

export class NavigateTool {
  constructor(private clientFactory: ClientFactory) {}

  async execute(params: NavigateParams): Promise<MCPResponse> {
    const { action } = params;

    switch (action) {
      case 'projects':
        return this.listProjects(params);
      case 'files':
        return this.listFiles(params);
      case 'branches':
        return this.listBranches(params);
      case 'versions':
        return this.listVersions(params);
      case 'search':
        return this.searchFiles(params);
      default:
        return ResponseFormatter.formatError(`Unknown action: ${action}. Use: projects, files, branches, versions, search`);
    }
  }

  private async listProjects(params: NavigateParams): Promise<MCPResponse> {
    const { teamId } = params;

    if (!teamId) {
      return ResponseFormatter.formatError('teamId required for projects action');
    }

    const projectsClient = this.clientFactory.createProjectsClient();

    try {
      const resp = await projectsClient.getTeamProjects({ teamId });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      const projects = data['data']?.['projects'] || [];

      const result: NavigateResult = {
        action: 'projects',
        teamId,
        projects: projects.map((p: Record<string, unknown>) => ({
          id: p['id'],
          name: p['name']
        })),
        summary: {
          count: projects.length
        }
      };

      return ResponseFormatter.formatSuccess(result, `${projects.length} projects in team`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`List projects failed: ${err.message}`, error);
    }
  }

  private async listFiles(params: NavigateParams): Promise<MCPResponse> {
    const { teamId, projectId, includeMetadata, maxResults = 50 } = params;

    if (!projectId && !teamId) {
      return ResponseFormatter.formatError('projectId or teamId required for files action');
    }

    const projectsClient = this.clientFactory.createProjectsClient();
    const filesClient = this.clientFactory.createFilesClient();

    try {
      let files: unknown[] = [];

      if (projectId) {
        // Get files from specific project
        const resp = await projectsClient.getProjectFiles({ projectId });
        const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
        files = data['data']?.['files'] || [];
      } else if (teamId) {
        // Get all files from team (requires fetching projects first)
        const projResp = await projectsClient.getTeamProjects({ teamId });
        const projData = projResp['content']?.[0]?.['text'] ? JSON.parse(projResp['content'][0]['text']) : {};
        const projects = projData['data']?.['projects'] || [];

        for (const proj of projects) {
          const p = proj as Record<string, unknown>;
          const filesResp = await projectsClient.getProjectFiles({ projectId: p['id'] as string });
          const filesData = filesResp['content']?.[0]?.['text'] ? JSON.parse(filesResp['content'][0]['text']) : {};
          const projFiles = filesData['data']?.['files'] || [];
          
          files.push(...projFiles.map((f: Record<string, unknown>) => ({
            ...f,
            projectId: p['id'],
            projectName: p['name']
          })));

          if (files.length >= maxResults) break;
        }
      }

      // Limit results
      files = files.slice(0, maxResults);

      // Optionally fetch metadata for each file
      if (includeMetadata && files.length <= 10) {
        const enrichedFiles: unknown[] = [];
        for (const file of files) {
          const f = file as Record<string, unknown>;
          try {
            const metaResp = await filesClient.getFile({ fileKey: f['key'] as string, depth: 0 });
            const metaData = metaResp['content']?.[0]?.['text'] ? JSON.parse(metaResp['content'][0]['text']) : {};
            enrichedFiles.push({
              ...f,
              lastModified: metaData['data']?.['lastModified'],
              version: metaData['data']?.['version'],
              thumbnailUrl: metaData['data']?.['thumbnailUrl']
            });
          } catch {
            enrichedFiles.push(f);
          }
        }
        files = enrichedFiles;
      }

      const result: NavigateResult = {
        action: 'files',
        teamId,
        projectId,
        files,
        summary: {
          count: files.length,
          hasMore: files.length >= maxResults
        }
      };

      return ResponseFormatter.formatSuccess(result, `${files.length} files`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`List files failed: ${err.message}`, error);
    }
  }

  private async listBranches(params: NavigateParams): Promise<MCPResponse> {
    const { fileKey } = params;

    if (!fileKey) {
      return ResponseFormatter.formatError('fileKey required for branches action');
    }

    const filesClient = this.clientFactory.createFilesClient();

    try {
      // Get file to check if it has branches
      const fileResp = await filesClient.getFile({ fileKey, depth: 0 });
      const fileData = fileResp['content']?.[0]?.['text'] ? JSON.parse(fileResp['content'][0]['text']) : {};
      
      // Note: Figma API branch listing may require specific endpoint
      // This is a placeholder - actual implementation depends on API
      const branches = fileData['data']?.['branches'] || [];

      const result: NavigateResult = {
        action: 'branches',
        fileKey,
        branches: branches.map((b: Record<string, unknown>) => ({
          key: b['key'],
          name: b['name'],
          thumbnailUrl: b['thumbnail_url']
        })),
        summary: {
          count: branches.length
        }
      };

      return ResponseFormatter.formatSuccess(result, `${branches.length} branches`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`List branches failed: ${err.message}`, error);
    }
  }

  private async listVersions(params: NavigateParams): Promise<MCPResponse> {
    const { fileKey, maxResults = 30 } = params;

    if (!fileKey) {
      return ResponseFormatter.formatError('fileKey required for versions action');
    }

    const filesClient = this.clientFactory.createFilesClient();

    try {
      const resp = await filesClient.getFileVersions({ fileKey });
      const data = resp['content']?.[0]?.['text'] ? JSON.parse(resp['content'][0]['text']) : {};
      let versions = data['data']?.['versions'] || [];

      // Limit results
      versions = versions.slice(0, maxResults);

      const result: NavigateResult = {
        action: 'versions',
        fileKey,
        versions: versions.map((v: Record<string, unknown>) => ({
          id: v['id'],
          label: v['label'],
          description: v['description'],
          createdAt: v['created_at'],
          user: v['user']
        })),
        summary: {
          count: versions.length,
          hasMore: versions.length >= maxResults
        }
      };

      return ResponseFormatter.formatSuccess(result, `${versions.length} versions`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`List versions failed: ${err.message}`, error);
    }
  }

  private async searchFiles(params: NavigateParams): Promise<MCPResponse> {
    const { teamId, query, maxResults = 20 } = params;

    if (!teamId) {
      return ResponseFormatter.formatError('teamId required for search action');
    }

    if (!query) {
      return ResponseFormatter.formatError('query required for search action');
    }

    const projectsClient = this.clientFactory.createProjectsClient();

    try {
      // Get all files from team and filter by query
      const projResp = await projectsClient.getTeamProjects({ teamId });
      const projData = projResp['content']?.[0]?.['text'] ? JSON.parse(projResp['content'][0]['text']) : {};
      const projects = projData['data']?.['projects'] || [];

      const matchingFiles: unknown[] = [];
      const queryLower = query.toLowerCase();

      for (const proj of projects) {
        const p = proj as Record<string, unknown>;
        const filesResp = await projectsClient.getProjectFiles({ projectId: p['id'] as string });
        const filesData = filesResp['content']?.[0]?.['text'] ? JSON.parse(filesResp['content'][0]['text']) : {};
        const projFiles = filesData['data']?.['files'] || [];

        for (const file of projFiles) {
          const f = file as Record<string, unknown>;
          const name = (f['name'] as string || '').toLowerCase();
          
          if (name.includes(queryLower)) {
            matchingFiles.push({
              ...f,
              projectId: p['id'],
              projectName: p['name']
            });
          }

          if (matchingFiles.length >= maxResults) break;
        }

        if (matchingFiles.length >= maxResults) break;
      }

      const result: NavigateResult = {
        action: 'search',
        teamId,
        searchResults: matchingFiles,
        summary: {
          count: matchingFiles.length,
          hasMore: matchingFiles.length >= maxResults
        }
      };

      return ResponseFormatter.formatSuccess(result, `Found ${matchingFiles.length} files matching "${query}"`);
    } catch (error: unknown) {
      const err = error as Error;
      return ResponseFormatter.formatError(`Search files failed: ${err.message}`, error);
    }
  }
}
