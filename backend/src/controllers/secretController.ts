import { createSecretModel, deleteAllSecretsForProjectEnvModel, getAllSecretsForProjectModel, updateSecretModel } from '@/persistence/secretPersistence';
import { assembleDotenv, parseDotenv } from '@mosaiq/nsm-common/secretUtil';
import { Project, ProxyConfigLocation, RedirectConfigLocation, Secret } from '@mosaiq/nsm-common/types';
import { updateProjectModelNoDirty } from '@/persistence/projectPersistence';

export const getDotenvForProject = async (projectId: string): Promise<string> => {
    const secrets = await getAllSecretsForProjectModel(projectId);
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

// const getValueForVariable = (varName: string, project: Project): string | undefined => {
//     const [parent, field] = varName.replace('<<<', '').replace('>>>', '').split('.');
//     if (parent === 'General') {
//         if (field === 'WorkerNodeId') {
//             return project.workerNodeId;
//         }
//     }
//     if (parent === 'Persistence') {
//         // Volume1 - Volume5
//         return ''; //TODO dynamic dirs
//     }
//     if (parent.length === 1 || parent.length === 2) {
//         // Single letter, A-Z is root server
//         const serverIndex = parent.charCodeAt(0) - 64;
//         if (serverIndex < 1 || serverIndex > 26) {
//             return undefined;
//         }
//         const server = project.nginxConfig?.servers.find((s) => s.index === serverIndex);
//         if (!server) {
//             return undefined;
//         }
//         if (field === 'Domain') {
//             return server.domain;
//         }
//         const locationIndex = parent.substring(1) ? parseInt(parent.substring(1)) : -1;
//         if (locationIndex === -1) {
//             return undefined;
//         }
//         const location = server.locations.find((loc) => loc.index === locationIndex);
//         if (!location) {
//             return undefined;
//         }
//         if (field === 'URL') {
//             return `https://${server.domain}${location.path === '/' ? '' : location.path}`;
//         }
//         if (field === 'Path') {
//             return location.path;
//         }
//         if (field === 'Port') {
//             // TODO dynamic port
//             // return (location as ProxyConfigLocation).;
//         }
//         if (field === 'Target') {
//             return (location as RedirectConfigLocation).target;
//         }
//     }
// };
