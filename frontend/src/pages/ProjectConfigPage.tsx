import { ActionIcon, ActionIconGroup, Alert, Button, Center, Combobox, CopyButton, Divider, Fieldset, Grid, Group, Loader, Menu, Modal, MultiSelect, NumberInput, ScrollArea, Select, Space, Stack, Switch, Table, Text, TextInput, Title, Tooltip, useCombobox } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';
import { DeploymentState, DockerStatus, DynamicEnvVariable, NginxConfigLocationType, Project, ProjectNginxConfig, ProjectService, Secret, UpperDynamicEnvVariableType } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost } from '@/utils/api';
import { EditableTextInput } from '@/components/EditableTextInput';
import { useProjects } from '@/contexts/project-context';
import { ProjectHeader } from '@/components/ProjectHeader';
import { assembleDotenv, extractVariables, parseDynamicVariablePath } from '@mosaiq/nsm-common/secretUtil';
import { NginxEditor } from '@/components/NginxEditor';
import { useWorkers } from '@/contexts/worker-context';
import { MdOutlineCode, MdOutlineDns, MdOutlineLan, MdOutlineLink, MdOutlineLinkOff, MdOutlineRefresh, MdOutlineStorage, MdOutlineUmbrella, MdOutlineWeb } from 'react-icons/md';

