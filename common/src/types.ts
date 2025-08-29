export interface Project {
    id: string;
    repoOwner: string;
    repoName: string;
    runCommand: string;
    state?: DeploymentState;
    deploymentKey?: string;
    createdAt?: string;
    updatedAt?: string;
    allowCICD?: boolean;
    envs?: DotenvData[];
    deployLogs?: DeployLogHeader[];
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

export interface DeployLogHeader {
    id: string;
    createdAt: string;
    projectId: string;
    status: DeploymentState;
}
export interface DeploymentLog extends DeployLogHeader {
    log: string;
}

export enum DeploymentState {
    READY = 'ready',
    DEPLOYING = 'deploying',
    FAILED = 'failed',
    ACTIVE = 'active',
}
