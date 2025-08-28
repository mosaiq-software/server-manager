import { getProjectByIdModel } from '@/persistence/projectPersistence';
import { executeCommandOnHost } from '@/utils/hostExecutor';
import { execSync } from 'child_process';



export const deployProject = async (projectId: string): Promise<void> => {
    try {
        const project = await getProjectByIdModel(projectId);
        if (!project) throw new Error('Project not found');

        if (process.env.PRODUCTION !== 'true') {
            console.log('Not in production mode, skipping GitHub fingerprint application');
            return;
        }

        // Get the repository loaded into the working directory
        const webappsDir = process.env.WEBAPPS_PATH;
        try {
            execSync(`cd ${webappsDir}`);
        } catch (error) {
            console.error('Error changing directory:', error);
            return;
        }
        let dirExists = false;
        try {
            const stdout = execSync(`test -d ./${projectId} && echo true`).toString().trim();
            dirExists = stdout === "true";
        } catch (e) {
            dirExists = false;
        }
        if (!dirExists) {
            try {
                execSync(`rm -rf ${webappsDir}/${projectId}`);
            } catch (e) {
                console.error('Error removing directory:', e);
                return;
            }
        }

        try {
            const gitSshUri = `git@github.com:${project.repoOwner}/${project.repoName}.git`;
            execSync(`git clone -c core.sshCommand="/usr/bin/ssh -i ${process.env.GIT_SSH_KEY_PATH}" ${gitSshUri} ${webappsDir}/${projectId}`);
        } catch (e) {
            console.error('Error cloning repository:', e);
            return;
        }

        // Run the deployment command
        const deploymentCommand = `cd ${webappsDir}/${projectId} && ${project.runCommand}`;
        try {
            const deploymentStdout = executeCommandOnHost(deploymentCommand);
            console.log('Deployment output:', deploymentStdout);

        } catch (e) {
            console.error('Error running deployment command:', deploymentCommand, e);
            return;
        }
    } catch (error) {
        console.error('Error deploying project:', error);
    }
};
