import { useAPI } from '@/utils/api';
import { notifications } from '@mantine/notifications';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';
import { Project, WorkerNode } from '@mosaiq/nsm-common/types';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from './user-context';

type WorkerContextType = {
    workers: WorkerNode[];
    create: (worker: WorkerNode) => Promise<void>;
    update: (id: string, worker: Partial<WorkerNode>, clientOnly?: boolean) => Promise<void>;
    delete: (id: string) => Promise<void>;
    regenerateKey: (id: string) => Promise<void>;
    controlPlaneWorker?: WorkerNode;
};

const WorkerContext = createContext<WorkerContextType | undefined>(undefined);

const WorkerProvider: React.FC<any> = ({ children }) => {
    const api = useAPI();
    const [workers, setWorkers] = useState<WorkerNode[]>([]);

    useEffect(() => {
        const fetchWorkers = async () => {
            try {
                const response = await api.get(API_ROUTES.GET_WORKER_NODES, {});
                if (!response) {
                    return;
                }
                setWorkers(response);
            } catch (error) {
                notifications.show({
                    title: 'Error',
                    message: 'Failed to fetch workers',
                    color: 'red',
                });
            }
        };
        fetchWorkers();
    }, [api.token]);

    const handleCreateWorker = async (newWorker: WorkerNode) => {
        try {
            const createdWorker = await api.post(API_ROUTES.POST_CREATE_WORKER_NODE, {}, newWorker);
            if (!createdWorker) {
                throw new Error('Creation failed');
            }
            setWorkers((prev) => [...prev, createdWorker]);
            notifications.show({
                title: 'Success',
                message: 'Worker created successfully',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to create worker',
                color: 'red',
            });
        }
    };

    const handleUpdateWorker = async (id: string, updatedWorker: Partial<WorkerNode>, clientOnly?: boolean) => {
        try {
            if (!clientOnly) {
                await api.post(API_ROUTES.POST_UPDATE_WORKER_NODE, { workerId: id }, updatedWorker);
            }
            setWorkers((prev) => prev.map((worker) => (worker.workerId === id ? { ...worker, ...updatedWorker } : worker)));
            notifications.show({
                title: 'Success',
                message: 'Worker updated successfully',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to update worker',
                color: 'red',
            });
        }
    };

    const handleDeleteWorker = async (id: string) => {
        try {
            await api.post(API_ROUTES.POST_DELETE_WORKER_NODE, { workerId: id }, {});
            setWorkers((prev) => prev.filter((worker) => worker.workerId !== id));
            notifications.show({
                title: 'Success',
                message: 'Worker deleted successfully',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to delete worker',
                color: 'red',
            });
        }
    };

    const handleRegenWorkerKey = async (id: string) => {
        try {
            const newKey = await api.post(API_ROUTES.POST_REGENERATE_WORKER_NODE_KEY, { workerId: id }, {});
            if (!newKey) {
                throw new Error('Key regeneration failed');
            }
            setWorkers((prev) => prev.map((worker) => (worker.workerId === id ? { ...worker, authToken: newKey } : worker)));
            notifications.show({
                title: 'Success',
                message: 'Worker key regenerated successfully',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to regenerate worker key',
                color: 'red',
            });
        }
    };

    return (
        <WorkerContext.Provider
            value={{
                workers,
                create: handleCreateWorker,
                update: handleUpdateWorker,
                delete: handleDeleteWorker,
                regenerateKey: handleRegenWorkerKey,
                controlPlaneWorker: workers.find((w) => w.isControlPlaneWorker),
            }}
        >
            {children}
        </WorkerContext.Provider>
    );
};

const useWorkers = () => {
    const context = useContext(WorkerContext);
    if (context === undefined) {
        throw new Error('useWorkers must be used within a WorkerProvider');
    }
    return context;
};

export { WorkerProvider, useWorkers };
