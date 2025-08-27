export type UID = `${string}-${string}-${string}-${string}-${string}`;

export enum IdPrefixes {
    TEST = 'test',
}

export type TestId = `${IdPrefixes.TEST}_${UID}`;

export const generateTestId = (): TestId => `${IdPrefixes.TEST}_${crypto.randomUUID()}`;

const DUMMY_UUID: UID = 'DUMMY-DUMMY-DUMMY-DUMMY-DUMMY';
export const DUMMY_TEST_ID: TestId = `${IdPrefixes.TEST}_${DUMMY_UUID}`;

export const isUUID = (target: string) => {
    const sanitized = target.trim().replace(' ', '').replace('-', '');
    if (sanitized.length !== 32) {
        return false;
    }
    return true;
};
