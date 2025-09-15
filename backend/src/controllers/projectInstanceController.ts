import { getAllActiveProjectInstancesModel, getProjectInstanceByIdModel } from '@/persistence/projectInstancePersistence';
import { getServiceInstancesByProjectInstanceIdModel } from '@/persistence/serviceInstancePersistence';
import { ProjectInstance, ProjectServiceInstance } from '@mosaiq/nsm-common/types';

export const getProjectInstance = async (id: string): Promise<ProjectInstance | undefined> => {
    const instanceModel = await getProjectInstanceByIdModel(id);
    if (!instanceModel) return undefined;
    const services = await getServiceInstancesByProjectInstanceIdModel(id);
    const instance: ProjectInstance = {
        ...instanceModel,
        services,
    };
    return instance;
};

export const getAllActiveServices = async (): Promise<ProjectServiceInstance[]> => {
    const activeProjectInstances = await getAllActiveProjectInstancesModel();
    const allActiveServiceInstances: ProjectServiceInstance[] = [];
    for (const projectInstance of activeProjectInstances) {
        const services = await getServiceInstancesByProjectInstanceIdModel(projectInstance.id);
        allActiveServiceInstances.push(...services);
    }
    return allActiveServiceInstances;
};
