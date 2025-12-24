import { BaseAPIClient, MCPResponse, ResponseFormatter, ErrorHandler } from '../base/index.js';

export interface GetTeamProjectsParams {
  teamId: string;
}

export interface GetProjectFilesParams {
  projectId: string;
  branchData?: boolean;
}

/**
 * Projects API Client - Handles team and project operations
 * Endpoints: /v1/teams, /v1/projects
 */
export class ProjectsAPIClient extends BaseAPIClient {
  /**
   * Get team projects - Returns projects in a team
   */
  async getTeamProjects(params: GetTeamProjectsParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/teams/${params.teamId}/projects`
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Projects retrieved for team ${params.teamId}`,
        { teamId: params.teamId }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getTeamProjects(${params.teamId})`);
    }
  }

  /**
   * Get project files - Returns files in a project
   */
  async getProjectFiles(params: GetProjectFilesParams): Promise<MCPResponse> {
    try {
      const response = await this.get<unknown>(
        `/v1/projects/${params.projectId}/files`,
        { branch_data: params.branchData }
      );

      return ResponseFormatter.formatSuccess(
        response,
        `Files retrieved for project ${params.projectId}`,
        { projectId: params.projectId }
      );
    } catch (error) {
      return ErrorHandler.handle(error, `getProjectFiles(${params.projectId})`);
    }
  }
}
