import { getWorkerNodeById } from '@/controllers/workerNodeController';
import { WORKER_ROUTES, WORKER_BODY, WORKER_RESPONSE } from '@mosaiq/nsm-common/workerRoutes';

export async function workerNodePost<T extends WORKER_ROUTES>(wnId: string, ep: T, body: WORKER_BODY[T]): Promise<WORKER_RESPONSE[T] | undefined> {
    const wn = await getWorkerNodeById(wnId);
    if (!wn) throw new Error(`WorkerNode with id ${wnId} not found`);
    const url = `http://${wn.address}:${wn.port}/${ep.replace(/^\/+/, '')}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `${wn.authToken}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10 * 60 * 1000),
    });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`Worker error: ${res.status} - ${text}, url: ${url}`);
    }
    try {
        return text ? (JSON.parse(text) as WORKER_RESPONSE[T]) : undefined;
    } catch (error) {
        throw new Error(`Worker returned invalid JSON: ${text}`);
    }
}
