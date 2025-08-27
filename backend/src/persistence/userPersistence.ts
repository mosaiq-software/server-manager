import { sequelize } from '@/utils/dbHelper';
import { UserId } from 'common';
import { DataTypes, Model } from 'sequelize';
export interface UserModelType {
    id: UserId;
    name: string;
}
class UserModel extends Model {}
UserModel.init(
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        name: DataTypes.STRING,
    },
    { sequelize }
);

export const getUserById = async (id: UserId) => {
    return (await UserModel.findByPk(id))?.toJSON() as UserModelType | undefined;
};

export const getUserByName = async (name: string) => {
    return (await UserModel.findOne({ where: { name } }))?.toJSON() as UserModelType | undefined;
};

export const createUser = async (uuid: UserId, name: string) => {
    return await UserModel.create({ uuid, name });
};

export const updateUser = async (uuid: UserId, data: Partial<UserModelType>) => {
    return await UserModel.update(
        {
            ...data,
        },
        { where: { uuid } }
    );
};
