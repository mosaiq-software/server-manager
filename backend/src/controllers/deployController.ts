import { createDeploymentLogModel, updateDeploymentLogModel } from '@/persistence/deploymentLogPersistence';
import { getProjectByIdModel, updateProjectModelNoDirty } from '@/persistence/projectPersistence';
import { DeploymentState } from '@mosaiq/nsm-common/types';
import { WORKER_BODY, WORKER_ROUTES } from '@mosaiq/nsm-common/workerRoutes';
import { getDotenvForProject } from './secretController';
import { getWorkerNodeById } from './workerNodeController';

const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const deployProject = async (projectId: string): Promise<string | undefined> => {
    let logId: string | undefined;
    try {
        const project = await getProjectByIdModel(projectId);
        if (!project) throw new Error('Project not found');

        if (project.state === DeploymentState.DEPLOYING) {
            return undefined;
        }

        if (!project.workerNodeId) {
            throw new Error('No worker node assigned to project');
        }

        logId = await createDeploymentLogModel(projectId, 'Starting deployment...\n', DeploymentState.DEPLOYING, project.workerNodeId);

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
        await workerNodePost(project.workerNodeId, WORKER_ROUTES.POST_DEPLOY_PROJECT, body);
    } catch (error: any) {
        console.error('Error deploying project:', error);
        if (logId) {
            await updateDeploymentLog(logId, DeploymentState.FAILED, `Error deploying project: ${error.message}\n`);
        }
    }
    return logId;
};

async function workerNodePost<T extends WORKER_ROUTES>(wnId: string, ep: T, body: WORKER_BODY[T]) {
    //TODO handle distributing calls across to other worker nodes?
    const wn = await getWorkerNodeById(wnId);
    if (!wn) throw new Error(`WorkerNode with id ${wnId} not found`);
    const url = `${wn.address}${ep}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `${wn.authToken}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Worker error: ${res.status} - ${text}`);
    }
}

export const updateDeploymentLog = async (logId: string, status: DeploymentState, logText: string) => {
    await updateDeploymentLogModel(logId, { status, log: logText });
    await updateProjectModelNoDirty(logId, { state: status });
};
