import { createAllowedEntityModel, deleteAllAllowedEntitiesModel, getAllAllowedEntitiesModel } from '@/persistence/allowedEntitiesPersistence';
import { AllowedGithubEntity } from '@mosaiq/nsm-common/types';

export const setAllowedEntities = async (entities: AllowedGithubEntity[]): Promise<void> => {
    try {
        await deleteAllAllowedEntitiesModel();
        for (const entity of entities) {
            await createAllowedEntityModel(entity);
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
