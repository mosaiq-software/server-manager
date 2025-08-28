import { DeploymentState, Project } from "./types";

// ===== ROUTES =====
export enum API_ROUTES {
    // GET
    GET_DEPLOY = '/deploy/:projectId/:key',
    GET_PROJECT = '/project/:projectId',
    GET_PROJECTS = '/projects',

    //POST
    POST_CREATE_PROJECT = '/project/create',
    POST_UPDATE_PROJECT = '/project/:projectId/update',
    POST_RESET_DEPLOYMENT_KEY = '/project/:projectId/reset-key',
}
export interface API_PARAMS {
    //GET
    [API_ROUTES.GET_DEPLOY]: { projectId: string; key: string };
    [API_ROUTES.GET_PROJECT]: { projectId: string };
    [API_ROUTES.GET_PROJECTS]: {};

    //POST
    [API_ROUTES.POST_CREATE_PROJECT]: {};
    [API_ROUTES.POST_UPDATE_PROJECT]: { projectId: string };
    [API_ROUTES.POST_RESET_DEPLOYMENT_KEY]: { projectId: string };
}
export interface API_BODY {
    // Only POST
    //POST
    [API_ROUTES.POST_CREATE_PROJECT]: Project;
    [API_ROUTES.POST_UPDATE_PROJECT]: Partial<Project> & { id: string };
    [API_ROUTES.POST_RESET_DEPLOYMENT_KEY]: {};
}
export interface API_RETURN {
    //GET
    [API_ROUTES.GET_DEPLOY]: undefined;
    [API_ROUTES.GET_PROJECT]: Project | undefined;
    [API_ROUTES.GET_PROJECTS]: Project[];

    //POST
    [API_ROUTES.POST_CREATE_PROJECT]: undefined;
    [API_ROUTES.POST_UPDATE_PROJECT]: undefined;
    [API_ROUTES.POST_RESET_DEPLOYMENT_KEY]: string | undefined;
}

export interface API_AUTH {
    // Set to string if it needs an auth token, leave out else
    //GET
    [API_ROUTES.GET_PROJECT]: string;
    [API_ROUTES.GET_PROJECTS]: string;

    //POST
    [API_ROUTES.POST_CREATE_PROJECT]: string;
    [API_ROUTES.POST_UPDATE_PROJECT]: string;
    [API_ROUTES.POST_RESET_DEPLOYMENT_KEY]: string;
}