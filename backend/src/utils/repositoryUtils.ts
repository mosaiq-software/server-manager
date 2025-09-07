import { execSafe } from './execUtils';
import * as fs from 'fs/promises';
import { getGitHttpsUri, getGitSshUri } from '@mosaiq/nsm-common/gitUtils';
import YAML from 'yaml';
import { DockerCompose } from '@mosaiq/nsm-common/dockerComposeTypes';

export interface RepoData {
    dotenv: string;
    compose: { exists: boolean; contents: string; parsed: DockerCompose | undefined };
    jsEnvVars: string[];
}

export const getRepoData = async (projectId: string, repoOwner: string, repoName: string, repoBranch: string | undefined): Promise<RepoData> => {
    await cloneRepository(projectId, repoOwner, repoName, repoBranch);
    const dir = `${process.env.REPO_SANDBOX_PATH}/${projectId}`;
    const envFileContents = await getEnvFileFromDir(dir);
    const dockerComposeFile = await getDockerComposeFileFromDir(dir);
    const jsEnvVars = await getJsProcessEnvVarsFromDir(dir);
    await deleteSandboxRepo(projectId);
    return {
        dotenv: envFileContents,
        compose: dockerComposeFile,
        jsEnvVars,
    };
};

const getEnvFileFromDir = async (dir: string): Promise<string> => {
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

const getDockerComposeFileFromDir = async (dir: string): Promise<{ exists: boolean; contents: string; parsed: DockerCompose | undefined }> => {
    const dockerComposeFilenames = ['compose.yaml', 'compose.yml', 'docker-compose.yaml', 'docker-compose.yml'];

    for (const filename of dockerComposeFilenames) {
        try {
            const contents = await fs.readFile(`${dir}/${filename}`, 'utf-8');
            const parsed = YAML.parse(contents) as DockerCompose;
            return { exists: true, contents, parsed };
        } catch {
            // File not found, continue to next
        }
    }
    console.warn('No Docker Compose file found in repository');
    return { exists: false, contents: '', parsed: undefined };
};

const getJsProcessEnvVarsFromDir = async (dir: string): Promise<string[]> => {
    const jsFileExtensions = ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.mts', '.cts', '.tsx'];
    const ignoreDirs = ['node_modules', '.git', '.github', '.vscode'];
    const jsFiles: string[] = [];

    const walkDir = async (currentDir: string) => {
        if (ignoreDirs.some((d) => currentDir.includes(`/${d}`))) return;
        const files = await fs.readdir(currentDir);
        for (const file of files) {
            const fullPath = `${currentDir}/${file}`;
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                await walkDir(fullPath);
            } else if (jsFileExtensions.some((ext) => file.endsWith(ext))) {
                jsFiles.push(fullPath);
            }
        }
    };
    await walkDir(dir);

    const envVars = new Set<string>();
    const envVarRegex = /process\.env\.([A-Za-z0-9_-]+)/g;
    for (const file of jsFiles) {
        try {
            const contents = await fs.readFile(file, 'utf-8');
            const matches = contents.matchAll(envVarRegex);
            for (const match of matches) {
                if (match[1]) {
                    envVars.add(match[1]);
                }
            }
        } catch (error) {
            console.error('Error reading JS file:', error, file);
        }
    }
    return Array.from(envVars);
};

const deleteSandboxRepo = async (projectId: string): Promise<void> => {
    try {
        await fs.rm(`${process.env.REPO_SANDBOX_PATH}/${projectId}`, { recursive: true, force: true });
    } catch (e: any) {
        console.error('Error removing directory:', e);
        return;
    }
};

const cloneRepository = async (projectId: string, repoOwner: string, repoName: string, repoBranch: string | undefined): Promise<void> => {
    const repoPath = `${process.env.REPO_SANDBOX_PATH}/${projectId}`;
    const branchFlags = repoBranch ? `-b ${repoBranch} --single-branch` : '';

    await deleteSandboxRepo(projectId);

    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, handling local repository clone');
        const httpUri = getGitHttpsUri(repoOwner, repoName);
        const cmd = `git clone --progress ${branchFlags} ${httpUri} ${repoPath}`;
        console.log('Cloning repository with command:', cmd);
        const { out: gitOut, code: gitCode } = await execSafe(cmd, 1000 * 60 * 1);
        console.error('Git clone output:', gitOut);
        if (gitCode !== 0) {
            throw new Error(`Git clone exited with code ${gitCode}`);
        }

        return;
    }

    try {
        const gitSshUri = getGitSshUri(repoOwner, repoName);
        const sshFlags = `-c core.sshCommand="/usr/bin/ssh -i ${process.env.GIT_SSH_KEY_DIR}/${process.env.GIT_SSH_KEY_FILE}"`;
        const cmd = `git clone --progress ${branchFlags} ${sshFlags} ${gitSshUri} ${repoPath}`;
        console.log('Cloning repository with command:', cmd);
        const { out: gitOut, code: gitCode } = await execSafe(cmd, 1000 * 60 * 5);
        if (gitCode !== 0) {
            console.error('Git clone output:', gitOut);
            throw new Error(`Git clone exited with code ${gitCode}`);
        }
        return;
    } catch (e: any) {
        console.error('Error cloning repository:', e);
        throw e;
    }
};

export const getServicesForProject = (compose: DockerCompose | undefined): string[] => {
    if (!compose || !compose.services) return [];
    return Object.keys(compose.services);
};
