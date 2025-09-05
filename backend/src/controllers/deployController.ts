import { createDeploymentLogModel, updateDeploymentLogModel } from '@/persistence/deploymentLogPersistence';
import { getProjectByIdModel, updateProjectModelNoDirty } from '@/persistence/projectPersistence';
import { DeployableControlPlaneConfig, DeployableProject, DeploymentState, DynamicEnvVariableFields, FullDirectoryMap, NginxConfigLocationType, Project, ProxyConfigLocation, RelativeDirectoryMap, StaticConfigLocation } from '@mosaiq/nsm-common/types';
import { WORKER_BODY, WORKER_RESPONSE, WORKER_ROUTES } from '@mosaiq/nsm-common/workerRoutes';
import { getDotenvForProject } from './secretController';
import { getWorkerNodeById } from './workerNodeController';
import { getProject } from './projectController';
import { workerNodePost } from '@/utils/workerAPI';
import { stringifyDynamicVariablePath } from '@mosaiq/nsm-common/secretUtil';
import { buildNginxConfigForProject } from '@/utils/nginxUtils';

const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export const deployProject = async (projectId: string): Promise<string | undefined> => {
    let logId: string | undefined;
    try {
        const project = await getProject(projectId);
        if (!project) throw new Error('Project not found');

        if (project.state === DeploymentState.DEPLOYING) {
            return undefined;
        }
        if (!project.repoOwner || !project.repoName) {
            throw new Error('Project repository information incomplete');
        }
        if (!project.hasDockerCompose) {
            throw new Error('Project does not have a Docker Compose file in the repository root');
        }
        if (!project.workerNodeId) {
            throw new Error('No worker node assigned to project');
        }
        const workerNode = await getWorkerNodeById(project.workerNodeId);
        if (!workerNode) {
            throw new Error('Worker node not found');
        }
        const controlPlaneWorkerNodeId = process.env.CONTROL_PLANE_WORKER_ID;
        if (!controlPlaneWorkerNodeId) {
            throw new Error('No control plane worker node assigned in env');
        }
        const cpWorkerNode = await getWorkerNodeById(controlPlaneWorkerNodeId);
        if (!cpWorkerNode) {
            throw new Error('Control plane worker node not found');
        }

        logId = await createDeploymentLogModel(projectId, 'Starting deployment...\n', DeploymentState.DEPLOYING, project.workerNodeId);

        const requestedPorts = await requestPortsForProject(project);
        const ensuredDirs = await getDirectoryMapForProject(project);

        const dotenv = await getDotenvForProject(project, requestedPorts, ensuredDirs);
        const { conf: nginxConf, domains: nginxDomains } = getNginxConf(project, requestedPorts, ensuredDirs, workerNode.address);

        const runCommand = `docker compose -p ${project.id} up --build -d`;
        const deployable: DeployableProject = {
            projectId: project.id,
            runCommand: runCommand,
            repoName: project.repoName,
            repoOwner: project.repoOwner,
            repoBranch: project.repoBranch,
            timeout: project.timeout || DEFAULT_TIMEOUT,
            logId: logId,
            dotenv: dotenv,
        };
        const depConf: DeployableControlPlaneConfig = {
            projectId: project.id,
            nginxConf: nginxConf,
            domainsToCertify: nginxDomains,
            logId: logId,
        };
        await workerNodePost(project.workerNodeId, WORKER_ROUTES.POST_DEPLOY_PROJECT, deployable);
        await workerNodePost(cpWorkerNode.workerId, WORKER_ROUTES.POST_HANDLE_CONFIGS, depConf);
    } catch (error: any) {
        console.error('Error deploying project:', error);
        if (logId) {
            await updateDeploymentLog(logId, DeploymentState.FAILED, `Error deploying project: ${error.message}\n`);
        }
    }
    return logId;
};

export const updateDeploymentLog = async (logId: string, status: DeploymentState, logText: string) => {
    await updateDeploymentLogModel(logId, { status, log: logText });
    await updateProjectModelNoDirty(logId, { state: status });
};

const requestPortsForProject = async (project: Project): Promise<{ proxyLocationId: string; port: number }[]> => {
    if (!project.workerNodeId) {
        throw new Error('No worker node assigned to project');
    }

    const proxies = [];
    for (const server of project.nginxConfig?.servers || []) {
        for (const location of server.locations) {
            if (location.type === NginxConfigLocationType.PROXY) {
                proxies.push(location);
            }
        }
    }
    if (!proxies.length) {
        return [];
    }

    const ports = await workerNodePost(project.workerNodeId, WORKER_ROUTES.POST_FIND_NEXT_FREE_PORTS, { count: proxies.length });
    if (!ports) {
        throw new Error('Error calling worker node for ports');
    }
    if (!ports.ports) {
        throw new Error('No ports remaining on worker node');
    }
    if (ports.ports.length < proxies.length) {
        throw new Error('Not enough ports remaining on worker node');
    }
    return proxies.map((p, i) => ({ proxyLocationId: p.locationId, port: ports.ports![i] }));
};

const getDirectoryMapForProject = async (project: Project): Promise<FullDirectoryMap> => {
    if (!project.workerNodeId) {
        throw new Error('No worker node assigned to project');
    }

    const dirs: RelativeDirectoryMap = {};
    dirs[stringifyDynamicVariablePath(project.id, undefined, undefined, DynamicEnvVariableFields.VOLUME)] = { relPath: `/${project.id}/volume` };
    for (const server of project.nginxConfig?.servers || []) {
        for (const location of server.locations) {
            if (location.type === NginxConfigLocationType.STATIC) {
                dirs[stringifyDynamicVariablePath(project.id, server.serverId, location.locationId, DynamicEnvVariableFields.DIRECTORY)] = { relPath: `/${project.id}/www/${server.serverId}/${location.locationId}` };
            }
        }
    }

    try {
        const fullEnsuredPaths = await workerNodePost(project.workerNodeId, WORKER_ROUTES.POST_REQUEST_DIRECTORIES, dirs);
        if (!fullEnsuredPaths) {
            throw new Error('Error ensuring directories on worker node');
        }
        return fullEnsuredPaths;
    } catch (error) {
        console.error('Error ensuring directories:', error);
        throw error;
    }
};

const getNginxConf = (project: Project, requestedPorts: { proxyLocationId: string; port: number }[], ensuredDirs: FullDirectoryMap, workerAddress: string): { conf: string; domains: string[] } => {
    const domains: string[] = [];
    const projectDC = JSON.parse(JSON.stringify(project)) as Project;
    for (const server of projectDC.nginxConfig?.servers || []) {
        domains.push(server.domain);
        for (const location of server.locations) {
            if (location.type === NginxConfigLocationType.PROXY) {
                const req = requestedPorts.find((r) => r.proxyLocationId === location.locationId);
                if (req) {
                    (location as ProxyConfigLocation).proxyPass = `http://${workerAddress}:${req.port}`;
                }
            }
            if (location.type === NginxConfigLocationType.STATIC) {
                const dirVar = stringifyDynamicVariablePath(project.id, server.serverId, location.locationId, DynamicEnvVariableFields.DIRECTORY);
                if (ensuredDirs[dirVar]) {
                    (location as StaticConfigLocation).serveDir = ensuredDirs[dirVar].fullPath;
                }
            }
        }
    }
    const nginxConf = buildNginxConfigForProject(projectDC);
    return { conf: nginxConf, domains: domains };
};