const ProjectConfigPage = () => {
    const params = useParams();
    const projectId = params.projectId;
    const navigate = useNavigate();
    const projectCtx = useProjects();
    const workerCtx = useWorkers();
    const [project, setProject] = useState<Project | undefined | null>(undefined);
    const [secrets, setSecrets] = useState<Secret[]>([]);
    const [dynamicEnvVariables, setDynamicEnvVariables] = useState<DynamicEnvVariable[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [modal, setModal] = useState<'delete-project' | null>(null);

    const varCombobox = useCombobox({
        onDropdownClose: () => varCombobox.resetSelectedOption(),
    });

    useEffect(() => {
        const foundProject = projectCtx.projects.find((proj) => proj.id === projectId);
        if (foundProject) {
            const vars = extractVariables(foundProject);
            setProject({ ...foundProject });
            setDynamicEnvVariables(vars);
            setSecrets(foundProject.secrets ?? []);
        }
    }, [projectId, projectCtx.projects]);

    const updateProject = (updatedFields: Partial<Project>) => {
        if (project) {
            const vars = extractVariables({ ...project, ...updatedFields });
            setProject({ ...project, ...updatedFields });
            setDynamicEnvVariables(vars);
        }
    };

    const updateSecret = (secret: Secret) => {
        setSecrets((prev) => prev.map((s) => (s.secretName === secret.secretName ? secret : s)));
    };

    const same = () => {
        const oldProject = projectCtx.projects.find((proj) => proj.id === projectId);
        if (!oldProject) return false;
        const oldEnv = assembleDotenv(oldProject.secrets ?? []);
        const newEnv = assembleDotenv(secrets);
        return JSON.stringify(oldProject) === JSON.stringify(project) && oldEnv === newEnv;
    };

    const saveChanges = async () => {
        if (!project) return;
        try {
            await projectCtx.update(project.id, project);
            await projectCtx.updateSecrets(project.id, secrets);
            notifications.show({
                title: 'Success',
                message: 'Project updated successfully',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to save changes',
                color: 'red',
            });
        }
    };

    const handleSyncToRepo = async () => {
        if (!project) return;
        setSyncing(true);
        await projectCtx.syncProjectToRepo(project.id);
        setSyncing(false);
    };

    const handleDeleteProject = async () => {
        if (!project) return;
        try {
            await projectCtx.delete(project.id);
            notifications.show({
                title: 'Success',
                message: 'Project deleted successfully',
                color: 'green',
            });
            navigate('/');
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to delete project',
                color: 'red',
            });
        }
    };

    if (project === undefined) {
        return (
            <Center>
                <Loader />
            </Center>
        );
    }

    if (!project || !project.id) {
        return (
            <Center>
                <Stack>
                    <Title order={4}>Project &quot;{projectId}&quot; not found!</Title>
                </Stack>
            </Center>
        );
    }

    if (syncing) {
        return (
            <Center
                w="100%"
                h="100%"
            >
                <Stack align="center">
                    <Loader />
                    <Title>Syncing to repository...</Title>
                    <Text>This may take a few moments</Text>
                </Stack>
            </Center>
        );
    }

    const isSame = same();

    return (
        <>
            <Modal
                opened={modal === 'delete-project'}
                onClose={() => setModal(null)}
                withCloseButton={false}
            >
                <Stack>
                    <Title order={3}>Delete {project.id}</Title>
                    <Text>Are you sure you want to delete this project? This action cannot be undone.</Text>
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
                            onClick={handleDeleteProject}
                        >
                            Delete Project
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <Stack>
                <ProjectHeader
                    project={project}
                    section="Configuration"
                />
                {isSame && project.dirtyConfig && (
                    <Alert
                        variant="light"
                        color="yellow"
                        title="Configs Changed"
                    >
                        Some configurations have been changed since the last deployment. Redeploy to apply the new settings.
                    </Alert>
                )}
                {!isSame && (
                    <Alert
                        variant="light"
                        color="orange"
                        title="Unsaved Changes"
                    >
                        <Group>
                            <Text>You have unsaved changes. Please save your changes before leaving this page.</Text>
                            <Button
                                variant="light"
                                color="blue"
                                onClick={saveChanges}
                            >
                                Save Changes
                            </Button>
                        </Group>
                    </Alert>
                )}
                <Title order={5}>General</Title>
                <Group
                    align="flex-start"
                    justify="space-evenly"
                >
                    <Stack
                        gap={2}
                        align="center"
                    >
                        <Group>
                            <TextInput
                                w="30%"
                                required
                                label="Repository Owner"
                                value={project.repoOwner}
                                onChange={(e) => updateProject({ repoOwner: e.currentTarget.value })}
                            />
                            <TextInput
                                w="30%"
                                required
                                label="Repository Name"
                                value={project.repoName}
                                onChange={(e) => updateProject({ repoName: e.currentTarget.value })}
                            />
                            <TextInput
                                w="30%"
                                label="Repository Branch"
                                value={project.repoBranch}
                                onChange={(e) => updateProject({ repoBranch: e.currentTarget.value })}
                            />
                        </Group>
                        <Text
                            fz=".75rem"
                            c="dimmed"
                            component="a"
                            href={`https://github.com/${project.repoOwner}/${project.repoName}.git`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {`github.com/${project.repoOwner}/${project.repoName}.git`}
                        </Text>
                    </Stack>
                    <Select
                        required
                        label="Worker Node"
                        description="Which worker node to use for deployments?"
                        data={workerCtx.workers.map((worker) => ({ value: worker.workerId, label: `${worker.workerId} (@${worker.address})` }))}
                        onChange={(value) => updateProject({ workerNodeId: value || undefined })}
                        value={project.workerNodeId}
                        placeholder="Select a worker node"
                    />
                    <NumberInput
                        value={project.timeout}
                        label="Deployment Timeout (ms)"
                        placeholder={(1000 * 60 * 5).toString()}
                        min={0}
                        max={1000 * 60 * 60}
                        description="The max time it can take to deploy"
                        onChange={(e) => {
                            if (e === '') {
                                updateProject({ timeout: undefined });
                                return;
                            }
                            const value = Number(e);
                            if (!isNaN(value)) {
                                updateProject({ timeout: value });
                            }
                        }}
                    />
                    <Switch
                        label="Allow CI/CD"
                        checked={project.allowCICD}
                        onChange={(e) => updateProject({ allowCICD: e.currentTarget.checked })}
                    />
                </Group>
                <Divider my="sm" />
                <NginxEditor
                    current={project.nginxConfig || { servers: [] }}
                    onSave={(config) => updateProject({ nginxConfig: config })}
                    project={project}
                />
                <Divider my="sm" />
                <Stack gap="xs">
                    <Group
                        align="flex-start"
                        justify="flex-start"
                    >
                        <Stack>
                            <Title order={5}>Environment Variables</Title>
                            <Text
                                fz=".75rem"
                                c="dimmed"
                            >
                                Pulled in from the repository
                            </Text>
                        </Stack>
                        <Tooltip label="Sync to Repo">
                            <ActionIcon
                                variant="light"
                                onClick={handleSyncToRepo}
                            >
                                <MdOutlineRefresh />
                            </ActionIcon>
                        </Tooltip>
                        {!project.hasDotenv && (
                            <Alert
                                color="yellow"
                                variant="light"
                                title="No Env File"
                            >
                                This root of this project does not have any files starting with `.env`.
                            </Alert>
                        )}
                    </Group>
                    <Grid w="70%">
                        <Grid.Col span={3}>
                            <Title order={6}>Env Variable</Title>
                        </Grid.Col>
                        <Grid.Col span={9}>
                            <Title order={6}>Value</Title>
                        </Grid.Col>
                        {secrets.map((secret) => {
                            return (
                                <EnvVarRow
                                    key={secret.secretName}
                                    secret={secret}
                                    onChange={updateSecret}
                                    vars={dynamicEnvVariables}
                                />
                            );
                        })}
                    </Grid>
                </Stack>
                <Space h="xl" />
                <Stack gap="xs">
                    <Group
                        align="flex-start"
                        justify="flex-start"
                    >
                        <Stack>
                            <Title order={5}>Docker Compose Services</Title>
                            <Text
                                fz=".75rem"
                                c="dimmed"
                            >
                                Pulled in from the repository
                            </Text>
                        </Stack>
                        {!project.hasDockerCompose && (
                            <Alert
                                color="yellow"
                                variant="light"
                                title="No Docker Compose File"
                            >
                                This root of this project does not have any files starting with `compose.y(a)ml` or `docker-compose.y(a)ml`.
                            </Alert>
                        )}
                    </Group>
                    <Group>
                        {project.services?.map((service) => (
                            <Service
                                key={service.serviceName}
                                service={service}
                                onChange={(updated) => {
                                    const newService = { ...service, ...updated };
                                    const newServices = project.services?.map((s) => (s.serviceName === service.serviceName ? newService : s)) || [];
                                    updateProject({ services: newServices });
                                }}
                            />
                        ))}
                    </Group>
                </Stack>
                <Space h="xl" />
                <Alert
                    color="red"
                    variant="light"
                    title="Danger Zone"
                >
                    <Stack>
                        <Group>
                            <Tooltip label="Delete Project">
                                <Button
                                    color="red"
                                    variant="outline"
                                    onClick={() => setModal('delete-project')}
                                >
                                    Delete Project
                                </Button>
                            </Tooltip>
                        </Group>
                    </Stack>
                </Alert>
            </Stack>
        </>
    );
};

