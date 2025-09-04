import { sequelize } from '@/utils/dbHelper';
import { DeploymentState } from '@mosaiq/nsm-common/types';
import { DataTypes, Model } from 'sequelize';
export interface ProjectModelType {
    id: string;
    state: DeploymentState;
    repoOwner: string;
    repoName: string;
    deploymentKey: string;
    allowCICD: boolean;
    timeout?: number;
    dirtyConfig?: boolean;
    nginxConfigJson: string;
    workerNodeId?: string;
    createdAt?: string;
    updatedAt?: string;
}
class ProjectModel extends Model {}
ProjectModel.init(
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        state: DataTypes.STRING,
        repoOwner: DataTypes.STRING,
        repoName: DataTypes.STRING,
        deploymentKey: DataTypes.STRING,
        allowCICD: DataTypes.BOOLEAN,
        timeout: DataTypes.NUMBER,
        dirtyConfig: DataTypes.BOOLEAN,
        nginxConfigJson: DataTypes.TEXT,
        workerNodeId: DataTypes.STRING,
    },
    { sequelize }
);

export const getProjectByIdModel = async (id: string) => {
    return (await ProjectModel.findByPk(id))?.toJSON() as ProjectModelType | undefined;
};

export const getAllProjectsModel = async (): Promise<ProjectModelType[]> => {
    return (await ProjectModel.findAll())?.map((project) => project.toJSON()) as ProjectModelType[];
};

export const createProjectModel = async (id: string, data: Partial<ProjectModelType>) => {
    return await ProjectModel.create({ id, ...data });
};

export const updateProjectModelNoDirty = async (id: string, data: Partial<ProjectModelType>) => {
    return await ProjectModel.update(
        {
            ...data,
        },
        { where: { id } }
    );
};
