import { DynamicEnvVariable, NginxConfigLocationType, Project, Secret } from './types';

export const assembleDotenv = (secrets: Secret[]): string => {
    return secrets.map((sec) => `${sec.secretName}=${sec.secretValue}`).join('\n');
};

export const parseDotenv = (dotenv: string, projectId: string): Secret[] => {
    const lines = dotenv.split('\n');
    const secrets: Secret[] = [];

    for (const line of lines) {
        const [key, value] = line.split('=');
        if (key?.trim().length) {
            const isVar = value?.trim().startsWith('<<<') && value?.trim().endsWith('>>>');
            secrets.push({
                projectId: projectId,
                secretName: key.trim(),
                secretValue: '',
                secretPlaceholder: value?.trim() ?? '',
                variable: isVar,
            });
        }
    }

    return secrets;
};

export const extractVariables = (project: Project) => {
    const { nginxConfig } = project;
    const vars = new Set<DynamicEnvVariable>();
    vars.add({ parent: 'General', field: 'WorkerNodeId', placeholder: 'server-rig-1', type: undefined });
    if (nginxConfig) {
        for (const server of nginxConfig.servers) {
            const serverLetter = String.fromCharCode(64 + server.index);
            vars.add({ parent: serverLetter, field: 'Domain', placeholder: server.domain, type: 'Domain' });
            for (const location of server.locations) {
                const id = `${serverLetter}${location.index}`;
                vars.add({ parent: id, field: 'URL', placeholder: `https://${server.domain}${location.path}`, type: location.type });
                vars.add({ parent: id, field: 'Path', placeholder: location.path, type: location.type });
                switch (location.type) {
                    case NginxConfigLocationType.STATIC:
                        vars.add({ parent: id, field: 'Directory', placeholder: `/www/${project.id} (Generated on Deploy)`, type: location.type });
                        break;
                    case NginxConfigLocationType.PROXY:
                        vars.add({ parent: id, field: 'Port', placeholder: '1234 (Generated on Deploy)', type: location.type });
                        break;
                    case NginxConfigLocationType.REDIRECT:
                        vars.add({ parent: id, field: 'Target', placeholder: location.target, type: location.type });
                        break;
                    case NginxConfigLocationType.CUSTOM:
                        break;
                }
            }
        }
    }

    for (let i = 1; i <= 5; i++) {
        vars.add({ parent: 'Persistence', field: `Volume${i}`, placeholder: `/example-data/${project.id}/volume-${i}`, type: 'Persistence' });
    }

    return Array.from(vars);
};
