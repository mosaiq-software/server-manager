import { sequelize } from '@/utils/dbHelper';
import { ProjectInstance, ProjectInstanceHeader } from '@mosaiq/nsm-common/types';
import { DataTypes, Model } from 'sequelize';
import { Mutex } from 'async-mutex';

const mutex = new Mutex();

export interface ProjectInstanceModelType extends ProjectInstanceHeader {
    deploymentLog: string;
}
class ProjectInstanceModel extends Model {}
ProjectInstanceModel.init(
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        projectId: DataTypes.STRING,
        workerNodeId: DataTypes.STRING,
        state: DataTypes.STRING,
        created: DataTypes.NUMBER,
        lastUpdated: DataTypes.NUMBER,
        deploymentLog: DataTypes.TEXT,
        active: DataTypes.BOOLEAN,
    },
    { sequelize, timestamps: false }
);

export const getAllActiveProjectInstancesModel = async (): Promise<ProjectInstanceModelType[]> => {
    return (await ProjectInstanceModel.findAll({ where: { active: true } }))?.map((sec) => sec.toJSON()) as ProjectInstanceModelType[];
};
export const getProjectInstancesByProjectIdModel = async (projectId: string): Promise<ProjectInstanceModelType[]> => {
    return (await ProjectInstanceModel.findAll({ where: { projectId } }))?.map((sec) => sec.toJSON()) as ProjectInstanceModelType[];
};

export const getProjectInstanceByIdModel = async (id: string): Promise<ProjectInstanceModelType | null> => {
    return (await ProjectInstanceModel.findByPk(id))?.toJSON() as ProjectInstanceModelType;
};

export const createProjectInstanceModel = async (projectInstanceData: ProjectInstanceHeader): Promise<void> => {
    await ProjectInstanceModel.create({ ...projectInstanceData, lastUpdated: Date.now(), created: Date.now(), deploymentLog: '' });
};

export const updateProjectInstanceModel = async (id: string, projectInstanceData: Partial<ProjectInstanceHeader>): Promise<void> => {
    await ProjectInstanceModel.update({ ...projectInstanceData, lastUpdated: Date.now() }, { where: { id } });
};

export const deleteProjectInstanceModel = async (id: string) => {
    return await ProjectInstanceModel.destroy({ where: { id } });
};

export const appendToDeploymentLog = async (id: string, log: string) => {
    await mutex.runExclusive(async () => {
        const instance = await getProjectInstanceByIdModel(id);
        if (!instance) throw new Error('Project Instance not found');
        await ProjectInstanceModel.update(
            {
                deploymentLog: `${instance.deploymentLog ?? ''}${log}`,
                lastUpdated: Date.now(),
            },
            { where: { id } }
        );
    });
};
