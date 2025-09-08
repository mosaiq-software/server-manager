import { createProjectInstanceModel, getAllActiveProjectInstancesModel, getProjectInstanceByIdModel, getProjectInstancesByProjectIdModel, updateProjectInstanceModel } from '@/persistence/projectInstancePersistence';
import { getServiceInstancesByProjectInstanceIdModel } from '@/persistence/serviceInstancePersistence';
import { DeploymentState, ProjectInstance, ProjectInstanceHeader, ProjectServiceInstance } from '@mosaiq/nsm-common/types';

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

export const deactivateAllInstancesOfProject = async (projectId: string): Promise<void> => {
    const instances = await getProjectInstancesByProjectIdModel(projectId);
    if (!instances) return;
    for (const instance of instances) {
        if (instance.active) {
            await updateProjectInstanceModel(instance.id, { active: false });
        }
    }
};

export const startNewProjectInstance = async (projectId: string, workerNodeId: string): Promise<string> => {
    const instanceId = crypto.randomUUID();
    const projectInstanceHeader: ProjectInstanceHeader = {
        id: instanceId,
        projectId: projectId,
        workerNodeId: workerNodeId,
        state: DeploymentState.DEPLOYING,
        created: Date.now(),
        lastUpdated: Date.now(),
        active: true,
    };
    await deactivateAllInstancesOfProject(projectId);
    await createProjectInstanceModel(projectInstanceHeader);
    return instanceId;
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