interface EnvVarRowProps {
    secret: Secret;
    onChange: (secret: Secret) => void;
    vars: DynamicEnvVariable[];
}
const EnvVarRow = (props: EnvVarRowProps) => {
    const EnvItems = {
        [NginxConfigLocationType.CUSTOM]: { icon: MdOutlineCode, desc: 'Custom location block', title: 'Custom NGINX Block' },
        [NginxConfigLocationType.REDIRECT]: { icon: MdOutlineLink, desc: 'Redirect requests to another URL', title: 'Redirect Link' },
        [NginxConfigLocationType.PROXY]: { icon: MdOutlineDns, desc: 'Proxy requests to another server', title: 'API Service' },
        [NginxConfigLocationType.STATIC]: { icon: MdOutlineWeb, desc: 'Serve static files from a directory', title: 'Static Page' },
        [UpperDynamicEnvVariableType.GENERAL]: { icon: MdOutlineLan, desc: 'General project setting', title: 'General' },
        [UpperDynamicEnvVariableType.DOMAIN]: { icon: MdOutlineUmbrella, desc: 'The domain of a server block', title: 'Domain' },
    };
    const combobox = useCombobox();
    const { secret } = props;
    const groupedVars: { [key: string]: { vars: DynamicEnvVariable[]; menuItem: (typeof EnvItems)[keyof typeof EnvItems] | undefined } } = {};
    props.vars.forEach((varItem) => {
        const dynVar = parseDynamicVariablePath(varItem.path);
        const parent = `${dynVar.projectId}${dynVar.serverId ? `.${dynVar.serverId}` : ''}${dynVar.locationId ? `.${dynVar.locationId}` : ''}`;
        if (!groupedVars[parent]) {
            groupedVars[parent] = { vars: [], menuItem: varItem.type ? EnvItems[varItem.type] : undefined };
        }
        groupedVars[parent].vars.push(varItem);
    });
    return (
        <>
            <Grid.Col span={3}>
                <Title
                    order={6}
                    ta="right"
                >
                    {secret.secretName}
                </Title>
            </Grid.Col>
            <Grid.Col span={9}>
                <Group w="100%">
                    <TextInput
                        flex={1}
                        placeholder={secret.secretPlaceholder}
                        value={secret.variable ? `Linked to ${secret.secretValue}` : secret.secretValue}
                        onChange={(event) => props.onChange({ ...secret, secretValue: event.currentTarget.value })}
                        disabled={secret.variable}
                    />
                    <ActionIconGroup>
                        {secret.variable && (
                            <Tooltip label="Unlink Variable">
                                <ActionIcon
                                    onClick={() => props.onChange({ ...secret, variable: false, secretValue: '' })}
                                    variant="outline"
                                >
                                    <MdOutlineLinkOff />
                                </ActionIcon>
                            </Tooltip>
                        )}
                        <Combobox
                            store={combobox}
                            width={350}
                            position="bottom"
                            withArrow
                            onOptionSubmit={(val) => {
                                props.onChange({ ...secret, variable: true, secretValue: `${val}` });
                                combobox.closeDropdown();
                            }}
                        >
                            <Combobox.Target>
                                <ActionIcon
                                    onClick={() => combobox.toggleDropdown()}
                                    variant="outline"
                                >
                                    <MdOutlineLan />
                                </ActionIcon>
                            </Combobox.Target>
                            <Combobox.Dropdown>
                                <Combobox.Header>Link Variable</Combobox.Header>
                                <Combobox.Options>
                                    <ScrollArea.Autosize
                                        type="scroll"
                                        mah={400}
                                    >
                                        {Object.entries(groupedVars).map(([parent, gr], i) => (
                                            <Combobox.Group
                                                key={parent}
                                                label={
                                                    <Group align="center">
                                                        {gr.menuItem && <gr.menuItem.icon />}
                                                        <Text fz="xs">{parent}</Text>
                                                    </Group>
                                                }
                                            >
                                                {gr.vars.map((varItem, i) => {
                                                    const dynVar = parseDynamicVariablePath(varItem.path);
                                                    return (
                                                        <Combobox.Option
                                                            key={varItem.path}
                                                            value={varItem.path}
                                                        >
                                                            <Group gap={'xs'}>
                                                                <Text
                                                                    fz="sm"
                                                                    fw={500}
                                                                >
                                                                    {varItem.path}
                                                                </Text>
                                                                {!!varItem.placeholder?.length && (
                                                                    <Text
                                                                        fz="xs"
                                                                        c="dimmed"
                                                                    >
                                                                        {varItem.placeholder}
                                                                    </Text>
                                                                )}
                                                            </Group>
                                                        </Combobox.Option>
                                                    );
                                                })}
                                            </Combobox.Group>
                                        ))}
                                    </ScrollArea.Autosize>
                                </Combobox.Options>
                            </Combobox.Dropdown>
                        </Combobox>
                    </ActionIconGroup>
                </Group>
            </Grid.Col>
        </>
    );
};

