import { DeploymentLog, DeploymentLogUpdate, DeploymentState, Project, WorkerNode } from './types';

// ===== ROUTES =====
export enum API_ROUTES {
    // GET
    GET_DEPLOY = '/deploy/:projectId/:key',
    GET_DEPLOY_WEB = '/deployweb/:projectId/:key',
    GET_PROJECT = '/project/:projectId',
    GET_PROJECTS = '/projects',
    GET_DEPLOY_LOG = '/deploy/:deployLogId',
    GET_WORKER_NODES = '/worker-nodes',

    //POST
    POST_CREATE_PROJECT = '/project/create',
    POST_UPDATE_PROJECT = '/project/:projectId/update',
    POST_RESET_DEPLOYMENT_KEY = '/project/:projectId/reset-key',
    POST_UPDATE_ENV_VAR = '/project/:projectId/updateEnvVar',
    POST_DEPLOYMENT_LOG_UPDATE = '/deploy/update',
    POST_CREATE_WORKER_NODE = '/worker-nodes/create',
    POST_UPDATE_WORKER_NODE = '/worker-nodes/:workerId/update',
    POST_DELETE_WORKER_NODE = '/worker-nodes/:workerId/delete',
    POST_REGENERATE_WORKER_NODE_KEY = '/worker-nodes/:workerId/regenerate-key',
}
export interface API_PARAMS {
    //GET
    [API_ROUTES.GET_DEPLOY]: { projectId: string; key: string };
    [API_ROUTES.GET_DEPLOY_WEB]: { projectId: string; key: string };
    [API_ROUTES.GET_PROJECT]: { projectId: string };
    [API_ROUTES.GET_PROJECTS]: {};
    [API_ROUTES.GET_DEPLOY_LOG]: { deployLogId: string };
    [API_ROUTES.GET_WORKER_NODES]: {};

    //POST
    [API_ROUTES.POST_CREATE_PROJECT]: {};
    [API_ROUTES.POST_UPDATE_PROJECT]: { projectId: string };
    [API_ROUTES.POST_RESET_DEPLOYMENT_KEY]: { projectId: string };
    [API_ROUTES.POST_UPDATE_ENV_VAR]: { projectId: string };
    [API_ROUTES.POST_DEPLOYMENT_LOG_UPDATE]: {};
    [API_ROUTES.POST_CREATE_WORKER_NODE]: {};
    [API_ROUTES.POST_UPDATE_WORKER_NODE]: { workerId: string };
    [API_ROUTES.POST_DELETE_WORKER_NODE]: { workerId: string };
    [API_ROUTES.POST_REGENERATE_WORKER_NODE_KEY]: { workerId: string };
}
export interface API_BODY {
    // Only POST
    // GET
    [API_ROUTES.GET_DEPLOY]: undefined;
    [API_ROUTES.GET_DEPLOY_WEB]: undefined;
    [API_ROUTES.GET_PROJECT]: undefined;
    [API_ROUTES.GET_PROJECTS]: undefined;
    [API_ROUTES.GET_DEPLOY_LOG]: undefined;
    [API_ROUTES.GET_WORKER_NODES]: undefined;

    //POST
    [API_ROUTES.POST_CREATE_PROJECT]: Project;
    [API_ROUTES.POST_UPDATE_PROJECT]: Partial<Project>;
    [API_ROUTES.POST_RESET_DEPLOYMENT_KEY]: {};
    [API_ROUTES.POST_UPDATE_ENV_VAR]: { value: string; varName: string };
    [API_ROUTES.POST_DEPLOYMENT_LOG_UPDATE]: DeploymentLogUpdate;
    [API_ROUTES.POST_CREATE_WORKER_NODE]: { workerId: string; address: string };
    [API_ROUTES.POST_UPDATE_WORKER_NODE]: Partial<WorkerNode>;
    [API_ROUTES.POST_DELETE_WORKER_NODE]: {};
    [API_ROUTES.POST_REGENERATE_WORKER_NODE_KEY]: {};
}
export interface API_RETURN {
    //GET
    [API_ROUTES.GET_DEPLOY]: undefined;
    [API_ROUTES.GET_DEPLOY_WEB]: string | undefined;
    [API_ROUTES.GET_PROJECT]: Project | undefined;
    [API_ROUTES.GET_PROJECTS]: Project[];
    [API_ROUTES.GET_DEPLOY_LOG]: DeploymentLog | undefined;
    [API_ROUTES.GET_WORKER_NODES]: WorkerNode[] | undefined;

    //POST
    [API_ROUTES.POST_CREATE_PROJECT]: undefined;
    [API_ROUTES.POST_UPDATE_PROJECT]: undefined;
    [API_ROUTES.POST_RESET_DEPLOYMENT_KEY]: string | undefined;
    [API_ROUTES.POST_UPDATE_ENV_VAR]: undefined;
    [API_ROUTES.POST_DEPLOYMENT_LOG_UPDATE]: undefined;
    [API_ROUTES.POST_CREATE_WORKER_NODE]: WorkerNode | undefined;
    [API_ROUTES.POST_UPDATE_WORKER_NODE]: undefined;
    [API_ROUTES.POST_DELETE_WORKER_NODE]: undefined;
    [API_ROUTES.POST_REGENERATE_WORKER_NODE_KEY]: string | undefined;
}

export interface API_AUTH {
    // Set to string if it needs an auth token, leave out else
    //GET
    [API_ROUTES.GET_DEPLOY]: undefined;
    [API_ROUTES.GET_DEPLOY_WEB]: string;
    [API_ROUTES.GET_PROJECT]: string;
    [API_ROUTES.GET_PROJECTS]: string;
    [API_ROUTES.GET_DEPLOY_LOG]: string;
    [API_ROUTES.GET_WORKER_NODES]: string;

    //POST
    [API_ROUTES.POST_CREATE_PROJECT]: string;
    [API_ROUTES.POST_UPDATE_PROJECT]: string;
    [API_ROUTES.POST_RESET_DEPLOYMENT_KEY]: string;
    [API_ROUTES.POST_UPDATE_ENV_VAR]: string;
    [API_ROUTES.POST_DEPLOYMENT_LOG_UPDATE]: string;
    [API_ROUTES.POST_CREATE_WORKER_NODE]: string;
    [API_ROUTES.POST_UPDATE_WORKER_NODE]: string;
    [API_ROUTES.POST_DELETE_WORKER_NODE]: string;
    [API_ROUTES.POST_REGENERATE_WORKER_NODE_KEY]: string;
}
