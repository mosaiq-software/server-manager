import { sequelize } from '@/utils/dbHelper';
import { DeploymentLog } from '@mosaiq/nsm-common/types';
import { DataTypes, Model } from 'sequelize';

class DeploymentLogModel extends Model {}
DeploymentLogModel.init(
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        projectId: DataTypes.STRING,
        status: DataTypes.STRING,
        log: DataTypes.TEXT,
    },
    { sequelize }
);

export const getAllDeploymentLogs = async (projectId: string): Promise<DeploymentLog[]> => {
    return (await DeploymentLogModel.findAll({ where: { projectId } }))?.map((sec) => sec.toJSON()) as DeploymentLog[];
};

export const getDeploymentLogByIdModel = async (id: string): Promise<DeploymentLog | null> => {
    return (await DeploymentLogModel.findByPk(id))?.toJSON() as DeploymentLog;
};

export const createDeploymentLogModel = async (log: DeploymentLog) => {
    return await DeploymentLogModel.create({ ...log });
};

export const updateDeploymentLogModel = async (id: string, data: Partial<DeploymentLog>) => {
    return await DeploymentLogModel.update(
        {
            ...data,
        },
        { where: { id } }
    );
};

export const deleteDeploymentLogModel = async (id: string) => {
    return await DeploymentLogModel.destroy({ where: { id } });
};