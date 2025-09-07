import { sequelize } from '@/utils/dbHelper';
import { DockerStatus, UriStatus } from '@mosaiq/nsm-common/types';
import { DataTypes, Model } from 'sequelize';

export interface ServiceInstanceModelType {
    id: string;
    projectInstanceId: string;
    serviceName: string;
    uri: string | undefined;
    uriStatus: UriStatus | undefined;
    dockerContainerId: string | undefined;
    dockerStatus: DockerStatus | undefined;
    created: number;
    lastUpdated: number;
}
class ServiceInstanceModel extends Model {}
ServiceInstanceModel.init(
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        projectInstanceId: DataTypes.STRING,
        serviceName: DataTypes.STRING,
        uri: DataTypes.STRING,
        uriStatus: DataTypes.STRING,
        dockerContainerId: DataTypes.STRING,
        dockerStatus: DataTypes.STRING,
        created: DataTypes.NUMBER,
        lastUpdated: DataTypes.NUMBER,
    },
    { sequelize, timestamps: false }
);

export const getServiceInstancesByProjectInstanceIdModel = async (projectInstanceId: string): Promise<ServiceInstanceModelType[]> => {
    return (await ServiceInstanceModel.findAll({ where: { projectInstanceId } }))?.map((sec) => sec.toJSON()) as ServiceInstanceModelType[];
};

export const createServiceInstanceModel = async (serviceInstanceData: ServiceInstanceModelType): Promise<void> => {
    await ServiceInstanceModel.create({ ...serviceInstanceData, lastUpdated: Date.now(), created: Date.now() });
};

export const updateServiceInstanceModel = async (id: string, serviceInstanceData: Partial<ServiceInstanceModelType>): Promise<void> => {
    await ServiceInstanceModel.update({ ...serviceInstanceData, lastUpdated: Date.now() }, { where: { id } });
};

export const deleteServiceInstanceModel = async (id: string) => {
    return await ServiceInstanceModel.destroy({ where: { id } });
};
