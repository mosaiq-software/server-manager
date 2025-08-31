import { DeployableProject } from './types';

// ===== ROUTES =====
export enum WORKER_ROUTES {
    //POST
    POST_DEPLOY_PROJECT = '/deploy',
}
export interface WORKER_BODY {
    //POST
    [WORKER_ROUTES.POST_DEPLOY_PROJECT]: DeployableProject;
}
