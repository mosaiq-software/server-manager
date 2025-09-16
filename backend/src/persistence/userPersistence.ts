import { sequelize } from '@/utils/dbHelper';
import { User } from '@mosaiq/nsm-common/types';
import { DataTypes, Model } from 'sequelize';

class UserModel extends Model {}
UserModel.init(
    {
        authToken: { type: DataTypes.STRING, primaryKey: true },
        githubId: DataTypes.STRING,
        name: DataTypes.STRING,
        avatarUrl: DataTypes.STRING,
        created: DataTypes.NUMBER,
    },
    { sequelize, timestamps: false }
);

export const createUserModel = async (user: User): Promise<void> => {
    await UserModel.create({ ...user });
};

export const getUserByAuthTokenModel = async (authToken: string): Promise<User | null> => {
    const userInstance = await UserModel.findByPk(authToken);
    if (!userInstance) return null;
    return userInstance.toJSON() as User;
};

export const deleteUserByAuthTokenModel = async (authToken: string): Promise<void> => {
    await UserModel.destroy({ where: { authToken } });
};
