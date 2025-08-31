import { execSafe } from './execUtils';
import * as fs from 'fs/promises';

export interface RepoData {
    dotenv: string;
}

export const getRepoData = async (projectId: string, repoOwner: string, repoName: string): Promise<RepoData> => {
    try {
        await cloneRepository(projectId, repoOwner, repoName);
        const envFileContents = await getEnvFileFromDir(`${process.env.REPO_SANDBOX_PATH}/${projectId}`);
        return {
            dotenv: envFileContents,
        };
    } catch (error) {
        console.error('Error retrieving project:', error);
        return { dotenv: '' };
    }
};

const getEnvFileFromDir = async (dir: string): Promise<string> => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping .env file retrieval');
        return 'SECRET_1=This is a secret\nSECRET_2=This is another secret';
    }
    let envFile = '';
    try {
        const files = await fs.readdir(dir);
        envFile = files.filter((file) => file.startsWith('.env'))[0] || '';
    } catch (error) {
        console.error('Error reading directory:', error);
        return '';
    }
    try {
        const envFileContents = await fs.readFile(`${dir}/${envFile}`, 'utf-8');
        return envFileContents;
    } catch (error) {
        console.error('Error reading .env file:', error);
        return '';
    }
};

const cloneRepository = async (projectId: string, repoOwner: string, repoName: string): Promise<void> => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping repository clone');
        return;
    }

    try {
        await fs.rm(`${process.env.REPO_SANDBOX_PATH}/${projectId}`, { recursive: true, force: true });
    } catch (e: any) {
        console.error('Error removing directory:', e);
        return;
    }

    try {
        const gitSshUri = `git@github.com:${repoOwner}/${repoName}.git`;
        const cmd = `git clone --progress -c core.sshCommand="/usr/bin/ssh -i ${process.env.GIT_SSH_KEY_PATH}" ${gitSshUri} ${process.env.REPO_SANDBOX_PATH}/${projectId}`;
        const { out: gitOut, code: gitCode } = await execSafe(cmd, 1000 * 60 * 5);
        if (gitCode !== 0) {
            throw new Error(`Git clone exited with code ${gitCode}`);
        }
        return;
    } catch (e: any) {
        console.error('Error cloning repository:', e);
        throw e;
    }
};
