export interface Project {
    id: string;
    repoOwner: string;
    repoName: string;
    runCommand: string;
    state?: DeploymentState;
    deploymentKey?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Secret {
    projectId: string;
    env: string;
    secretName: string;
    secretValue: string;
    secretPlaceholder: string;
}


export enum DeploymentState {
    READY = 'ready',
    DEPLOYING = 'deploying',
    FAILED = 'failed',
    ACTIVE = 'active'
}