export interface Project {
    id: string;
    repoOwner: string;
    repoName: string;
    state?: DeploymentState;
    deploymentKey?: string;
    createdAt?: string;
    updatedAt?: string;
    allowCICD?: boolean;
    secrets?: Secret[];
    deployLogs?: DeployLogHeader[];
    timeout?: number;
    dirtyConfig?: boolean;
}

export interface Secret {
    projectId: string;
    secretName: string;
    secretValue: string;
    secretPlaceholder: string;
    variable: boolean;
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
    DEPLOYED = 'deployed',
    HEALTHY = 'healthy',
    DESTROYING = 'destroying',
}

export interface DeployableProject {
    projectId: string;
    runCommand: string;
    repoOwner: string;
    repoName: string;
    dotenv: string;
    timeout: number;
    logId: string;
}

export interface DeploymentLogUpdate {
    logId: string;
    status: DeploymentState;
    log: string;
}

export interface WorkerNode {
    workerId: string;
    workerUrl: string;
    authToken: string;
}
