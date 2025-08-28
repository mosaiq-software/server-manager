import { createProjectModel, getAllProjectsModel, getProjectByIdModel, ProjectModelType, updateProjectModel } from '@/persistence/projectPersistence';
import { executeCommandOnHost } from '@/utils/hostExecutor';
import { DeploymentState, Project } from '@mosaiq/nsm-common/types';
import { execSync } from 'child_process';


export const deployProject = async (projectId: string): Promise<void> => {
    try {
        const project = await getProjectByIdModel(projectId);
        if (!project) throw new Error('Project not found');

        if(process.env.PRODUCTION !== 'true') {
            console.log('Not in production mode, skipping GitHub fingerprint application');
            return;
        }

        // Get the repository loaded into the working directory
        const webappsDir = process.env.WEBAPPS_PATH;
        try {
            execSync(`cd ${webappsDir}`);
        } catch (error) {
            console.error('Error changing directory:', error);
            return;
        }
        let dirExists = false;
        try {
            const stdout = execSync(`test -d ./${projectId} && echo true`).toString().trim();
            dirExists = stdout === "true";
        } catch (e) {
            dirExists = false;
        }
        if(!dirExists) {
            try{
                execSync(`rm -rf ${webappsDir}/${projectId}`);
            } catch (e) {
                console.error('Error removing directory:', e);
                return;
            }
        }

        try {
            execSync(`git clone -c core.sshCommand="/usr/bin/ssh -i /webapps/.ssh/id_ed25519" ${project.repositoryUrl} ${webappsDir}/${projectId}`);
        } catch (e) {
            console.error('Error cloning repository:', e);
            return;
        }

        // Run the deployment command
        const deploymentCommand = `cd ${webappsDir}/${projectId} && ${project.runCommand}`;
        try{
            const deploymentStdout = executeCommandOnHost(deploymentCommand);
            console.log('Deployment output:', deploymentStdout);

        } catch (e) {
            console.error('Error running deployment command:',deploymentCommand, e);
            return;
        }
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