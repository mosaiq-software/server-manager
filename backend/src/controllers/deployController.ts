import { createDeploymentLogModel, updateDeploymentLogModel } from '@/persistence/deploymentLogPersistence';
import { getProjectByIdModel, updateProjectModelNoDirty } from '@/persistence/projectPersistence';
import { DeployableProject, DeploymentState, NginxConfigLocationType, Project } from '@mosaiq/nsm-common/types';
import { WORKER_BODY, WORKER_RESPONSE, WORKER_ROUTES } from '@mosaiq/nsm-common/workerRoutes';
import { getDotenvForProject } from './secretController';
import { getWorkerNodeById } from './workerNodeController';
import { getProject } from './projectController';
import { workerNodePost } from '@/utils/workerAPI';

const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const deployProject = async (projectId: string): Promise<string | undefined> => {
    let logId: string | undefined;
    try {
        const project = await getProject(projectId);
        if (!project) throw new Error('Project not found');

        if (project.state === DeploymentState.DEPLOYING) {
            return undefined;
        }

        if (!project.workerNodeId) {
            throw new Error('No worker node assigned to project');
        }

        logId = await createDeploymentLogModel(projectId, 'Starting deployment...\n', DeploymentState.DEPLOYING, project.workerNodeId);

        const requestedPorts = await requestPortsForProject(project);

        const dotenv = await getDotenvForProject(projectId);

        const runCommand = `docker compose -p ${project.id} up --build -d`;
        const body: DeployableProject = {
            projectId: project.id,
            runCommand: runCommand,
            repoName: project.repoName,
            repoOwner: project.repoOwner,
            repoBranch: project.repoBranch,
            timeout: project.timeout || DEFAULT_TIMEOUT,
            logId: logId,
            dotenv: dotenv,
        };
        await workerNodePost(project.workerNodeId, WORKER_ROUTES.POST_DEPLOY_PROJECT, body);
    } catch (error: any) {
        console.error('Error deploying project:', error);
        if (logId) {
            await updateDeploymentLog(logId, DeploymentState.FAILED, `Error deploying project: ${error.message}\n`);
        }
    }
    return logId;
};

export const updateDeploymentLog = async (logId: string, status: DeploymentState, logText: string) => {
    await updateDeploymentLogModel(logId, { status, log: logText });
    await updateProjectModelNoDirty(logId, { state: status });
};

const requestPortsForProject = async (project: Project) => {
    if (!project.workerNodeId) {
        throw new Error('No worker node assigned to project');
    }

    let proxyCount = 0;
    for (const server of project.nginxConfig?.servers || []) {
        proxyCount += server.locations.filter((l) => l.type === NginxConfigLocationType.PROXY).length;
    }
    if (!proxyCount) {
        return [];
    }

    const ports = await workerNodePost(project.workerNodeId, WORKER_ROUTES.POST_FIND_NEXT_FREE_PORTS, { count: proxyCount });
    if (!ports) {
        throw new Error('Error calling worker node for ports');
    }
    if (!ports.ports) {
        throw new Error('No ports remaining on worker node');
    }
    return ports.ports;
};
