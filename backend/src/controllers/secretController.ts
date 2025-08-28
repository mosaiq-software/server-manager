import { createSecretModel, deleteAllSecretsForProjectEnvModel, getAllSecretsForProjectModel } from "@/persistence/secretPersistence";
import { Secret } from "@mosaiq/nsm-common/types";


export const getAllSecretEnvsForProject = async (projectId: string): Promise<{ [env: string]: Secret[] }> => {
    const secrets = await getAllSecretsForProjectModel(projectId);
    const envs: { [env: string]: Secret[] } = {};

    for (const sec of secrets) {
        if (!envs[sec.env]) {
            envs[sec.env] = [];
        }
        envs[sec.env].push(sec);
    }

    return envs;
};

export const getDotenvsForProject = async (projectId: string): Promise<{ [env: string]: string }> => {
    const envs = await getAllSecretEnvsForProject(projectId);
    const dotenvs: { [env: string]: string } = {};

    for (const [env, secrets] of Object.entries(envs)) {
        dotenvs[env] = secrets.map(sec => `${sec.secretName}=${sec.secretValue}`).join('\n');
    }

    return dotenvs;
};

export const parseSampleDotenv = (dotenv: string, projectId: string, env: string): Secret[] => {
    const lines = dotenv.split('\n');
    const secrets: Secret[] = [];

    for (const line of lines) {
        const [key, value] = line.split('=');
        if (key) {
            secrets.push({
                projectId: projectId,
                env: env,
                secretName: key.trim(),
                secretValue: '',
                secretPlaceholder: value?.trim() ?? ''
            });
        }
    }

    return secrets;
};

export const applyDotenv = async (dotenv: string, projectId: string, env: string) => {
    const updatedSecrets = parseSampleDotenv(dotenv, projectId, env);
    
    const currentEnvs = await getAllSecretEnvsForProject(projectId);
    const currentSecrets = currentEnvs[env] || [];

    for (const uSec of updatedSecrets) {
        const currentSecret = currentSecrets.find(sec => sec.secretName === uSec.secretName);
        if (currentSecret) {
            uSec.secretValue = currentSecret.secretValue;
        }
    }

    await deleteAllSecretsForProjectEnvModel(projectId, env);
    for (const sec of updatedSecrets) {
        createSecretModel(sec);
    }
};