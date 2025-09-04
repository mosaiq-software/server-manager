import { createProjectModel, getAllProjectsModel, getProjectByIdModel, ProjectModelType, updateProjectModelNoDirty } from '@/persistence/projectPersistence';
import { DeploymentState, Project } from '@mosaiq/nsm-common/types';
import { applyDotenv, getAllSecretsForProject } from './secretController';
import { getAllDeploymentLogs } from '@/persistence/deploymentLogPersistence';
import { getRepoData } from '@/utils/repositoryUtils';

export const getProject = async (projectId: string) => {
    const projectData = await getProjectByIdModel(projectId);
    if (!projectData) return undefined;

    const secrets = await getAllSecretsForProject(projectId);
    const deployLogs = (await getAllDeploymentLogs(projectId))
        .map((log) => ({
            ...log,
            log: '',
        }))
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

    const project: Project = {
        id: projectData.id,
        repoOwner: projectData.repoOwner,
        repoName: projectData.repoName,
        repoBranch: projectData.repoBranch,
        deploymentKey: projectData.deploymentKey,
        state: projectData.state,
        createdAt: projectData.createdAt,
        updatedAt: projectData.updatedAt,
        secrets: secrets,
        deployLogs: deployLogs,
        allowCICD: projectData.allowCICD,
        dirtyConfig: projectData.dirtyConfig,
        timeout: projectData.timeout,
        nginxConfig: projectData.nginxConfigJson ? JSON.parse(projectData.nginxConfigJson) : undefined,
        workerNodeId: projectData.workerNodeId,
    };

    return project;
};

export const getAllProjects = async (): Promise<Project[]> => {
    const projectsData = await getAllProjectsModel();
    const projects = [];
    for (const projectData of projectsData) {
        projects.push((await getProject(projectData.id)) as Project);
    }
    return projects;
};

export const createProject = async (project: Project) => {
    try {
        const newProject: ProjectModelType = {
            id: project.id,
            repoOwner: project.repoOwner,
            repoName: project.repoName,
            repoBranch: project.repoBranch,
            deploymentKey: generate32CharKey(),
            state: DeploymentState.READY,
            allowCICD: !!project.allowCICD,
            dirtyConfig: false,
            nginxConfigJson: JSON.stringify({}),
        };
        await createProjectModel(project.id, newProject);

        const repoData = await getRepoData(project.id, project.repoOwner, project.repoName);
        applyDotenv(repoData.dotenv, project.id);
    } catch (error) {
        console.error('Error creating project:', error);
        return null;
    }
};

export const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
        const nginxConfigJson = updates.nginxConfig ? JSON.stringify(updates.nginxConfig) : undefined;
        delete updates.nginxConfig;
        await updateProjectModelNoDirty(id, { dirtyConfig: true, ...updates, nginxConfigJson });
    } catch (error) {
        console.error('Error updating project:', error);
        return null;
    }
};

export const verifyDeploymentKey = async (projectId: string, key: string, fromWeb: boolean): Promise<boolean> => {
    const project = await getProjectByIdModel(projectId);
    if (!project) return false;
    if (!fromWeb && !project.allowCICD) return false;
    return project.deploymentKey === key;
};

export const resetDeploymentKey = async (projectId: string): Promise<string | null> => {
    const project = await getProjectByIdModel(projectId);
    if (!project) return null;

    const newKey = generate32CharKey();
    await updateProject(projectId, { deploymentKey: newKey });
    return newKey;
};

export const generate32CharKey = (): string => {
    return crypto.randomUUID().replace(/-/g, '');
};
