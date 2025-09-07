import { getProjectInstanceByIdModel } from '@/persistence/projectInstancePersistence';
import { getServiceInstancesByProjectInstanceIdModel } from '@/persistence/serviceInstancePersistence';
import { ProjectInstance } from '@mosaiq/nsm-common/types';

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
