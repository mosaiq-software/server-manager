
// ===== ROUTES =====
export enum API_ROUTES {
    // GET
    GET_TEST = '/test/:id',

    //POST
    POST_TEST = '/test/:id2',
}
export interface API_PARAMS {
    //GET
    [API_ROUTES.GET_TEST]: { id: string };

    //POST
    [API_ROUTES.POST_TEST]: { id2: string };
}
export interface API_BODY {
    // Only POST
    //POST
    [API_ROUTES.POST_TEST]: { bodyText: string };
}
export interface API_RETURN {
    //GET
    [API_ROUTES.GET_TEST]: { returnText: string };

    //POST
    [API_ROUTES.POST_TEST]: { returnText: string };
}

export interface API_AUTH {
    // Set to string if it needs an auth token, leave out else
    //GET

    //POST
    [API_ROUTES.POST_TEST]: string;
}