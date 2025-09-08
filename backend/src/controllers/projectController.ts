import { createProjectModel, getAllProjectsModel, getProjectByIdModel, ProjectModelType, updateProjectModelNoDirty } from '@/persistence/projectPersistence';
import { DeploymentState, Project, ProjectInstanceHeader } from '@mosaiq/nsm-common/types';
import { applyRepoData, getAllSecretsForProject } from './secretController';
import { getRepoData } from '@/utils/repositoryUtils';
import { getProjectInstancesByProjectIdModel } from '@/persistence/projectInstancePersistence';

export const getProject = async (projectId: string) => {
    const projectData = await getProjectByIdModel(projectId);
    if (!projectData) return undefined;

    const secrets = await getAllSecretsForProject(projectId);
    const instances = (await getProjectInstancesByProjectIdModel(projectId)).sort((a, b) => b.created - a.created);
    const instanceHeaders: ProjectInstanceHeader[] = instances.map((inst) => ({
        id: inst.id,
        projectId: inst.projectId,
        workerNodeId: inst.workerNodeId,
        state: inst.state,
        created: inst.created,
        lastUpdated: inst.lastUpdated,
        active: inst.active,
    }));
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
        instances: instanceHeaders,
        allowCICD: projectData.allowCICD,
        dirtyConfig: projectData.dirtyConfig,
        timeout: projectData.timeout,
        nginxConfig: JSON.parse(projectData.nginxConfigJson),
        dockerCompose: JSON.parse(projectData.dockerComposeJson),
        services: JSON.parse(projectData.servicesJson),
        workerNodeId: projectData.workerNodeId,
        hasDockerCompose: projectData.hasDockerCompose,
        hasDotenv: projectData.hasDotenv,
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
            nginxConfigJson: JSON.stringify({ servers: [] }),
            dockerComposeJson: JSON.stringify({ services: {} }),
            servicesJson: JSON.stringify([]),
        };
        await createProjectModel(project.id, newProject);

        const createdProject = await syncProjectToRepoData(project.id);
        if (!createdProject) throw new Error('Failed to retrieve created project');
        return createdProject;
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
};

export const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
        const nginxConfigJson = updates.nginxConfig ? JSON.stringify(updates.nginxConfig) : undefined;
        delete updates.nginxConfig;
        const dockerComposeJson = updates.dockerCompose ? JSON.stringify(updates.dockerCompose) : undefined;
        delete updates.dockerCompose;
        const servicesJson = updates.services ? JSON.stringify(updates.services) : undefined;
        delete updates.services;
        await updateProjectModelNoDirty(id, { dirtyConfig: true, ...updates, nginxConfigJson, dockerComposeJson, servicesJson });
    } catch (error) {
        console.error('Error updating project:', error);
        return null;
    }
};

export const syncProjectToRepoData = async (projectId: string): Promise<Project | undefined> => {
    const project = await getProjectByIdModel(projectId);
    if (!project) {
        throw new Error('Project not found');
    }

    const repoData = await getRepoData(project.id, project.repoOwner, project.repoName, project.repoBranch);
    if (!repoData) {
        throw new Error('Failed to retrieve repository data');
    }
    await applyRepoData(repoData, project.id);
    const updatedProject = await getProject(projectId);
    return updatedProject;
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
