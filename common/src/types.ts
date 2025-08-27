export interface Project {
    id: string;
    state: DeploymentState;
    repositoryUrl: string;
    deploymentKey: string;
    runCommand: string;
    createdAt?: string;
    updatedAt?: string;
}


export enum DeploymentState {
    READY = 'ready',
    DEPLOYING = 'deploying',
    FAILED = 'failed',
    ACTIVE = 'active'
}