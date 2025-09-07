import { getStatusByServiceInstanceIdModel } from '@/persistence/statusPersistence';
import { getProject } from './projectController';
import { getAllProjectsModel } from '@/persistence/projectPersistence';

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
