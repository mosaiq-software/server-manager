export interface Project {
    id: string;
    repoOwner: string;
    repoName: string;
    repoBranch?: string;
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
    repoBranch: string | undefined;
    timeout: number;
    logId: string;
    dotenv: string;
    nginxConf: string;
    domainsToCertify: string[];
}

export interface DeploymentLogUpdate {
    logId: string;
    status: DeploymentState;
    log: string;
}

export interface WorkerNode {
    workerId: string;
    address: string;
    port: number;
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
    type: NginxConfigLocationType.STATIC;
    path: string;
    serveDir: string;
    spa: boolean;
    explicitCors: boolean;
}
export interface ProxyConfigLocation {
    locationId: string;
    type: NginxConfigLocationType.PROXY;
    path: string;
    proxyPass: string;
    websocketSupport: boolean;
    timeout?: number;
    maxClientBodySizeMb?: number;
    replications?: number;
}
export interface RedirectConfigLocation {
    locationId: string;
    type: NginxConfigLocationType.REDIRECT;
    path: string;
    target: string;
}
export interface CustomConfigLocation {
    locationId: string;
    type: NginxConfigLocationType.CUSTOM;
    path: string;
    content: string;
}
export type ConfigLocation = StaticConfigLocation | ProxyConfigLocation | RedirectConfigLocation | CustomConfigLocation;
export interface ServerConfig {
    serverId: string;
    domain: string;
    wildcardSubdomain: boolean;
    locations: ConfigLocation[];
}

export interface ProjectNginxConfig {
    servers: ServerConfig[];
}

export enum UpperDynamicEnvVariableType {
    GENERAL = 'general',
    DOMAIN = 'domain',
}
export type DynamicEnvVariableType = UpperDynamicEnvVariableType | NginxConfigLocationType;
export enum DynamicEnvVariableFields {
    WORKER_NODE_ID = 'WorkerNodeId',
    DOMAIN = 'Domain',
    URL = 'URL',
    PATH = 'Path',
    DIRECTORY = 'Directory',
    PORT = 'Port',
    TARGET = 'Target',
    VOLUME = 'Volume',
}
export interface DynamicEnvVariable {
    path: string;
    type: DynamicEnvVariableType;
    placeholder?: string;
}
export interface RelativeDirectoryMap {
    [dynVarPath: string]: { relPath: string };
}
export interface FullDirectoryMap {
    [dynVarPath: string]: { fullPath: string };
}
