import { sequelize } from '@/utils/dbHelper';
import { DockerStatus, UriStatus } from '@mosaiq/nsm-common/types';
import { DataTypes, Model } from 'sequelize';

export interface StatusModelType {
    id: string;
    serviceInstanceId: string;
    uriStatus: UriStatus | undefined;
    dockerStatus: DockerStatus | undefined;
    created: number;
}
class StatusModel extends Model {}
StatusModel.init(
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        serviceInstanceId: DataTypes.STRING,
        uriStatus: DataTypes.STRING,
        dockerStatus: DataTypes.STRING,
        created: DataTypes.NUMBER,
    },
    { sequelize, timestamps: false }
);

export const getStatusByServiceInstanceIdModel = async (serviceInstanceId: string): Promise<StatusModelType[]> => {
    return (await StatusModel.findAll({ where: { serviceInstanceId } }))?.map((sec) => sec.toJSON()) as StatusModelType[];
};

export const createStatusModel = async (data: StatusModelType): Promise<void> => {
    await StatusModel.create({ ...data, created: Date.now() });
};

export const deleteStatusModel = async (id: string) => {
    return await StatusModel.destroy({ where: { id } });
};
