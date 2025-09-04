import { DeployableProject } from './types';

// ===== ROUTES =====
export enum WORKER_ROUTES {
    //POST
    POST_DEPLOY_PROJECT = '/deploy',
    POST_FIND_NEXT_FREE_PORTS = '/findNextFreePort',
}
export interface WORKER_BODY {
    //POST
    [WORKER_ROUTES.POST_DEPLOY_PROJECT]: DeployableProject;
    [WORKER_ROUTES.POST_FIND_NEXT_FREE_PORTS]: { count: number };
}
export interface WORKER_RESPONSE {
    //POST
    [WORKER_ROUTES.POST_DEPLOY_PROJECT]: undefined;
    [WORKER_ROUTES.POST_FIND_NEXT_FREE_PORTS]: { ports: number[] | null };
}
