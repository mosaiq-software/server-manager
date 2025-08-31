import { sequelize } from '@/utils/dbHelper';
import { DeploymentLog, DeploymentState } from '@mosaiq/nsm-common/types';
import { Mutex } from 'async-mutex';
import { DataTypes, Model } from 'sequelize';

const mutex = new Mutex();

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

export const createDeploymentLogModel = async (projectId: string, log: string, status: DeploymentState) => {
    const id = crypto.randomUUID();
    await DeploymentLogModel.create({ id, projectId, log, status });
    return id;
};

export const updateDeploymentLogModel = async (id: string, data: Partial<DeploymentLog>) => {
    await mutex.runExclusive(async () => {
        const log = await getDeploymentLogByIdModel(id);
        if (!log) throw new Error('Log not found');
        await DeploymentLogModel.update(
            {
                ...data,
                log: data.log ? `${log.log ?? ''}${data.log}` : undefined,
            },
            { where: { id } }
        );
    });
};

export const deleteDeploymentLogModel = async (id: string) => {
    return await DeploymentLogModel.destroy({ where: { id } });
};
