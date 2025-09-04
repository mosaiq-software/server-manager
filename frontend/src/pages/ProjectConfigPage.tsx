import { ActionIcon, ActionIconGroup, Alert, Button, Center, Combobox, CopyButton, Divider, Fieldset, Grid, Group, Loader, Menu, MultiSelect, NumberInput, ScrollArea, Select, Space, Stack, Switch, Table, Text, TextInput, Title, Tooltip, useCombobox } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';
import { DeploymentState, DynamicEnvVariable, NginxConfigLocationType, Project, ProjectNginxConfig, Secret } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost } from '@/utils/api';
import { EditableTextInput } from '@/components/EditableTextInput';
import { useProjects } from '@/contexts/project-context';
import { ProjectHeader } from '@/components/ProjectHeader';
import { assembleDotenv, extractVariables } from '@mosaiq/nsm-common/secretUtil';
import { NginxEditor } from '@/components/NginxEditor';
import { useWorkers } from '@/contexts/worker-context';
import { MdOutlineCode, MdOutlineDns, MdOutlineLan, MdOutlineLink, MdOutlineLinkOff, MdOutlineStorage, MdOutlineUmbrella, MdOutlineWeb } from 'react-icons/md';

const ProjectConfigPage = () => {
    const params = useParams();
    const projectId = params.projectId;
    const navigate = useNavigate();
    const projectCtx = useProjects();
    const workerCtx = useWorkers();
    const [project, setProject] = useState<Project | undefined | null>(undefined);
    const [secrets, setSecrets] = useState<Secret[]>([]);
    const [dynamicEnvVariables, setDynamicEnvVariables] = useState<DynamicEnvVariable[]>([]);

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

    const isSame = same();

    return (
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
                            required
                            label="Repository Owner"
                            value={project.repoOwner}
                            onChange={(e) => updateProject({ repoOwner: e.currentTarget.value })}
                        />
                        <TextInput
                            required
                            label="Repository Name"
                            value={project.repoName}
                            onChange={(e) => updateProject({ repoName: e.currentTarget.value })}
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
                <Title order={5}>Environment Variables</Title>
                <Text
                    fz=".75rem"
                    c="dimmed"
                >
                    Pulled in from the repository
                </Text>
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
        </Stack>
    );
};

interface EnvVarRowProps {
    secret: Secret;
    onChange: (secret: Secret) => void;
    vars: DynamicEnvVariable[];
}
const EnvVarRow = (props: EnvVarRowProps) => {
    const MenuItems = {
        [NginxConfigLocationType.CUSTOM]: { icon: MdOutlineCode, desc: 'Custom location block', title: 'Custom NGINX Block' },
        [NginxConfigLocationType.REDIRECT]: { icon: MdOutlineLink, desc: 'Redirect requests to another URL', title: 'Redirect Link' },
        [NginxConfigLocationType.PROXY]: { icon: MdOutlineDns, desc: 'Proxy requests to another server', title: 'API Service' },
        [NginxConfigLocationType.STATIC]: { icon: MdOutlineWeb, desc: 'Serve static files from a directory', title: 'Static Page' },
        Domain: { icon: MdOutlineUmbrella, desc: 'The domain of a server block', title: 'Domain' },
        Persistence: { icon: MdOutlineStorage, desc: 'Persistent storage volume', title: 'Storage Volume' },
    };
    const combobox = useCombobox();
    const { secret } = props;
    const groupedVars: { [key: string]: { vars: DynamicEnvVariable[]; menuItem: (typeof MenuItems)[keyof typeof MenuItems] | undefined } } = {};
    props.vars.forEach((varItem) => {
        const parent = varItem.parent + (varItem.type ? ` (${MenuItems[varItem.type]?.title})` : '') || 'Other';
        if (!groupedVars[parent]) {
            groupedVars[parent] = { vars: [], menuItem: varItem.type ? MenuItems[varItem.type] : undefined };
        }
        groupedVars[parent].vars.push(varItem);
    });
    return (
        <>
            <Grid.Col span={3}>
                <Title order={6}>{secret.secretName}</Title>
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
                                                {gr.vars.map((varItem, i) => (
                                                    <Combobox.Option
                                                        key={varItem.field}
                                                        value={`<<<${varItem.parent}.${varItem.field}>>>`}
                                                    >
                                                        <Group gap={'xs'}>
                                                            <Text
                                                                fz="sm"
                                                                fw={500}
                                                            >
                                                                {varItem.field}
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
                                                ))}
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

export default ProjectConfigPage;
