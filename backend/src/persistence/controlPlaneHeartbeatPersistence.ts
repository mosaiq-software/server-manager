import { sequelize } from '@/utils/dbHelper';
import { DataTypes, Model } from 'sequelize';

// Will only have 1 row to track last seen time and if heartbeat is active
class ControlPlaneHeartbeatModel extends Model {}
ControlPlaneHeartbeatModel.init(
    {
        heartbeat: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        lastSeen: { type: DataTypes.NUMBER, allowNull: false, defaultValue: Date.now() },
    },
    { sequelize, timestamps: false }
);

export const getLastCpHeartbeatModel = async (): Promise<number | null> => {
    const row = await ControlPlaneHeartbeatModel.findOne({ where: { heartbeat: true } });
    return row?.toJSON().lastSeen || null;
};

export const updateCpHeartbeatModel = async (): Promise<void> => {
    const row = await ControlPlaneHeartbeatModel.findOne({ where: { heartbeat: true } });
    if (row) {
        await ControlPlaneHeartbeatModel.update({ lastSeen: Date.now() }, { where: { heartbeat: true } });
    } else {
        await ControlPlaneHeartbeatModel.create({ heartbeat: true, lastSeen: Date.now() });
    }
};
