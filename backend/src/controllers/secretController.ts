import { createSecretModel, deleteAllSecretsForProjectEnvModel, getAllSecretsForProjectModel, updateSecretModel } from '@/persistence/secretPersistence';
import { assembleDotenv, parseDotenv } from '@mosaiq/nsm-common/secretUtil';
import { Secret } from '@mosaiq/nsm-common/types';
import { updateProjectModelNoDirty } from '@/persistence/projectPersistence';

export const getDotenvForProject = async (projectId: string): Promise<string> => {
    const secrets = await getAllSecretsForProjectModel(projectId);
    // TODO inject variables here
    const dotenv = assembleDotenv(secrets);
    return dotenv;
};

export const getAllSecretsForProject = async (projectId: string): Promise<Secret[]> => {
    const secrets = await getAllSecretsForProjectModel(projectId);
    return secrets;
};

export const applyDotenv = async (dotenv: string, projectId: string) => {
    const updatedSecrets = parseDotenv(dotenv, projectId);

    const projectSecrets = await getAllSecretsForProjectModel(projectId);

    for (const uSec of updatedSecrets) {
        const currentSecret = projectSecrets.find((sec) => sec.secretName === uSec.secretName);
        if (currentSecret) {
            uSec.secretValue = currentSecret.secretValue;
        }
    }

    await deleteAllSecretsForProjectEnvModel(projectId);
    for (const sec of updatedSecrets) {
        createSecretModel(sec);
    }
};

export const updateEnvironmentVariable = async (projectId: string, sec: Secret) => {
    await updateSecretModel(projectId, sec);
    await updateProjectModelNoDirty(projectId, { dirtyConfig: true });
};
