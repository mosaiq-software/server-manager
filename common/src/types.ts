export interface Project {
    id: string;
    repoOwner: string;
    repoName: string;
    runCommand: string;
    state?: DeploymentState;
    deploymentKey?: string;
    createdAt?: string;
    updatedAt?: string;
    envs?: DotenvData[];
}

export interface DotenvData {
    env: string;
    secrets: Secret[];
}

export interface Secret {
    projectId: string;
    env: string;
    secretName: string;
    secretValue: string;
    secretPlaceholder: string;
}

export interface DeploymentLog {
    id: string;
    projectId: string;
    status: DeploymentState;
    log: string;
}

export enum DeploymentState {
    READY = 'ready',
    DEPLOYING = 'deploying',
    FAILED = 'failed',
    ACTIVE = 'active',
}
