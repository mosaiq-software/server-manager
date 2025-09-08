import { getStatusByServiceInstanceIdModel } from '@/persistence/workerStatusPersistence';
import { getProject } from './projectController';
import { getAllProjectsModel } from '@/persistence/projectPersistence';
import { getAllWorkerNodes, logWorkerNodeStatus } from './workerNodeController';
import { RawDockerContainerData, WorkerNode, WorkerStatus } from '@mosaiq/nsm-common/types';
import { workerNodePost } from '@/utils/workerAPI';
import { WORKER_ROUTES } from '@mosaiq/nsm-common/workerRoutes';

export const getStatusForProject = async (projectId: string) => {
    const statuses = await getStatusByServiceInstanceIdModel(projectId);
    const sorted = statuses.sort((a, b) => b.epoch - a.epoch);
    return sorted;
};

export const handleAllHealthChecks = async () => {
    const allHealthCheckURIs = await getAllHealthcheckURIs();
    for (const projectHealthCheck of allHealthCheckURIs) {
        for (const uri of projectHealthCheck.uris) {
            const { status, latency } = await getUriHealth(uri);
            console.log(`Health check for ${uri}:`, status, `${latency}ms`);
        }
    }
};

const getAllHealthcheckURIs = async () => {
    const allProjectsModel = await getAllProjectsModel();
    const allHealthCheckURIs: { projectId: string; uris: string[] }[] = [];
    for (const project of allProjectsModel) {
        if (project.healthCheckURIsJson) {
            allHealthCheckURIs.push({
                projectId: project.id,
                uris: JSON.parse(project.healthCheckURIsJson),
            });
        }
    }
    return allHealthCheckURIs;
};

export const logContainerStatusesForAllWorkers = async () => {
    const workerNodes = await getAllWorkerNodes();
    for (const wn of workerNodes) {
        try {
            const res = await workerNodePost(wn.workerId, WORKER_ROUTES.POST_LIST_CONTAINERS, undefined);
            if (!res) {
                await logWorkerNodeStatus(wn.workerId, WorkerStatus.ONLINE_ERROR);
                continue;
            }
            await logWorkerNodeStatus(wn.workerId, WorkerStatus.ONLINE_STABLE);
            const containers = res.containers;
        } catch (error) {
            console.error(`Error getting container statuses for worker ${wn.workerId}:`, error);
            await logWorkerNodeStatus(wn.workerId, WorkerStatus.UNREACHABLE);
            continue;
        }
    }
};

const getUriHealth = async (uri: string) => {
    try {
        const startTime = Date.now();
        const response = await fetch(uri, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000),
        });
        const endTime = Date.now();
        const latency = endTime - startTime;
        const status = response.status;
        return { status, latency };
    } catch (error) {
        return { status: 502, latency: 0 };
    }
};
