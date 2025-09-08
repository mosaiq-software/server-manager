import { WorkerNode, WorkerStatus } from '@mosaiq/nsm-common/types';
import { getAllWorkerNodesModel, createWorkerNodeModel, updateWorkerNodeModel, deleteWorkerNodeModel, getWorkerNodeByIdModel } from '@/persistence/workerPersistence';
import { generate32CharKey } from './projectController';
import { createWorkerStatusModel, WorkerStatusModelType } from '@/persistence/workerStatusPersistence';

export const getAllWorkerNodes = async (): Promise<WorkerNode[]> => {
    const workerNodes = await getAllWorkerNodesModel();
    return workerNodes;
};

export const getWorkerNodeById = async (workerId: string): Promise<WorkerNode | undefined> => {
    const workerNode = await getWorkerNodeByIdModel(workerId);
    return workerNode ?? undefined;
};

export const createWorkerNode = async (workerId: string, address: string, port: number): Promise<WorkerNode> => {
    const allWNs = await getAllWorkerNodesModel();
    for (const wn of allWNs) {
        if (wn.workerId === workerId) {
            throw new Error(`WorkerNode with id ${workerId} already exists`);
        }
        if (wn.address === address) {
            throw new Error(`WorkerNode with address ${address} already exists`);
        }
    }
    const wn: WorkerNode = {
        workerId: workerId,
        address: address,
        port: port,
        authToken: generate32CharKey(),
    };
    await createWorkerNodeModel(wn);
    return wn;
};

export const updateWorkerNode = async (workerId: string, updates: Partial<WorkerNode>): Promise<void> => {
    await updateWorkerNodeModel(workerId, updates);
};

export const deleteWorkerNode = async (workerId: string): Promise<void> => {
    await deleteWorkerNodeModel(workerId);
};

export const regenerateWorkerNodeKey = async (workerId: string): Promise<string> => {
    const newKey = generate32CharKey();
    await updateWorkerNodeModel(workerId, { authToken: newKey });
    return newKey;
};

export const logWorkerNodeStatus = async (workerId: string, status: WorkerStatus): Promise<void> => {
    const workerNode = await getWorkerNodeById(workerId);
    if (!workerNode) {
        throw new Error(`WorkerNode with id ${workerId} not found`);
    }
    const currentStatus = workerNode.status;
    if (currentStatus === status) {
        return;
    }
    await updateWorkerNode(workerId, { status });
    const statusEntry: WorkerStatusModelType = {
        id: crypto.randomUUID(),
        workerId,
        status,
        created: Date.now(),
    };
    await createWorkerStatusModel(statusEntry);
};
