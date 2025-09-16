import { sequelize } from '@/utils/dbHelper';
import { WorkerNode } from '@mosaiq/nsm-common/types';
import { DataTypes, Model } from 'sequelize';

class WorkerNodeModel extends Model {}
WorkerNodeModel.init(
    {
        workerId: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        address: DataTypes.STRING,
        port: DataTypes.NUMBER,
        authToken: DataTypes.STRING,
        status: DataTypes.STRING,
        isControlPlaneWorker: DataTypes.BOOLEAN,
    },
    { sequelize }
);

export const getAllWorkerNodesModel = async (): Promise<WorkerNode[]> => {
    return (await WorkerNodeModel.findAll())?.map((sec) => sec.toJSON()) as WorkerNode[];
};

export const getWorkerNodeByIdModel = async (workerId: string): Promise<WorkerNode | null> => {
    return (await WorkerNodeModel.findByPk(workerId))?.toJSON() as WorkerNode | null;
};

export const getControlPlaneWorkerNodeModel = async (): Promise<WorkerNode | null> => {
    return (await WorkerNodeModel.findOne({ where: { isControlPlaneWorker: true } }))?.toJSON() as WorkerNode | null;
}

export const createWorkerNodeModel = async (wn: WorkerNode) => {
    return await WorkerNodeModel.create({ ...wn });
};

export const updateWorkerNodeModel = async (workerId: string, data: Partial<WorkerNode>) => {
    return await WorkerNodeModel.update(
        {
            ...data,
        },
        { where: { workerId } }
    );
};

export const deleteWorkerNodeModel = async (workerId: string) => {
    return await WorkerNodeModel.destroy({ where: { workerId } });
};
