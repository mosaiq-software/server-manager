import { ControlPlaneStatus, DeploymentLogUpdate, DeploymentState, Project, ProjectInstance, Secret, WorkerNode } from './types';

// ===== ROUTES =====
export enum API_ROUTES {
    // GET
    GET_DEPLOY = '/deploy/:projectId/:key',
    GET_DEPLOY_WEB = '/deployweb/:projectId/:key',
    GET_PROJECT = '/project/:projectId',
    GET_PROJECTS = '/projects',
    GET_PROJECT_INSTANCE = '/project-instance/:projectInstanceId',
    GET_WORKER_NODES = '/worker-nodes',
    GET_WORKER_STATUSES = '/worker-nodes/status',
    GET_CONTROL_PLANE_STATUS = '/control-plane/status',

    //POST
    POST_CREATE_PROJECT = '/project/create',
    POST_UPDATE_PROJECT = '/project/:projectId/update',
    POST_DELETE_PROJECT = '/project/:projectId/delete',
    POST_RESET_DEPLOYMENT_KEY = '/project/:projectId/reset-key',
    POST_UPDATE_ENV_VAR = '/project/:projectId/updateEnvVar',
    POST_SYNC_TO_REPO = '/project/:projectId/sync-to-repo',
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
    [API_ROUTES.GET_PROJECT_INSTANCE]: { projectInstanceId: string };
    [API_ROUTES.GET_WORKER_NODES]: {};
    [API_ROUTES.GET_WORKER_STATUSES]: {};
    [API_ROUTES.GET_CONTROL_PLANE_STATUS]: {};

    //POST
    [API_ROUTES.POST_CREATE_PROJECT]: {};
    [API_ROUTES.POST_UPDATE_PROJECT]: { projectId: string };
    [API_ROUTES.POST_DELETE_PROJECT]: { projectId: string };
    [API_ROUTES.POST_RESET_DEPLOYMENT_KEY]: { projectId: string };
    [API_ROUTES.POST_UPDATE_ENV_VAR]: { projectId: string };
    [API_ROUTES.POST_SYNC_TO_REPO]: { projectId: string };
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
    [API_ROUTES.GET_PROJECT_INSTANCE]: undefined;
    [API_ROUTES.GET_WORKER_NODES]: undefined;
    [API_ROUTES.GET_WORKER_STATUSES]: undefined;
    [API_ROUTES.GET_CONTROL_PLANE_STATUS]: undefined;

    //POST
    [API_ROUTES.POST_CREATE_PROJECT]: Project;
    [API_ROUTES.POST_UPDATE_PROJECT]: Partial<Project>;
    [API_ROUTES.POST_DELETE_PROJECT]: {};
    [API_ROUTES.POST_RESET_DEPLOYMENT_KEY]: {};
    [API_ROUTES.POST_UPDATE_ENV_VAR]: Secret;
    [API_ROUTES.POST_SYNC_TO_REPO]: {};
    [API_ROUTES.POST_DEPLOYMENT_LOG_UPDATE]: DeploymentLogUpdate;
    [API_ROUTES.POST_CREATE_WORKER_NODE]: { workerId: string; address: string; port: number };
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
    [API_ROUTES.GET_PROJECT_INSTANCE]: ProjectInstance | undefined;
    [API_ROUTES.GET_WORKER_NODES]: WorkerNode[] | undefined;
    [API_ROUTES.GET_WORKER_STATUSES]: undefined; //TODO
    [API_ROUTES.GET_CONTROL_PLANE_STATUS]: ControlPlaneStatus | undefined;

    //POST
    [API_ROUTES.POST_CREATE_PROJECT]: Project;
    [API_ROUTES.POST_UPDATE_PROJECT]: undefined;
    [API_ROUTES.POST_DELETE_PROJECT]: undefined;
    [API_ROUTES.POST_RESET_DEPLOYMENT_KEY]: string | undefined;
    [API_ROUTES.POST_UPDATE_ENV_VAR]: undefined;
    [API_ROUTES.POST_SYNC_TO_REPO]: Project | undefined;
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
    [API_ROUTES.GET_PROJECT_INSTANCE]: string;
    [API_ROUTES.GET_WORKER_NODES]: string;
    [API_ROUTES.GET_WORKER_STATUSES]: string;
    [API_ROUTES.GET_CONTROL_PLANE_STATUS]: string;

    //POST
    [API_ROUTES.POST_CREATE_PROJECT]: string;
    [API_ROUTES.POST_UPDATE_PROJECT]: string;
    [API_ROUTES.POST_DELETE_PROJECT]: string;
    [API_ROUTES.POST_RESET_DEPLOYMENT_KEY]: string;
    [API_ROUTES.POST_UPDATE_ENV_VAR]: string;
    [API_ROUTES.POST_SYNC_TO_REPO]: string;
    [API_ROUTES.POST_DEPLOYMENT_LOG_UPDATE]: string;
    [API_ROUTES.POST_CREATE_WORKER_NODE]: string;
    [API_ROUTES.POST_UPDATE_WORKER_NODE]: string;
    [API_ROUTES.POST_DELETE_WORKER_NODE]: string;
    [API_ROUTES.POST_REGENERATE_WORKER_NODE_KEY]: string;
}
