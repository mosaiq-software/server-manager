import { sequelize } from '@/utils/dbHelper';
import { AllowedEntityType, AllowedGithubEntity } from '@mosaiq/nsm-common/types';
import { DataTypes, Model } from 'sequelize';

class AllowedEntitiesModel extends Model {}
AllowedEntitiesModel.init(
    {
        entityId: { type: DataTypes.STRING, primaryKey: true },
        entityType: DataTypes.STRING,
    },
    { sequelize, timestamps: false }
);

export const createAllowedEntityModel = async (entity: AllowedGithubEntity): Promise<void> => {
    await AllowedEntitiesModel.create({ ...entity });
};

export const getAllowedUsersModel = async (): Promise<AllowedGithubEntity[]> => {
    const users = await AllowedEntitiesModel.findAll({ where: { entityType: AllowedEntityType.USER } });
    return users.map((u) => u.toJSON() as AllowedGithubEntity);
};

export const getAllowedOrganizationsModel = async (): Promise<AllowedGithubEntity[]> => {
    const users = await AllowedEntitiesModel.findAll({ where: { entityType: AllowedEntityType.ORGANIZATION } });
    return users.map((u) => u.toJSON() as AllowedGithubEntity);
};
