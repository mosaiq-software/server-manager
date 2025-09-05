import { createSecretModel, deleteAllSecretsForProjectEnvModel, getAllSecretsForProjectModel, updateSecretModel } from '@/persistence/secretPersistence';
import { assembleDotenv, parseDotenv, parseDynamicVariablePath, extractSecretsFromDockerCompose, buildRawVarsIntoSecrets } from '@mosaiq/nsm-common/secretUtil';
import { DynamicEnvVariableFields, FullDirectoryMap, NginxConfigLocationType, Project, ProxyConfigLocation, RedirectConfigLocation, Secret } from '@mosaiq/nsm-common/types';
import { updateProjectModelNoDirty } from '@/persistence/projectPersistence';
import { RepoData } from '@/utils/repositoryUtils';

export const getDotenvForProject = async (project: Project, requestedPorts: { proxyLocationId: string; port: number }[], dirMap: FullDirectoryMap): Promise<string> => {
    const secrets = (project.secrets || []).map((sec) => fillSecret(sec, project, requestedPorts, dirMap));
    const dotenv = assembleDotenv(secrets);
    return dotenv;
};

export const getAllSecretsForProject = async (projectId: string): Promise<Secret[]> => {
    const secrets = await getAllSecretsForProjectModel(projectId);
    return secrets;
};

export const applyRepoData = async (repoData: RepoData, projectId: string) => {
    const envSecrets = parseDotenv(repoData.dotenv, projectId);
    const composeSecrets = extractSecretsFromDockerCompose(repoData.compose.contents, projectId);
    const jsSecrets = buildRawVarsIntoSecrets(repoData.jsEnvVars, projectId, 'JS Source Code');
    const combinedSecrets = [];
    const secretNames = new Set<string>();
    for (const sec of [...envSecrets, ...composeSecrets, ...jsSecrets]) {
        if (!secretNames.has(sec.secretName)) {
            combinedSecrets.push(sec);
            secretNames.add(sec.secretName);
        }
    }

    const oldProjectSecrets = await getAllSecretsForProjectModel(projectId);

    const updatedProjectSecrets = combinedSecrets.map((uSec) => {
        const currentSecret = oldProjectSecrets.find((sec) => sec.secretName === uSec.secretName);
        return currentSecret ?? uSec;
    });

    await deleteAllSecretsForProjectEnvModel(projectId);
    for (const sec of updatedProjectSecrets) {
        await createSecretModel(sec);
    }
    await updateProjectModelNoDirty(projectId, { hasDockerCompose: repoData.compose.exists, hasDotenv: !!repoData.dotenv.trim().length });
};

export const updateEnvironmentVariable = async (projectId: string, sec: Secret) => {
    await updateSecretModel(projectId, sec);
    await updateProjectModelNoDirty(projectId, { dirtyConfig: true });
};

const fillSecret = (secret: Secret, project: Project, requestedPorts: { proxyLocationId: string; port: number }[], dirMap: FullDirectoryMap): Secret => {
    if (!secret.variable) {
        return secret;
    }
    try {
        const dynVarData = parseDynamicVariablePath(secret.secretValue);
        const server = project.nginxConfig?.servers.find((s) => s.serverId === dynVarData.serverId);
        const location = server?.locations.find((l) => l.locationId === dynVarData.locationId);
        switch (dynVarData.field) {
            case DynamicEnvVariableFields.WORKER_NODE_ID:
                return { ...secret, secretValue: project.workerNodeId || '' };
            case DynamicEnvVariableFields.DOMAIN:
                return { ...secret, secretValue: server?.domain || '' };
            case DynamicEnvVariableFields.URL:
                return { ...secret, secretValue: `https://${server?.domain || ''}${location?.path === '/' ? '' : location?.path}` };
            case DynamicEnvVariableFields.PATH:
                return { ...secret, secretValue: location?.path || '' };
            case DynamicEnvVariableFields.DIRECTORY:
                if (location?.type === NginxConfigLocationType.STATIC && dirMap[secret.secretValue]) {
                    return { ...secret, secretValue: dirMap[secret.secretValue].fullPath };
                }
                return secret;
            case DynamicEnvVariableFields.PORT:
                if (location?.type === NginxConfigLocationType.PROXY) {
                    const req = requestedPorts.find((r) => r.proxyLocationId === location.locationId);
                    if (req) {
                        return { ...secret, secretValue: req.port.toString() };
                    }
                }
                return secret;
            case DynamicEnvVariableFields.TARGET:
                if (location?.type === NginxConfigLocationType.REDIRECT) {
                    return { ...secret, secretValue: (location as RedirectConfigLocation).target || '' };
                }
                return secret;
            case DynamicEnvVariableFields.VOLUME:
                if (dirMap[secret.secretValue]) {
                    return { ...secret, secretValue: dirMap[secret.secretValue].fullPath };
                }
                return secret;
            default:
                return secret;
        }
    } catch (error) {
        console.error(`Error parsing dynamic variable path: ${secret.secretValue}`, error);
        return secret;
    }
};
