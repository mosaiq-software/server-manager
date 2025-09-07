import { sequelize } from '@/utils/dbHelper';
import { DeploymentState } from '@mosaiq/nsm-common/types';
import { DataTypes, Model } from 'sequelize';

export interface ProjectInstanceModelType {
    id: string;
    projectId: string;
    workerNodeId: string;
    state: DeploymentState;
    created: number;
    lastUpdated: number;
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
    },
    { sequelize, timestamps: false }
);

export const getProjectInstancesByProjectIdModel = async (projectId: string): Promise<ProjectInstanceModelType[]> => {
    return (await ProjectInstanceModel.findAll({ where: { projectId } }))?.map((sec) => sec.toJSON()) as ProjectInstanceModelType[];
};

export const createProjectInstanceModel = async (projectInstanceData: ProjectInstanceModelType): Promise<void> => {
    await ProjectInstanceModel.create({ ...projectInstanceData, lastUpdated: Date.now(), created: Date.now() });
};

export const updateProjectInstanceModel = async (id: string, projectInstanceData: Partial<ProjectInstanceModelType>): Promise<void> => {
    await ProjectInstanceModel.update({ ...projectInstanceData, lastUpdated: Date.now() }, { where: { id } });
};

export const deleteProjectInstanceModel = async (id: string) => {
    return await ProjectInstanceModel.destroy({ where: { id } });
};
