import { DockerCompose } from './dockerComposeTypes';

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
    instances?: ProjectInstanceHeader[];
    timeout?: number;
    dirtyConfig?: boolean;
    nginxConfig?: ProjectNginxConfig;
    dockerCompose?: DockerCompose;
    services?: ProjectService[];
    workerNodeId?: string;
    hasDockerCompose?: boolean;
    hasDotenv?: boolean;
}

export interface Secret {
    projectId: string;
    secretName: string;
    secretValue: string;
    secretPlaceholder: string;
    variable: boolean;
}

export interface ProjectInstanceHeader {
    id: string;
    projectId: string;
    workerNodeId: string;
    state: DeploymentState;
    created: number;
    lastUpdated: number;
    active: boolean;
    directories: FullDirectoryMap;
}
export interface ProjectInstance extends ProjectInstanceHeader {
    deploymentLog: string;
    services: ProjectServiceInstance[];
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
    repoOwner: string;
    repoName: string;
    repoBranch: string | undefined;
    timeout: number;
    logId: string;
    dotenv: string;
    compose: string;
    services: ProjectServiceInstance[];
}
export interface DeployableControlPlaneConfig {
    projectId: string;
    nginxConf: string;
    domainsToCertify: string[];
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
    port: number;
    authToken: string;
    status?: WorkerStatus;
    isControlPlaneWorker: boolean;
}
export enum WorkerStatus {
    UNKNOWN = 'unknown',
    ONLINE_STABLE = 'online',
    ONLINE_ERROR = 'online_error',
    UNREACHABLE = 'unreachable',
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

export enum UriStatus {
    UNKNOWN = 'unknown', // initial state, not yet checked
    REACHABLE = 'reachable', // last check was successful, 100-300
    UNREACHABLE = 'unreachable', // last check failed
    ERROR = 'error', // last check resulted in an error 400-599
}
export enum DockerStatus {
    UNKNOWN = 'unknown', // initial state, not yet checked
    CREATED = 'created', // A container that has never been started.
    RUNNING = 'running', // A running container, started by either docker start or docker run.
    PAUSED = 'paused', // A paused container. See docker pause.
    RESTARTING = 'restarting', // A container which is starting due to the designated restart policy for that container.
    EXITED = 'exited', // A container which is no longer running. For example, the process inside the container completed or the container was stopped using the docker stop command.
    REMOVING = 'removing', // A container which is in the process of being removed. See docker rm.
    DEAD = 'dead', // A "defunct" container; for example, a container that was only partially removed because resources were kept busy by an external process. dead containers cannot be (re)started, only removed.
}

export interface ProjectService {
    serviceName: string;
    expectedContainerState: DockerStatus;
    collectContainerLogs: boolean;
}
export interface ProjectServiceInstance extends ProjectService {
    instanceId: string;
    projectInstanceId: string;
    containerId: string | undefined;
    actualContainerState: DockerStatus;
    containerLogs: string;
    created: number;
    lastUpdated: number;
}

export interface DockerContainerData {
    Command: string;
    CreatedAt: string;
    ID: string;
    Image: string;
    Labels: { [key: string]: string };
    LocalVolumes: string;
    Mounts: string;
    Names: string;
    Networks: string;
    Ports: string;
    RunningFor: string;
    Size: string;
    State: string;
    Status: string;
}

export interface ControlPlaneStatus {
    lastHeartbeat: number;
    containerLog: string;
    incidents: ControlPlaneIncident[];
}
export interface ControlPlaneIncident {
    id: string;
    from: number;
    to: number;
}
