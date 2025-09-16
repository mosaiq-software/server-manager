import { createAllowedEntityModel, deleteAllowedEntitiesModel, getAllAllowedEntitiesModel } from '@/persistence/allowedEntitiesPersistence';
import { AllowedGithubEntity } from '@mosaiq/nsm-common/types';
import { signOutAllUsers } from './userController';

export const setAllowedEntities = async (entities: AllowedGithubEntity[]): Promise<void> => {
    try {
        const allowed = await getAllAllowedEntitiesModel();
        const removedEntities = allowed.filter((a) => !entities.some((e) => e.id === a.id && e.type === a.type));
        for (const entity of removedEntities) {
            await deleteAllowedEntitiesModel(entity.id);
        }
        const newEntities = entities.filter((e) => !allowed.some((a) => a.id === e.id && a.type === e.type));
        for (const entity of newEntities) {
            await createAllowedEntityModel(entity);
        }
        if (removedEntities.length > 0) {
            await signOutAllUsers();
        }
    } catch (error) {
        throw new Error('Failed to set allowed entities: ' + (error as Error).message);
    }
};

export const getAllowedEntities = async (): Promise<AllowedGithubEntity[]> => {
    try {
        const entities = await getAllAllowedEntitiesModel();
        return entities;
    } catch (error) {
        throw new Error('Failed to get allowed entities: ' + (error as Error).message);
    }
};
