import { getProject } from './projectController';
import { getAllProjectsModel } from '@/persistence/projectPersistence';
import { getAllWorkerNodes, logWorkerNodeStatus } from './workerNodeController';
import { ControlPlaneStatus, DockerContainerData, DockerStatus, WorkerNode, WorkerStatus } from '@mosaiq/nsm-common/types';
import { workerNodePost } from '@/utils/workerAPI';
import { WORKER_ROUTES } from '@mosaiq/nsm-common/workerRoutes';
import { createStatusModel, getStatusByServiceInstanceIdModel, StatusModelType } from '@/persistence/serviceStatusPersistence';
import { getAllActiveServices } from './projectInstanceController';
import { NSM_LABEL_SERVICE_INSTANCE_ID } from './deployController';
import { getServiceInstanceByIdModel, updateServiceInstanceModel } from '@/persistence/serviceInstancePersistence';
import { getLastCpHeartbeatModel, updateCpHeartbeatModel } from '@/persistence/controlPlaneHeartbeatPersistence';
import { createControlPlaneStatusModelLog, getAllControlPlaneStatusesModel } from '@/persistence/controlPlaneStatusPersistence';

export const CONTROL_PLANE_HEARTBEAT_INTERVAL_MINS = 1;
const CONTROL_PLANE_HEARTBEAT_TOLERANCE_MINS = 0.5;

export const getStatusForProject = async (projectId: string) => {
    const statuses = await getStatusByServiceInstanceIdModel(projectId);
    const sorted = statuses.sort((a, b) => b.created - a.created);
    return sorted;
};

export const logContainerStatusesForAllWorkers = async () => {
    const workerNodes = await getAllWorkerNodes();
    const allActiveServices = await getAllActiveServices();

    for (const wn of workerNodes) {
        try {
            const res = await workerNodePost(wn.workerId, WORKER_ROUTES.POST_LIST_CONTAINERS, undefined);
            if (!res) {
                await logWorkerNodeStatus(wn.workerId, WorkerStatus.ONLINE_ERROR);
                continue;
            }
            await logWorkerNodeStatus(wn.workerId, WorkerStatus.ONLINE_STABLE);
            const containers = res.containers;
            for (const container of containers) {
                const serviceInstanceIdLabel = container.Labels[NSM_LABEL_SERVICE_INSTANCE_ID];
                if (serviceInstanceIdLabel && allActiveServices.find((svc) => svc.instanceId === serviceInstanceIdLabel)) {
                    await logServiceStatus(container, serviceInstanceIdLabel);
                }
            }
        } catch (error) {
            console.error(`Error getting container statuses for worker ${wn}:`, error);
            await logWorkerNodeStatus(wn.workerId, WorkerStatus.UNREACHABLE);
            continue;
        }
    }
};

const logServiceStatus = async (containerData: DockerContainerData, serviceInstanceId: string) => {
    const containerStatus = containerData.State as DockerStatus;
    const serviceInstance = await getServiceInstanceByIdModel(serviceInstanceId);
    if (!serviceInstance) {
        console.warn(`Service instance with ID ${serviceInstanceId} not found.`);
        return;
    }
    if (serviceInstance.actualContainerState === containerStatus) {
        return;
    }
    await updateServiceInstanceModel(serviceInstanceId, {
        actualContainerState: containerStatus,
        containerId: containerData.ID,
    });
    const statusType: StatusModelType = {
        id: crypto.randomUUID(),
        serviceInstanceId: serviceInstanceId,
        uriStatus: undefined,
        dockerStatus: containerStatus,
        created: Date.now(),
    };
    await createStatusModel(statusType);
};

export const handleControlPlaneHeartbeat = async () => {
    const heartbeatMs = CONTROL_PLANE_HEARTBEAT_INTERVAL_MINS * 60 * 1000;
    const heartbeatToleranceMs = CONTROL_PLANE_HEARTBEAT_TOLERANCE_MINS * 60 * 1000;
    try {
        const lastSeen = await getLastCpHeartbeatModel();
        const now = Date.now();
        if (lastSeen) {
            const lastExpected = now - heartbeatMs;
            const lastExpectedMin = lastExpected - heartbeatToleranceMs;
            const lastExpectedMax = lastExpected + heartbeatToleranceMs;
            if (lastSeen < lastExpectedMin || lastSeen > lastExpectedMax) {
                console.warn(`Control plane heartbeat missed. Expected around ${new Date(lastExpected).toISOString()}, last seen at ${new Date(lastSeen).toISOString()}`);
                await createControlPlaneStatusModelLog(lastSeen, now); // log the outage
            }
        }
        await updateCpHeartbeatModel();
    } catch (error) {
        console.error('Error handling control plane heartbeat:', error);
    }
};

export const getControlPlaneStatus = async () => {
    const lastSeen = await getLastCpHeartbeatModel();
    const incidents = await getAllControlPlaneStatusesModel();
    const status: ControlPlaneStatus = {
        lastHeartbeat: lastSeen || 0,
        containerLog: '',
        incidents,
    };
    return status;
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
