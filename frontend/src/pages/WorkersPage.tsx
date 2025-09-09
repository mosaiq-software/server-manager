import { Alert, Button, ButtonGroup, Center, Code, Group, Loader, Modal, NumberInput, PasswordInput, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import React, { useEffect, useState } from 'react';
import { EditableTextInput } from '@/components/EditableTextInput';
import { useWorkers } from '@/contexts/worker-context';
import { WorkerNode } from '@mosaiq/nsm-common/types';
import { apiGet } from '@/utils/api';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';

const WorkersPage = () => {
    const workerCtx = useWorkers();
    const [modal, setModal] = useState<string | null>(null);
    const [newWorker, setNewWorker] = useState<WorkerNode>({
        workerId: '',
        address: '',
        port: 0,
        authToken: '',
    });

    const sanitizeName = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^\w- ]+/g, '')
            .trim()
            .replace(/\s+/g, '-');
    };

    const isValidNetworkAddress = (address?: string) => {
        if (!address) return false;
        const parts = address.split(':');
        const structure = parts.length === 2 && parts[0].length > 0 && parts[1].length > 1 && !isNaN(Number(parts[1]));
        if (!structure) return false;
        const url = 'http://' + address;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const isValidName = (name?: string) => {
        if (!name) return false;
        const sanitized = sanitizeName(name);
        const used = workerCtx.workers.find((w) => w.workerId === sanitized);
        if (used) return false;
        return sanitized.length > 0 && sanitized === name;
    };

    return (
        <Stack>
            <Modal
                opened={modal === 'create'}
                onClose={() => setModal(null)}
                withCloseButton={false}
            >
                <Stack>
                    <Title order={3}>Add Worker Node</Title>
                    <TextInput
                        label="Worker ID"
                        placeholder="whiterig"
                        description="The unique identifier for the worker node. Cannot be changed later."
                        value={newWorker.workerId || ''}
                        onChange={(e) => setNewWorker({ ...newWorker, workerId: e.target.value })}
                        onBlur={() => setNewWorker({ ...newWorker, workerId: sanitizeName(newWorker.workerId) })}
                        error={newWorker.workerId && !isValidName(newWorker.workerId) ? 'Invalid Worker ID' : undefined}
                    />
                    <TextInput
                        label="Address"
                        placeholder="192.168.1.206"
                        description="The address of the worker node. Must be on the control plane's network."
                        value={newWorker.address || ''}
                        onChange={(e) => setNewWorker({ ...newWorker, address: e.target.value })}
                    />
                    <NumberInput
                        label="Port"
                        placeholder="1234"
                        description="The port of the worker node. Used to contact the worker."
                        value={newWorker.port}
                        min={1}
                        max={65535}
                        onChange={(e) => setNewWorker({ ...newWorker, port: Number(e) || 0 })}
                    />
                    <Group justify="space-between">
                        <Button
                            variant="outline"
                            onClick={() => setModal(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="filled"
                            onClick={async () => {
                                if (!isValidNetworkAddress(newWorker.address + ':' + newWorker.port)) {
                                    notifications.show({
                                        title: 'Invalid address:port',
                                        message: 'Please enter a valid address:port format.',
                                        color: 'red',
                                    });
                                    return;
                                }
                                if (!isValidName(newWorker.workerId)) {
                                    notifications.show({
                                        title: 'Invalid Worker ID',
                                        message: 'Please enter a valid Worker ID.',
                                        color: 'red',
                                    });
                                    return;
                                }
                                const nw = { ...newWorker, workerId: sanitizeName(newWorker.workerId) };
                                await workerCtx.create(nw);
                                setModal(null);
                            }}
                        >
                            Create
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <Modal
                opened={!!modal?.startsWith('delete-')}
                onClose={() => setModal(null)}
                withCloseButton={false}
            >
                <Stack>
                    <Title order={3}>Remove Worker Node</Title>
                    <Text>Are you sure you want to remove this worker node?</Text>
                    <Group>
                        <Button
                            variant="outline"
                            onClick={() => setModal(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="filled"
                            color="red"
                            onClick={async () => {
                                await workerCtx.delete(modal?.replace('delete-', '') || '');
                                setModal(null);
                            }}
                        >
                            Remove
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <Modal
                opened={!!modal?.startsWith('reset-key-')}
                onClose={() => setModal(null)}
                withCloseButton={false}
            >
                <Stack>
                    <Title order={3}>Reset Worker Key</Title>
                    <Text>Resetting the worker key will regenerate it. This will need to be update in the workers configuration.</Text>
                    <Group justify="space-between">
                        <Button
                            variant="filled"
                            onClick={() => setModal(null)}
                        >
                            No. Keep The Key.
                        </Button>
                        <Button
                            variant="light"
                            color="red"
                            onClick={() => {
                                workerCtx.regenerateKey(modal?.replace('reset-key-', '') || '');
                                setModal(null);
                            }}
                        >
                            Yes. Reset The Key.
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <Title order={2}>Workers</Title>
            <Group>
                <Button onClick={() => setModal('create')}>Add Worker Node</Button>
            </Group>
            <Text>These are the worker nodes in the NSM network.</Text>
            {!workerCtx.controlPlaneWorkerExists && (
                <Alert
                    variant="filled"
                    color="red"
                    title="No Control Plane Worker Node"
                >
                    <Text>
                        The control plane worker node is not set or does not exist. Set the <code>{workerCtx.controlPlaneWorkerId}</code> worker deployed on the same machine as the control plane.
                    </Text>
                </Alert>
            )}
            <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Worker ID</Table.Th>
                        <Table.Th>Address</Table.Th>
                        <Table.Th>Port</Table.Th>
                        <Table.Th>Key</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {workerCtx.workers.map((worker) => (
                        <Table.Tr
                            key={worker.workerId}
                            bg={worker.workerId === workerCtx.controlPlaneWorkerId ? '#e7f2fb' : undefined}
                        >
                            <Table.Td>{worker.workerId}</Table.Td>
                            <Table.Td>{worker.address}</Table.Td>
                            <Table.Td>{worker.port}</Table.Td>
                            <Table.Td>
                                <PasswordInput
                                    value={worker.authToken}
                                    readOnly
                                />
                            </Table.Td>
                            <Table.Td>
                                <WorkerStatus worker={worker} />
                            </Table.Td>
                            <Table.Td>
                                <ButtonGroup>
                                    <Button
                                        onClick={() => setModal(`delete-${worker.workerId}`)}
                                        variant="outline"
                                    >
                                        Remove
                                    </Button>
                                    <Button
                                        onClick={() => setModal(`reset-key-${worker.workerId}`)}
                                        variant="outline"
                                    >
                                        Reset Key
                                    </Button>
                                </ButtonGroup>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </Stack>
    );
};

const WorkerStatus = (props: { worker: WorkerNode }) => {
    const [ping, setPing] = useState<number | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [icon, setIcon] = useState<string>('⚫');

    useEffect(() => {
        const checkPing = async () => {
            try {
                const ping = await apiGet(API_ROUTES.GET_WORKER_NODE_HEALTHCHECK, { workerId: props.worker.workerId }, 'AUTH TOKEN...');
                if (ping === undefined) {
                    setStatus('CP Unreachable');
                    setPing(null);
                    setIcon('🔴');
                    return;
                }
                setStatus(ping.status);
                setPing(ping.ping || null);
                if (ping.ping) {
                    setIcon('🟢');
                } else {
                    setIcon('⚠');
                }
            } catch (error) {
                console.error('Error fetching worker status:', error);
                setStatus('Unknown');
                setPing(null);
                setIcon('🔴');
            }
        };
        checkPing();
        const interval = setInterval(checkPing, 1000 * 10);
        return () => clearInterval(interval);
    }, [props.worker.address, props.worker.port]);

    if (status === null && ping === null) {
        return (
            <Center>
                <Loader />
            </Center>
        );
    }

    return (
        <Center>
            <Stack gap={0}>
                <Title
                    order={4}
                    ta="center"
                >
                    {icon}
                </Title>
                {ping !== null && <Text ta="center">Ping: {Math.round(ping * 1000) / 1000}ms</Text>}
                <Text ta="center">Status {status}</Text>
            </Stack>
        </Center>
    );
};

export default WorkersPage;
