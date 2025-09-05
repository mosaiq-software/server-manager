import { DeployableControlPlaneConfig, DeployableProject, FullDirectoryMap, RelativeDirectoryMap } from './types';

// ===== ROUTES =====
export enum WORKER_ROUTES {
    //POST
    POST_DEPLOY_PROJECT = '/deploy',
    POST_FIND_NEXT_FREE_PORTS = '/findNextFreePort',
    POST_REQUEST_DIRECTORIES = '/requestDirectories',
    POST_HANDLE_CONFIGS = '/handleConfigs',
    POST_HEALTHCHECK = '/healthcheck',
}
export interface WORKER_BODY {
    //POST
    [WORKER_ROUTES.POST_DEPLOY_PROJECT]: DeployableProject;
    [WORKER_ROUTES.POST_FIND_NEXT_FREE_PORTS]: { count: number };
    [WORKER_ROUTES.POST_REQUEST_DIRECTORIES]: RelativeDirectoryMap;
    [WORKER_ROUTES.POST_HANDLE_CONFIGS]: DeployableControlPlaneConfig;
    [WORKER_ROUTES.POST_HEALTHCHECK]: undefined;
}
export interface WORKER_RESPONSE {
    //POST
    [WORKER_ROUTES.POST_DEPLOY_PROJECT]: undefined;
    [WORKER_ROUTES.POST_FIND_NEXT_FREE_PORTS]: { ports: number[] | null };
    [WORKER_ROUTES.POST_REQUEST_DIRECTORIES]: FullDirectoryMap;
    [WORKER_ROUTES.POST_HANDLE_CONFIGS]: undefined;
    [WORKER_ROUTES.POST_HEALTHCHECK]: undefined;
}
