import { execSafe } from './execUtils';
import * as fs from 'fs/promises';

export interface RepoData {
    dotenv: string;
}

export const getRepoData = async (projectId: string, repoOwner: string, repoName: string, repoBranch: string | undefined): Promise<RepoData> => {
    try {
        await cloneRepository(projectId, repoOwner, repoName, repoBranch);
        const envFileContents = await getEnvFileFromDir(`${process.env.REPO_SANDBOX_PATH}/${projectId}`);
        await deleteSandboxRepo(projectId);
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
        return `
# sample .env file
SECRET_1=aaa
SECRET_2=and
OTHER_SECRET=othervalue

`;
    }
    let envFile = '';
    try {
        const files = await fs.readdir(dir);
        envFile = files.filter((file) => file.startsWith('.env'))[0] || '';
    } catch (error) {
        console.error('Error reading directory:', error);
        return '';
    }
    if (!envFile) {
        console.warn('No .env file found in repository');
        return '';
    }
    try {
        const envFileContents = await fs.readFile(`${dir}/${envFile}`, 'utf-8');
        return envFileContents;
    } catch (error) {
        console.error('Error reading .env file:', error, dir, envFile);
        return '';
    }
};

const deleteSandboxRepo = async (projectId: string): Promise<void> => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping sandbox repo deletion');
        return;
    }
    
    try {
        await fs.rm(`${process.env.REPO_SANDBOX_PATH}/${projectId}`, { recursive: true, force: true });
    } catch (e: any) {
        console.error('Error removing directory:', e);
        return;
    }
};

const cloneRepository = async (projectId: string, repoOwner: string, repoName: string, repoBranch: string | undefined): Promise<void> => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping repository clone');
        return;
    }

    await deleteSandboxRepo(projectId);

    try {
        const gitSshUri = `git@github.com:${repoOwner}/${repoName}.git`;
        const branchFlags = repoBranch ? `-b ${repoBranch} --single-branch` : '';
        const sshFlags = `-c core.sshCommand="/usr/bin/ssh -i ${process.env.GIT_SSH_KEY_DIR}/${process.env.GIT_SSH_KEY_FILE}"`;
        const cmd = `git clone --progress ${branchFlags} ${sshFlags} ${gitSshUri} ${process.env.REPO_SANDBOX_PATH}/${projectId}`;
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
