import { createProject, deleteProject, getAllProjects, getProject, resetDeploymentKey, syncProjectToRepoData, updateProject, verifyDeploymentKey } from '@/controllers/projectController';
import { deployProject, updateDeploymentLog } from '@/controllers/deployController';
import { API_BODY, API_PARAMS, API_RETURN, API_ROUTES } from '@mosaiq/nsm-common/routes';
import express from 'express';
import { DeploymentState } from '@mosaiq/nsm-common/types';
import { updateEnvironmentVariable } from '@/controllers/secretController';
import { createWorkerNode, deleteWorkerNode, getAllWorkerNodes, regenerateWorkerNodeKey, updateWorkerNode } from './controllers/workerNodeController';
import { getProjectInstanceByIdModel } from './persistence/projectInstancePersistence';
import { getProjectInstance } from './controllers/projectInstanceController';
import { logContainerStatusesForAllWorkers } from './controllers/statusController';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        res.status(200).send('Hello from the NSM API');
    } catch (error) {
        console.error(error);
        res.status(500).send();
    }
});

router.get(API_ROUTES.GET_DEPLOY, async (req, res) => {
    const params = req.params as API_PARAMS[API_ROUTES.GET_DEPLOY];
    try {
        if (!params.projectId) {
            res.status(400).send('No projectId');
            return;
        }
        if (!params.key) {
            res.status(401).send('Unauthorized');
            return;
        }
        if (!(await verifyDeploymentKey(params.projectId, params.key, false))) {
            res.status(403).send('Forbidden');
            return;
        }
        await deployProject(params.projectId);
        const response: API_RETURN[API_ROUTES.GET_DEPLOY] = undefined;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error getting user', e);
        res.status(500).send();
    }
});

router.get(API_ROUTES.GET_DEPLOY_WEB, async (req, res) => {
    const params = req.params as API_PARAMS[API_ROUTES.GET_DEPLOY_WEB];
    try {
        if (!params.projectId) {
            res.status(400).send('No projectId');
            return;
        }
        if (!params.key) {
            res.status(401).send('Unauthorized');
            return;
        }
        if (!(await verifyDeploymentKey(params.projectId, params.key, true))) {
            res.status(403).send('Forbidden');
            return;
        }
        const logId = await deployProject(params.projectId);
        const response: API_RETURN[API_ROUTES.GET_DEPLOY_WEB] = logId;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error getting user', e);
        res.status(500).send();
    }
});

router.get(API_ROUTES.GET_PROJECT, async (req, res) => {
    const params = req.params as API_PARAMS[API_ROUTES.GET_PROJECT];
    try {
        if (!params.projectId) {
            res.status(400).send('No projectId');
            return;
        }
        const project = await getProject(params.projectId);
        if (!project) {
            res.status(404).send('Project not found');
            return;
        }
        const response: API_RETURN[API_ROUTES.GET_PROJECT] = project;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error getting project', e);
        res.status(500).send();
    }
});

router.get(API_ROUTES.GET_PROJECTS, async (req, res) => {
    try {
        const projects = await getAllProjects();
        const response: API_RETURN[API_ROUTES.GET_PROJECTS] = projects;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error getting projects', e);
        res.status(500).send();
    }
});

router.get(API_ROUTES.GET_PROJECT_INSTANCE, async (req, res) => {
    const params = req.params as API_PARAMS[API_ROUTES.GET_PROJECT_INSTANCE];
    try {
        if (!params.projectInstanceId) {
            res.status(400).send('No projectInstanceId');
            return;
        }
        const projectInstance = await getProjectInstance(params.projectInstanceId);
        if (!projectInstance) {
            res.status(404).send('Project instance not found');
            return;
        }
        const response: API_RETURN[API_ROUTES.GET_PROJECT_INSTANCE] = projectInstance;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error getting project instance', e);
        res.status(500).send();
    }
});

router.get(API_ROUTES.GET_WORKER_NODES, async (req, res) => {
    try {
        const workerNodes = await getAllWorkerNodes();
        const response: API_RETURN[API_ROUTES.GET_WORKER_NODES] = workerNodes;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error getting worker nodes', e);
        res.status(500).send();
    }
});

router.get(API_ROUTES.GET_WORKER_STATUSES, async (req, res) => {
    try {
        const workerStatuses = await logContainerStatusesForAllWorkers();
        const response: API_RETURN[API_ROUTES.GET_WORKER_STATUSES] = workerStatuses;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error getting worker statuses', e);
        res.status(500).send();
    }
});

router.post(API_ROUTES.POST_CREATE_PROJECT, async (req, res) => {
    const body = req.body as API_BODY[API_ROUTES.POST_CREATE_PROJECT];
    try {
        if (!body || !body.id || !body.repoOwner || !body.repoName) {
            res.status(400).send('Invalid request body');
            return;
        }
        const project = await createProject(body);
        const response: API_RETURN[API_ROUTES.POST_CREATE_PROJECT] = project;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error resetting deployment key', e);
        res.status(500).send();
    }
});

router.post(API_ROUTES.POST_UPDATE_PROJECT, async (req, res) => {
    const body = req.body as API_BODY[API_ROUTES.POST_UPDATE_PROJECT];
    const params = req.params as API_PARAMS[API_ROUTES.POST_UPDATE_PROJECT];
    try {
        if (!params.projectId) {
            res.status(400).send('No projectId');
            return;
        }
        await updateProject(params.projectId, body);
        const response: API_RETURN[API_ROUTES.POST_UPDATE_PROJECT] = undefined;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error updating project', e);
        res.status(500).send();
    }
});

