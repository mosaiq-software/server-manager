import { sequelize } from '@/utils/dbHelper';
import { DockerStatus, UriStatus, WorkerStatus } from '@mosaiq/nsm-common/types';
import { DataTypes, Model } from 'sequelize';

export interface WorkerStatusModelType {
    id: string;
    workerId: string;
    status: WorkerStatus;
    created: number;
}
class WorkerStatusModel extends Model {}
WorkerStatusModel.init(
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        workerId: DataTypes.STRING,
        status: DataTypes.STRING,
        created: DataTypes.NUMBER,
    },
    { sequelize, timestamps: false }
);

export const getStatusByWorkerIdModel = async (workerId: string): Promise<WorkerStatusModelType[]> => {
    return (await WorkerStatusModel.findAll({ where: { workerId } }))?.map((sec) => sec.toJSON()) as WorkerStatusModelType[];
};

export const createWorkerStatusModel = async (data: WorkerStatusModelType): Promise<void> => {
    await WorkerStatusModel.create({ ...data, created: Date.now() });
};

export const deleteWorkerStatusModel = async (id: string) => {
    return await WorkerStatusModel.destroy({ where: { id } });
};