const DockerStatusDescriptions: { [key in DockerStatus]: string } = {
    [DockerStatus.UNKNOWN]: 'Initial state, not yet checked',
    [DockerStatus.CREATED]: 'Container that has never been started.',
    [DockerStatus.RUNNING]: 'Container is running normally.',
    [DockerStatus.PAUSED]: 'Container is paused.',
    [DockerStatus.RESTARTING]: 'Container has stopped and is restarting.',
    [DockerStatus.EXITED]: 'Container has run and stopped gracefully.',
    [DockerStatus.REMOVING]: 'Container is in the process of being removed.',
    [DockerStatus.DEAD]: 'Container is "defunct" and cannot be started.',
};
interface ServiceProps {
    service: ProjectService;
    onChange: (service: Partial<ProjectService>) => void;
}
const Service = (props: ServiceProps) => {
    const { service, onChange } = props;
    const combobox = useCombobox();
    return (
        <Fieldset w={300}>
            <Stack>
                <Title order={6}>{service.serviceName}</Title>
                <Combobox
                    store={combobox}
                    width={500}
                    position="bottom"
                    withArrow
                    onOptionSubmit={(val) => {
                        onChange({ expectedContainerState: val as DockerStatus });
                        combobox.closeDropdown();
                    }}
                >
                    <Combobox.Target>
                        <TextInput
                            label="Expected Container State"
                            value={service.expectedContainerState}
                            readOnly
                            onClick={() => combobox.toggleDropdown()}
                            description={DockerStatusDescriptions[service.expectedContainerState]}
                        />
                    </Combobox.Target>
                    <Combobox.Dropdown>
                        <Combobox.Header>The ending state of a successful container run.</Combobox.Header>
                        <Combobox.Group label="Normal States">
                            {[DockerStatus.RUNNING, DockerStatus.EXITED].map((status) => (
                                <Combobox.Option
                                    key={status}
                                    value={status}
                                >
                                    <Title order={6}>{status}</Title>
                                    <Text fz="xs">{DockerStatusDescriptions[status]}</Text>
                                </Combobox.Option>
                            ))}
                        </Combobox.Group>
                        <Combobox.Group label="Other States">
                            {[DockerStatus.CREATED, DockerStatus.PAUSED, DockerStatus.RESTARTING, DockerStatus.REMOVING, DockerStatus.DEAD, DockerStatus.UNKNOWN].map((status) => (
                                <Combobox.Option
                                    key={status}
                                    value={status}
                                >
                                    <Title order={6}>{status}</Title>
                                    <Text fz="xs">{DockerStatusDescriptions[status]}</Text>
                                </Combobox.Option>
                            ))}
                        </Combobox.Group>
                    </Combobox.Dropdown>
                </Combobox>
                <Switch
                    label="Collect Container Logs"
                    description="Should the stdout and stderr of this container be collected and stored?"
                    checked={service.collectContainerLogs}
                    onChange={(event) => {
                        onChange({ collectContainerLogs: event.currentTarget.checked });
                    }}
                />
            </Stack>
        </Fieldset>
    );
};

export default ProjectConfigPage;
