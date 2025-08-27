import { API_BODY, API_PARAMS, API_RETURN, API_ROUTES } from 'common';
export async function apiGet<T extends API_ROUTES>(route: T, params: API_PARAMS[T], authToken?: string): Promise<API_RETURN[T] | undefined> {
    try {
        const loadedURL = loadParams(route, params);
        const response = await fetch(`${process.env.API_URL}${loadedURL}`, {
            method: 'GET',
            headers: authToken
                ? {
                      Authorization: `Bearer ${authToken}`,
                  }
                : undefined,
        });
        const data = (await response.json()) as API_RETURN[T] | undefined;
        return data;
    } catch (e: any) {
        console.error('Error getting', route, params);
        return undefined;
    }
}

export async function apiPost<T extends API_ROUTES>(route: T, params: API_PARAMS[T], body: API_BODY[T], authToken?: string): Promise<API_RETURN[T] | undefined> {
    try {
        const loadedURL = loadParams(route, params);
        const response = await fetch(`${process.env.API_URL}${loadedURL}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : '{}',
        });
        const data = (await response.json()) as API_RETURN[T] | undefined;
        return data;
    } catch (e: any) {
        console.error('Error posting', route, params, body);
        return undefined;
    }
}

export function loadParams<T extends API_ROUTES>(route: T, params: API_PARAMS[T]): T {
    let r = route as string;
    for (const param in params) {
        r = r.replace(`/:${param}`, `/${String(params[param])}`);
    }
    return r as T;
}
