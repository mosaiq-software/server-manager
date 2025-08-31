import { createDeploymentLogModel, updateDeploymentLogModel } from '@/persistence/deploymentLogPersistence';
import { getProjectByIdModel, updateProjectModel } from '@/persistence/projectPersistence';
import { DeploymentState } from '@mosaiq/nsm-common/types';
import { WORKER_BODY, WORKER_ROUTES } from '@mosaiq/nsm-common/workerRoutes';
import { getDotenvForProject } from './secretController';

const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const deployProject = async (projectId: string): Promise<string | undefined> => {
    let logId: string | undefined;
    try {
        const project = await getProjectByIdModel(projectId);
        if (!project) throw new Error('Project not found');

        logId = await createDeploymentLogModel(projectId, 'Starting deployment...\n', DeploymentState.DEPLOYING);

        const dotenv = await getDotenvForProject(project.id);

        const runCommand = `docker compose -p ${project.id} up --build -d`;

        const body: WORKER_BODY[WORKER_ROUTES.POST_DEPLOY_PROJECT] = {
            projectId: project.id,
            runCommand: runCommand,
            repoName: project.repoName,
            repoOwner: project.repoOwner,
            dotenv: dotenv,
            timeout: project.timeout || DEFAULT_TIMEOUT,
            logId: logId,
        };
        await workerNodePost(WORKER_ROUTES.POST_DEPLOY_PROJECT, body);
    } catch (error: any) {
        console.error('Error deploying project:', error);
        if (logId) {
            await updateDeploymentLogModel(logId, { log: `Error deploying project: ${error.message}\n`, status: DeploymentState.FAILED });
        }
    }
    return logId;
};

async function workerNodePost<T extends WORKER_ROUTES>(ep: T, body: WORKER_BODY[T]) {
    //TODO handle distributing calls across to other worker nodes?
    const url = `${process.env.WORKER_NODE_URL}${ep}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Worker error: ${res.status} - ${text}`);
    }
}

export const updateDeploymentLog = async (logId: string, status: DeploymentState, logText: string) => {
    return updateDeploymentLogModel(logId, { status, log: logText });
};
