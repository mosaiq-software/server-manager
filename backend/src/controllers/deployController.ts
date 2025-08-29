import { createDeploymentLogModel, updateDeploymentLogModel } from '@/persistence/deploymentLogPersistence';
import { getProjectByIdModel, updateProjectModel } from '@/persistence/projectPersistence';
import { execSafe, execSafeOnHost } from '@/utils/execUtils';
import { DeploymentState } from '@mosaiq/nsm-common/types';

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

        await cloneRepository(projectId, project.repoOwner, project.repoName, logId);
        await runDeploymentCommand(projectId, project.runCommand, logId);
        await updateProjectModel(projectId, {state: DeploymentState.ACTIVE});
        await updateDeploymentLogModel(logId, {log: "Deployment complete!", status: DeploymentState.ACTIVE});
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

        await cloneRepository(projectId, project.repoOwner, project.repoName);
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
        const { out:catOut, code:catCode } = await execSafe(`cat ${filePath}`);
        if (catCode !== 0) {
            console.error('Error retrieving file contents:', catOut);
            return '';
        }
        return catOut;
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
    const {out:findOut, code:findCode} = await execSafe(`find ${dir} -name ".env*"`);
    if (findCode !== 0) {
        console.error('Error finding .env files:', findOut);
        return [];
    }
    return findOut.trim().split('\n');
};

const cloneRepository = async (projectId: string, repoOwner: string, repoName: string, logId?: string): Promise<void> => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping repository clone');
        return;
    }
    
    try {
        const {out:rmOut, code:rmCode} = await execSafe(`rm -rf ${process.env.WEBAPPS_PATH}/${projectId}`);
        if(logId){
            await updateDeploymentLogModel(logId, {log: rmOut});
        }
        if (rmCode !== 0) {
            throw new Error(`Remove directory exited with code ${rmCode}`);
        }
    } catch (e:any) {
        console.error('Error removing directory:', e);
        if(logId){
            await updateDeploymentLogModel(logId, {log: `Error removing directory: ${e.message}`});
        }
        return;
    }

    try {
        const gitSshUri = `git@github.com:${repoOwner}/${repoName}.git`;
        const cmd = `git clone --progress -c core.sshCommand="/usr/bin/ssh -i ${process.env.GIT_SSH_KEY_PATH}" ${gitSshUri} ${process.env.WEBAPPS_PATH}/${projectId}`;
        const {out:gitOut, code:gitCode} = await execSafe(cmd, 1000 * 60 * 5);
        if(logId){
            await updateDeploymentLogModel(logId, {log: gitOut});
        }
        if (gitCode !== 0) {
            throw new Error(`Git clone exited with code ${gitCode}`);
        }
        return;
    } catch (e:any) {
        console.error('Error cloning repository:', e);
        if(logId){
            await updateDeploymentLogModel(logId, {log: `Error cloning repository: ${e.message}`});
        }
        throw e;
    }
};

const runDeploymentCommand = async (projectId: string, runCommand: string, logId?: string): Promise<void> => {
    if (process.env.PRODUCTION !== 'true') {
        console.log('Not in production mode, skipping deployment execution');
        return;
    }
    const deploymentCommand = `(cd ${process.env.WEBAPPS_PATH}/${projectId} && ${runCommand})`;
    try {
        const deploymentStdout = await execSafeOnHost(deploymentCommand);
        if (logId) {
            await updateDeploymentLogModel(logId, {log: deploymentStdout});
        }
        if (deploymentStdout.code !== 0) {
            throw new Error(`Deployment command exited with code ${deploymentStdout.code}`);
        }
    } catch (e:any) {
        console.error('Error running deployment command:', deploymentCommand, e);
        if (logId) {
            await updateDeploymentLogModel(logId, {log: `Error running deployment command: ${e.message}`});
        }
        throw e;
    }
};