router.post(API_ROUTES.POST_DELETE_PROJECT, async (req, res) => {
    const params = req.params as API_PARAMS[API_ROUTES.POST_DELETE_PROJECT];
    try {
        if (!params.projectId) {
            res.status(400).send('No projectId');
            return;
        }
        await deleteProject(params.projectId);
        const response: API_RETURN[API_ROUTES.POST_DELETE_PROJECT] = undefined;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error deleting project', e);
        res.status(500).send();
    }
});

router.post(API_ROUTES.POST_RESET_DEPLOYMENT_KEY, async (req, res) => {
    const params = req.params as API_PARAMS[API_ROUTES.POST_RESET_DEPLOYMENT_KEY];
    try {
        const newKey = await resetDeploymentKey(params.projectId);
        if (!newKey) {
            res.status(404).send('Project not found');
            return;
        }
        const response: API_RETURN[API_ROUTES.POST_RESET_DEPLOYMENT_KEY] = newKey;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error resetting deployment key', e);
        res.status(500).send();
    }
});

router.post(API_ROUTES.POST_UPDATE_ENV_VAR, async (req, res) => {
    const params = req.params as API_PARAMS[API_ROUTES.POST_UPDATE_ENV_VAR];
    const body = req.body as API_BODY[API_ROUTES.POST_UPDATE_ENV_VAR];
    try {
        if (!params.projectId || !body.secretName) {
            res.status(400).send('Invalid request');
            return;
        }
        await updateEnvironmentVariable(params.projectId, body);
        res.status(200).send('Environment variable updated');
    } catch (e: any) {
        console.error('Error updating environment variable', e);
        res.status(500).send();
    }
});

router.post(API_ROUTES.POST_SYNC_TO_REPO, async (req, res) => {
    const params = req.params as API_PARAMS[API_ROUTES.POST_SYNC_TO_REPO];
    try {
        if (!params.projectId) {
            res.status(400).send('No projectId');
            return;
        }
        const project = await syncProjectToRepoData(params.projectId);
        if (!project) {
            res.status(404).send('Project not found');
            return;
        }
        const response: API_RETURN[API_ROUTES.POST_SYNC_TO_REPO] = project;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error syncing project to repo data', e);
        res.status(500).send();
    }
});

router.post(API_ROUTES.POST_DEPLOYMENT_LOG_UPDATE, async (req, res) => {
    const body = req.body as API_BODY[API_ROUTES.POST_DEPLOYMENT_LOG_UPDATE];
    try {
        if (!body || !body.logId || !body.status) {
            res.status(400).send('Invalid request body');
            return;
        }
        await updateDeploymentLog(body.logId, body.status, body.log);
        const response: API_RETURN[API_ROUTES.POST_DEPLOYMENT_LOG_UPDATE] = undefined;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error updating deployment log', e);
        res.status(500).send();
    }
});

router.post(API_ROUTES.POST_CREATE_WORKER_NODE, async (req, res) => {
    const body = req.body as API_BODY[API_ROUTES.POST_CREATE_WORKER_NODE];
    try {
        if (!body || !body.workerId || !body.address) {
            res.status(400).send('Invalid request body');
            return;
        }
        const workerNode = await createWorkerNode(body.workerId, body.address, body.port);
        const response: API_RETURN[API_ROUTES.POST_CREATE_WORKER_NODE] = workerNode;
        res.status(201).json(response);
    } catch (e: any) {
        console.error('Error creating worker node', e);
        res.status(500).send();
    }
});

router.post(API_ROUTES.POST_UPDATE_WORKER_NODE, async (req, res) => {
    const body = req.body as API_BODY[API_ROUTES.POST_UPDATE_WORKER_NODE];
    const params = req.params as API_PARAMS[API_ROUTES.POST_UPDATE_WORKER_NODE];
    try {
        if (!params.workerId) {
            res.status(400).send('Invalid request');
            return;
        }
        await updateWorkerNode(params.workerId, body);
        const response: API_RETURN[API_ROUTES.POST_UPDATE_WORKER_NODE] = undefined;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error updating worker node', e);
        res.status(500).send();
    }
});

router.post(API_ROUTES.POST_DELETE_WORKER_NODE, async (req, res) => {
    const params = req.params as API_PARAMS[API_ROUTES.POST_DELETE_WORKER_NODE];
    try {
        if (!params.workerId) {
            res.status(400).send('Invalid request');
            return;
        }
        await deleteWorkerNode(params.workerId);
        const response: API_RETURN[API_ROUTES.POST_DELETE_WORKER_NODE] = undefined;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error deleting worker node', e);
        res.status(500).send();
    }
});

router.post(API_ROUTES.POST_REGENERATE_WORKER_NODE_KEY, async (req, res) => {
    const params = req.params as API_PARAMS[API_ROUTES.POST_REGENERATE_WORKER_NODE_KEY];
    try {
        if (!params.workerId) {
            res.status(400).send('Invalid request');
            return;
        }
        const newKey = await regenerateWorkerNodeKey(params.workerId);
        const response: API_RETURN[API_ROUTES.POST_REGENERATE_WORKER_NODE_KEY] = newKey;
        res.status(200).json(response);
    } catch (e: any) {
        console.error('Error regenerating worker node key', e);
        res.status(500).send();
    }
});

export default router;
