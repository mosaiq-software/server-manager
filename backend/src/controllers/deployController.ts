import { getProjectByIdModel, updateProjectModel } from '@/persistence/projectPersistence';
import { executeCommandOnHost } from '@/utils/hostExecutor';
import { DeploymentState } from '@mosaiq/nsm-common/types';
import { execSync } from 'child_process';

export const deployProject = async (projectId: string): Promise<boolean> => {
    try {
        const project = await getProjectByIdModel(projectId);
        if (!project) throw new Error('Project not found');

        if (process.env.PRODUCTION !== 'true') {
            console.log('Not in production mode, skipping deployment');
            return false;
        }

        await updateProjectModel(projectId, {state: DeploymentState.DEPLOYING});

        cloneRepository(projectId, project.repoOwner, project.repoName);
        runDeploymentCommand(projectId, project.runCommand);
        await updateProjectModel(projectId, {state: DeploymentState.ACTIVE});
        return true;
    } catch (error) {
        console.error('Error deploying project:', error);
        await updateProjectModel(projectId, {state: DeploymentState.FAILED});
        return false;
    }
};

export interface EnvFile {
    path: string;
    env: string;
    contents: string;
}

export const getReposEnvFiles = async (projectId: string): Promise<EnvFile[]> => {
    try {
        const project = await getProjectByIdModel(projectId);
        if (!project) throw new Error('Project not found');

        if (process.env.PRODUCTION !== 'true') {
            console.log('Not in production mode, skipping repository data retrieval');
            return [];
        }

        cloneRepository(projectId, project.repoOwner, project.repoName);
        const envPaths = getEnvFilesFromDir(`${process.env.WEBAPPS_PATH}/${projectId}`);
        const envFiles: EnvFile[] = envPaths.map((path) => ({
            path,
            env: path.split(`${process.env.WEBAPPS_PATH}/${projectId}`)[1].split('.env')[0],
            contents: getFileContents(path),
        }));

        return envFiles;
    } catch (error) {
        console.error('Error retrieving project:', error);
        return [];
    }
};

const getFileContents = (filePath: string): string => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping file retrieval');
        return '';
    }
    try {
        const fileContents = execSync(`cat ${filePath}`).toString();
        return fileContents;
    } catch (error) {
        console.error('Error retrieving file contents:', error);
        return '';
    }
};

const getEnvFilesFromDir = (dir: string): string[] => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping .env file retrieval');
        return [];
    }
    const envFiles = execSync(`find ${dir} -name ".env*"`).toString().trim().split('\n');
    return envFiles;
};

const cloneRepository = (projectId: string, repoOwner: string, repoName: string) => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping repository clone');
        return;
    }
    let dirExists = false;
    try {
        const stdout = execSync(`test -d ${process.env.WEBAPPS_PATH}/${projectId} && echo true`).toString().trim();
        dirExists = stdout === 'true';
    } catch (e) {
        dirExists = false;
    }
    if (!dirExists) {
        try {
            execSync(`rm -rf ${process.env.WEBAPPS_PATH}/${projectId}`);
        } catch (e) {
            console.error('Error removing directory:', e);
            return;
        }
    }

    try {
        const gitSshUri = `git@github.com:${repoOwner}/${repoName}.git`;
        execSync(`git clone -c core.sshCommand="/usr/bin/ssh -i ${process.env.GIT_SSH_KEY_PATH}" ${gitSshUri} ${process.env.WEBAPPS_PATH}/${projectId}`);
    } catch (e) {
        console.error('Error cloning repository:', e);
        return;
    }
};

const runDeploymentCommand = (projectId: string, runCommand: string) => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping deployment execution');
        return;
    }
    const deploymentCommand = `(cd ${process.env.WEBAPPS_PATH}/${projectId} && ${runCommand})`;
    try {
        const deploymentStdout = executeCommandOnHost(deploymentCommand);
        return deploymentStdout;
    } catch (e) {
        console.error('Error running deployment command:', deploymentCommand, e);
    }
};
