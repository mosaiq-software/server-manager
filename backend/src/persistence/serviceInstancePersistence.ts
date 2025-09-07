import { sequelize } from '@/utils/dbHelper';
import { DockerStatus, ProjectServiceInstance } from '@mosaiq/nsm-common/types';
import { DataTypes, Model } from 'sequelize';

class ServiceInstanceModel extends Model {}
ServiceInstanceModel.init(
    {
        instanceId: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        projectInstanceId: DataTypes.STRING,
        serviceName: DataTypes.STRING,
        containerId: DataTypes.STRING,
        expectedContainerState: DataTypes.STRING,
        actualContainerState: DataTypes.STRING,
        collectContainerLogs: DataTypes.BOOLEAN,
        containerLogs: DataTypes.TEXT,
        created: DataTypes.NUMBER,
        lastUpdated: DataTypes.NUMBER,
    },
    { sequelize, timestamps: false }
);

export const getServiceInstancesByProjectInstanceIdModel = async (projectInstanceId: string): Promise<ProjectServiceInstance[]> => {
    return (await ServiceInstanceModel.findAll({ where: { projectInstanceId } }))?.map((sec) => sec.toJSON()) as ProjectServiceInstance[];
};

export const createServiceInstanceModel = async (serviceInstanceData: ProjectServiceInstance): Promise<void> => {
    await ServiceInstanceModel.create({ ...serviceInstanceData, lastUpdated: Date.now(), created: Date.now() });
};

export const updateServiceInstanceModel = async (id: string, serviceInstanceData: Partial<ProjectServiceInstance>): Promise<void> => {
    await ServiceInstanceModel.update({ ...serviceInstanceData, lastUpdated: Date.now() }, { where: { id } });
};

export const deleteServiceInstanceModel = async (id: string) => {
    return await ServiceInstanceModel.destroy({ where: { id } });
};
