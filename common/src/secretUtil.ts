import { Secret } from './types';

export const assembleDotenv = (secrets: Secret[]): string => {
    return secrets.map((sec) => `${sec.secretName}=${sec.secretValue}`).join('\n');
};

export const parseDotenv = (dotenv: string, projectId: string): Secret[] => {
    const lines = dotenv.split('\n');
    const secrets: Secret[] = [];

    for (const line of lines) {
        const [key, value] = line.split('=');
        if (key?.trim().length) {
            secrets.push({
                projectId: projectId,
                secretName: key.trim(),
                secretValue: '',
                secretPlaceholder: value?.trim() ?? '',
                variable: false,
            });
        }
    }

    return secrets;
};
