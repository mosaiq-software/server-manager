import { useUser } from '@/contexts/user-context';
import { API_BODY, API_PARAMS, API_RETURN, API_ROUTES } from '@mosaiq/nsm-common/routes';
const TIMEOUT_MS = 10000;
async function apiGet<T extends API_ROUTES>(route: T, params: API_PARAMS[T], authToken?: string): Promise<API_RETURN[T] | undefined> {
    try {
        if (!authToken) {
            return undefined;
        }
        const loadedURL = loadParams(route, params);
        const response = await fetch(`${process.env.API_URL}${loadedURL}`, {
            method: 'GET',
            headers: authToken
                ? {
                      Authorization: `Bearer ${authToken}`,
                  }
                : undefined,
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        const data = (await response.json()) as API_RETURN[T] | undefined;
        return data;
    } catch (e: any) {
        console.error('Error getting', route, params);
        return undefined;
    }
}

async function apiPost<T extends API_ROUTES>(route: T, params: API_PARAMS[T], body: API_BODY[T], authToken?: string): Promise<API_RETURN[T] | undefined> {
    try {
        if (!authToken) {
            return undefined;
        }
        const loadedURL = loadParams(route, params);
        const response = await fetch(`${process.env.API_URL}${loadedURL}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : '{}',
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        const data = (await response.json()) as API_RETURN[T] | undefined;
        return data;
    } catch (e: any) {
        console.error('Error posting', route, params, body);
        return undefined;
    }
}

function loadParams<T extends API_ROUTES>(route: T, params: API_PARAMS[T]): T {
    let r = route as string;
    for (const param in params) {
        r = r.replace(`/:${param}`, `/${String(params[param])}`);
    }
    return r as T;
}

export const useAPI = () => {
    const userCtx = useUser();

    const get = async <T extends API_ROUTES>(route: T, params: API_PARAMS[T]) => {
        return apiGet(route, params, userCtx?.user?.authToken);
    };

    const post = async <T extends API_ROUTES>(route: T, params: API_PARAMS[T], body: API_BODY[T]) => {
        return apiPost(route, params, body, userCtx?.user?.authToken);
    };

    return {
        get,
        post,
        token: userCtx?.user?.authToken,
    };
};

export { apiGet as rawApiGetNoHook, apiPost as rawApiPostNoHook };
