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
    nginxConfig?: ProjectNginxConfig;
    dynamicEnvVariables?: DynamicEnvVariable[];
    workerNodeId?: string;
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
    address: string;
    authToken: string;
}

export enum NginxConfigLocationType {
    STATIC = 'static',
    PROXY = 'proxy',
    REDIRECT = 'redirect',
    CUSTOM = 'custom',
}

export interface StaticConfigLocation {
    locationId: string;
    index: number;
    type: NginxConfigLocationType.STATIC;
    path: string;
    serveDir: string;
    spa: boolean;
    explicitCors: boolean;
}
export interface ProxyConfigLocation {
    locationId: string;
    index: number;
    type: NginxConfigLocationType.PROXY;
    path: string;
    proxyPass: string;
    websocketSupport: boolean;
    timeout?: number;
    maxClientBodySizeMb?: number;
}
export interface RedirectConfigLocation {
    locationId: string;
    index: number;
    type: NginxConfigLocationType.REDIRECT;
    path: string;
    target: string;
}
export interface CustomConfigLocation {
    locationId: string;
    index: number;
    type: NginxConfigLocationType.CUSTOM;
    path: string;
    content: string;
}
export type ConfigLocation = StaticConfigLocation | ProxyConfigLocation | RedirectConfigLocation | CustomConfigLocation;
export interface ServerConfig {
    serverId: string;
    index: number;
    domain: string;
    wildcardSubdomain: boolean;
    locations: ConfigLocation[];
}

export interface ProjectNginxConfig {
    servers: ServerConfig[];
}

export interface DynamicEnvVariable {
    parent: string;
    field: string;
    placeholder?: string;
}
