import { sequelize } from '@/utils/dbHelper';
import { ControlPlaneIncident, DockerStatus, UriStatus, WorkerStatus } from '@mosaiq/nsm-common/types';
import { DataTypes, Model } from 'sequelize';

class ControlPlaneStatusModel extends Model {}
ControlPlaneStatusModel.init(
    {
        id: { type: DataTypes.STRING, primaryKey: true },
        from: DataTypes.NUMBER,
        to: DataTypes.NUMBER,
    },
    { sequelize, timestamps: false }
);

export const getAllControlPlaneStatusesModel = async (): Promise<ControlPlaneIncident[]> => {
    const rows = await ControlPlaneStatusModel.findAll({ order: [['from', 'ASC']] });
    return rows.map((r) => r.toJSON() as ControlPlaneIncident);
};

export const createControlPlaneStatusModelLog = async (from: number, to: number): Promise<void> => {
    await ControlPlaneStatusModel.create({ from, to, id: crypto.randomUUID() });
};
