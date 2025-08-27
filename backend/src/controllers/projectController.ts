import { createProjectModel, getAllProjectsModel, getProjectByIdModel, ProjectModelType, updateProjectModel } from '@/persistence/projectPersistence';
import { DeploymentState, Project } from '@mosaiq/nsm-common/types';
import { execSync } from 'child_process';


export const deployProject = async (projectId: string): Promise<void> => {
    try {
        const project = await getProjectByIdModel(projectId);
        if (!project) throw new Error('Project not found');

        // Get the repository loaded into the working directory
        const webappsDir = process.env.WEBAPPS_PATH;
        execSync(`cd ${webappsDir}`);
        const dirExists = execSync(`test -d ./${projectId} && echo true`).toString().trim();
        console.log('Directory exists:', dirExists);
        if(dirExists === 'true') {
            execSync(`rm -rf ${webappsDir}/${projectId}`);
        }
        execSync(`git clone ${project.repositoryUrl} ${webappsDir}/${projectId}`);
        execSync(`cd ${webappsDir}/${projectId}`);

        // Run the deployment command
        const deploymentStdout = execSync(project.runCommand).toString().trim();
        console.log('Deployment output:', deploymentStdout);

    } catch (error) {
        console.error('Error deploying project:', error);
    }
};

export const getProject = async (projectId: string) => {
    const projectData = await getProjectByIdModel(projectId);
    if (!projectData) return undefined;

    const project: Project = {
        id: projectData.id,
        repositoryUrl: projectData.repositoryUrl,
        runCommand: projectData.runCommand,
        deploymentKey: projectData.deploymentKey,
        state: projectData.state,
        createdAt: projectData.createdAt,
        updatedAt: projectData.updatedAt
    }

    return project;
};

export const getAllProjects = async (): Promise<{ id: string; repositoryUrl: string; state: DeploymentState }[]> => {
    const projectsData = await getAllProjectsModel();
    return projectsData.map(projectData => ({
        id: projectData.id,
        repositoryUrl: projectData.repositoryUrl,
        state: projectData.state,
    }));
};

export const createProject = async (id:string, repoUrl: string, runCommand: string) => {
    try {
        const newProject: ProjectModelType = {
            id: id,
            repositoryUrl: repoUrl,
            runCommand: runCommand,
            deploymentKey: generateDeploymentKey(),
            state: DeploymentState.READY,
        };
        await createProjectModel(id, newProject);
    } catch (error) {
        console.error('Error creating project:', error);
        return null;
    }
};

export const updateProject = async (id:string, repoUrl?: string, runCommand?: string) => {
    try {
        await updateProjectModel(id, { repositoryUrl: repoUrl, runCommand: runCommand });
    } catch (error) {
        console.error('Error updating project:', error);
        return null;
    }
};

export const verifyDeploymentKey = async (projectId: string, key: string): Promise<boolean> => {
    const project = await getProjectByIdModel(projectId);
    if (!project) return false;
    return project.deploymentKey === key;
};

export const resetDeploymentKey = async (projectId: string): Promise<string | null> => {
    const project = await getProjectByIdModel(projectId);
    if (!project) return null;

    const newKey = generateDeploymentKey();
    await updateProjectModel(projectId, { deploymentKey: newKey });
    return newKey;
};

const generateDeploymentKey = (): string => {
    return crypto.randomUUID().replace(/-/g, "");
};