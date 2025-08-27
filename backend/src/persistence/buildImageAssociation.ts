import { sequelize } from '@/utils/dbHelper';
import { OtherId, UserId } from 'common';
import { DataTypes, Model } from 'sequelize';

class UserSomethingAssociation extends Model {}
UserSomethingAssociation.init(
    {
        userId: { type: DataTypes.STRING, primaryKey: true },
        otherId: { type: DataTypes.STRING, primaryKey: true },
    },
    { sequelize }
);

export const getThingsForUser = async (userId: UserId) => {
    return (
        await UserSomethingAssociation.findAll({
            where: { userId },
        })
    ).map((i) => i.toJSON() as OtherId);
};

export const linkImageToBuild = async (userId: UserId, otherId: OtherId) => {
    await UserSomethingAssociation.create({ userId, otherId });
};

export const unlinkImageFromBuild = async (userId: UserId, otherId: OtherId) => {
    await UserSomethingAssociation.destroy({ where: { userId, otherId } });
};
