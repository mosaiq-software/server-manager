import { Secret } from "./types";

export const assembleDotenv = (envName:string, secrets: Secret[]): string => {
    return secrets.map(sec => `${sec.secretName}=${sec.secretValue}`).join('\n');
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