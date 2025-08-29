import { createDeploymentLogModel, updateDeploymentLogModel } from '@/persistence/deploymentLogPersistence';
import { getProjectByIdModel, updateProjectModel } from '@/persistence/projectPersistence';
import { executeCommandOnHost } from '@/utils/hostExecutor';
import { DeploymentState } from '@mosaiq/nsm-common/types';
import * as util from 'util';
import * as child_process from 'child_process';
const exec = util.promisify(child_process.exec);

export const deployProject = async (projectId: string): Promise<string | undefined> => {
    let logId: string | undefined;
    try {
        const project = await getProjectByIdModel(projectId);
        if (!project) throw new Error('Project not found');

        if (process.env.PRODUCTION !== 'true') {
            console.log('Not in production mode, skipping deployment');
            return undefined;
        }

        await updateProjectModel(projectId, {state: DeploymentState.DEPLOYING});
        logId = await createDeploymentLogModel(projectId, 'Starting deployment...', DeploymentState.DEPLOYING);

        const cloneStdout = await cloneRepository(projectId, project.repoOwner, project.repoName);
        await updateDeploymentLogModel(logId, {log: cloneStdout});
        const deployStdout = await runDeploymentCommand(projectId, project.runCommand);
        await updateProjectModel(projectId, {state: DeploymentState.ACTIVE});
        await updateDeploymentLogModel(logId, {log: deployStdout || 'Deployment completed without logs?!', status: DeploymentState.ACTIVE});
    } catch (error:any) {
        console.error('Error deploying project:', error);
        await updateProjectModel(projectId, {state: DeploymentState.FAILED});
        if (logId) {
            await updateDeploymentLogModel(logId, {log: "Error deploying project:\n"+error.message, status: DeploymentState.FAILED});
        }
    }
    return logId;
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
        const envPaths = await getEnvFilesFromDir(`${process.env.WEBAPPS_PATH}/${projectId}`);
        const envFiles: EnvFile[] = await Promise.all(envPaths.map(async (path) => ({
            path,
            env: path.split(`${process.env.WEBAPPS_PATH}/${projectId}`)[1].split('.env')[0],
            contents: await getFileContents(path),
        })));

        return envFiles;
    } catch (error) {
        console.error('Error retrieving project:', error);
        return [];
    }
};

const getFileContents = async (filePath: string): Promise   <string> => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping file retrieval');
        return '';
    }
    try {
        const { stdout } = await exec(`cat ${filePath}`);
        return stdout;
    } catch (error) {
        console.error('Error retrieving file contents:', error);
        return '';
    }
};

const getEnvFilesFromDir = async (dir: string): Promise<string[]> => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping .env file retrieval');
        return [];
    }
    const {stdout} = await exec(`find ${dir} -name ".env*"`);
    return stdout.trim().split('\n');
};

const cloneRepository = async (projectId: string, repoOwner: string, repoName: string) => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping repository clone');
        return;
    }
    
    try {
        const {stderr, stdout} = await exec(`rm -rf ${process.env.WEBAPPS_PATH}/${projectId}`);
        if (stderr) {
            console.error('Error removing directory:', stderr);
            return `Error removing directory: ${stderr}`;
        }
    } catch (e:any) {
        console.error('Error removing directory:', e);
        return `Error removing directory: ${e.message}`;
    }

    try {
        const gitSshUri = `git@github.com:${repoOwner}/${repoName}.git`;
        const {stderr, stdout} = await exec(`git clone -c core.sshCommand="/usr/bin/ssh -i ${process.env.GIT_SSH_KEY_PATH}" ${gitSshUri} ${process.env.WEBAPPS_PATH}/${projectId}`);
        if (stderr) {
            console.error('Error cloning repository:', stderr);
            return `Error cloning repository: ${stderr}`;
        }
        return stdout;
    } catch (e:any) {
        console.error('Error cloning repository:', e);
        return `Error cloning repository: ${e.message}`;
    }
};

const runDeploymentCommand = async (projectId: string, runCommand: string) => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping deployment execution');
        return;
    }
    const deploymentCommand = `(cd ${process.env.WEBAPPS_PATH}/${projectId} && ${runCommand})`;
    try {
        const deploymentStdout = await executeCommandOnHost(deploymentCommand);
        return deploymentStdout;
    } catch (e) {
        console.error('Error running deployment command:', deploymentCommand, e);
        throw e;
    }
};
