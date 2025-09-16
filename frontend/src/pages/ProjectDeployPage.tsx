import { Accordion, ActionIcon, Box, Button, Center, CopyButton, Divider, Flex, Group, Loader, Modal, PasswordInput, Stack, Text, TextInput, Title, Code, Tooltip, Alert, Fieldset } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';
import { DeploymentState, Project, ProjectInstance, ProjectInstanceHeader } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProjects } from '@/contexts/project-context';
import { ProjectHeader } from '@/components/ProjectHeader';
import { MdOutlineCheckBox, MdOutlineDelete, MdOutlineInsertLink, MdOutlineKey, MdOutlineRefresh, MdOutlineRocketLaunch } from 'react-icons/md';
import { useWorkers } from '@/contexts/worker-context';
import { ConsoleLog } from '@/components/ConsoleLog';
import { useAPI } from '@/utils/api';

const ProjectDeployPage = () => {
    const api = useAPI();
    const params = useParams();
    const projectId = params.projectId;
    const navigate = useNavigate();
    const projectCtx = useProjects();
    const workerCtx = useWorkers();
    const [project, setProject] = useState<Project | undefined | null>(undefined);
    const [modal, setModal] = useState<'reset-key' | 'deploy' | 'teardown' | null>(null);
    const [openProjectInstance, setOpenProjectInstance] = useState<string | null>(null);
    const [currentProjectInstanceId, setCurrentProjectInstanceId] = useState<string | undefined>(undefined);
    const [currentProjectInstance, setCurrentProjectInstance] = useState<ProjectInstance | undefined>(undefined);

    useEffect(() => {
        const foundProject = projectCtx.projects.find((proj) => proj.id === projectId);
        setProject(foundProject);
    }, [projectId, projectCtx.projects]);

    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (currentProjectInstanceId) {
                const instance = await api.get(API_ROUTES.GET_PROJECT_INSTANCE, { projectInstanceId: currentProjectInstanceId });
                if (!instance) return;
                setCurrentProjectInstance({ ...instance });
                if (instance?.state !== DeploymentState.DEPLOYING) {
                    clearInterval(intervalId);
                }
            }
        }, 2000);
        return () => clearInterval(intervalId);
    }, [currentProjectInstanceId]);

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

    const handleDeploy = async () => {
        if (!project) return;
        notifications.show({ message: 'Deploying project...', color: 'blue' });
        const newLogId = await api.get(API_ROUTES.GET_DEPLOY_WEB, { projectId: project.id, key: project.deploymentKey ?? '' });
        if (!newLogId) {
            notifications.show({ message: 'Failed to get deployment log ID. Reload to see log', color: 'yellow' });
        } else {
            setOpenProjectInstance(newLogId);
            setCurrentProjectInstanceId(newLogId);
        }
        projectCtx.update(project.id, { dirtyConfig: false }, true);
    };

    const handleResetDeployKey = async () => {
        if (!project) return;
        notifications.show({ message: 'Resetting deployment key...', color: 'blue' });
        const newKey = await api.post(API_ROUTES.POST_RESET_DEPLOYMENT_KEY, { projectId: project.id }, {});
        if (!newKey) {
            notifications.show({ message: 'Failed to reset deployment key!', color: 'red' });
            return;
        }
        notifications.show({ message: 'Deployment key reset successful!', color: 'green' });
        projectCtx.update(project.id, { deploymentKey: newKey }, true);
    };

    const handleTeardown = async () => {
        // TODO handle tearing down a project
    };

    const canDeploy = project.hasDockerCompose && workerCtx.controlPlaneWorker && project.state !== DeploymentState.DEPLOYING && project.state !== DeploymentState.DESTROYING;

    return (
        <Stack>
            <Modal
                opened={modal === 'reset-key'}
                onClose={() => setModal(null)}
                withCloseButton={false}
            >
                <Stack>
                    <Title order={3}>Reset Deployment Key</Title>
                    <Text>Resetting the deployment key will regenerate it. All CI/CD pipelines using the old key will fail.</Text>
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
                                handleResetDeployKey();
                                setModal(null);
                            }}
                        >
                            Yes. Reset The Key.
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <Modal
                opened={modal === 'deploy'}
                onClose={() => setModal(null)}
                withCloseButton={false}
            >
                <Stack>
                    <Title order={3}>Deploy Project</Title>
                    <Text>
                        Are you sure you want to deploy the project?
                        <br />
                        This will trigger a deployment. Errors may occur.
                    </Text>
                    <Group justify="space-between">
                        <Button
                            variant="filled"
                            onClick={() => setModal(null)}
                        >
                            No. Do not deploy.
                        </Button>
                        <Button
                            variant="light"
                            color="green"
                            onClick={() => {
                                handleDeploy();
                                setModal(null);
                            }}
                        >
                            Yes. Deploy The Project.
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <Modal
                opened={modal === 'teardown'}
                onClose={() => setModal(null)}
                withCloseButton={false}
            >
                <Stack>
                    <Title order={3}>Teardown Project</Title>
                    <Text>
                        Are you sure you want to teardown the project?
                        <br />
                        This will take the project offline.
                    </Text>
                    <Group justify="space-between">
                        <Button
                            variant="filled"
                            onClick={() => setModal(null)}
                        >
                            No. Keep It Online.
                        </Button>
                        <Button
                            variant="light"
                            color="red"
                            onClick={() => {
                                handleTeardown();
                                setModal(null);
                            }}
                        >
                            Yes. Teardown The Project.
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <ProjectHeader
                project={project}
                section="Deployment"
            />
            <Group>
                <Button
                    onClick={() => setModal('deploy')}
                    variant="light"
                    color="green"
                    leftSection={<MdOutlineRocketLaunch />}
                    disabled={!canDeploy}
                >
                    Deploy
                </Button>
                <Button
                    onClick={() => setModal('teardown')}
                    variant="light"
                    color="red"
                    leftSection={<MdOutlineDelete />}
                    disabled={!canDeploy}
                >
                    Teardown
                </Button>
            </Group>
            {!project.hasDockerCompose && (
                <Alert
                    color="red"
                    variant="filled"
                    title="Undeployable Project"
                >
                    This project does not have a Docker Compose file configured.
                </Alert>
            )}
            {!workerCtx.controlPlaneWorker && (
                <Alert
                    color="red"
                    variant="filled"
                    title="No Control Plane Worker"
                >
                    NSM is not configured with a control plane worker node.{' '}
                    <Link
                        to="/workers"
                        style={{ textDecoration: 'underline' }}
                    >
                        Add a worker node
                    </Link>{' '}
                    to enable deployments.
                </Alert>
            )}
            <Group
                align="flex-end"
                wrap="nowrap"
            >
                <PasswordInput
                    label="Deployment Key"
                    value={project.deploymentKey}
                    readOnly
                    w={'32ch'}
                />
                <CopyButton value={project.deploymentKey ?? ''}>
                    {({ copied, copy }) => (
                        <Tooltip
                            label={'Copy key'}
                            withArrow
                        >
                            <ActionIcon
                                variant={copied ? 'filled' : 'light'}
                                onClick={copy}
                                size="input-sm"
                            >
                                {copied ? <MdOutlineCheckBox /> : <MdOutlineKey />}
                            </ActionIcon>
                        </Tooltip>
                    )}
                </CopyButton>
                <CopyButton value={`${process.env.API_URL}/deploy/${project.id}/${project.deploymentKey}`}>
                    {({ copied, copy }) => (
                        <Tooltip
                            label={'Copy Deploy URL'}
                            withArrow
                        >
                            <ActionIcon
                                variant={copied ? 'filled' : 'light'}
                                onClick={copy}
                                size="input-sm"
                            >
                                {copied ? <MdOutlineCheckBox /> : <MdOutlineInsertLink />}
                            </ActionIcon>
                        </Tooltip>
                    )}
                </CopyButton>
                <Box
                    flex={1}
                    h="md"
                >
                    <Divider />
                </Box>

                <Button
                    color="red"
                    variant="light"
                    onClick={() => setModal('reset-key')}
                >
                    Reset Key
                </Button>
            </Group>
            <Divider />
            <Title order={5}>Deployment Instances</Title>
            <Accordion
                value={openProjectInstance}
                onChange={setOpenProjectInstance}
            >
                {[currentProjectInstance, ...(project.instances ?? [])].map(
                    (instance) =>
                        instance && (
                            <ProjectInstanceItem
                                key={instance.id}
                                header={instance}
                            />
                        )
                )}
            </Accordion>
        </Stack>
    );
};

interface ProjectInstanceItemProps {
    header: ProjectInstanceHeader;
}
const ProjectInstanceItem = (props: ProjectInstanceItemProps) => {
    const api = useAPI();
    const [instance, setInstance] = useState<ProjectInstance | null>(null);

    const handleGetProjectInstance = async () => {
        try {
            const instance = await api.get(API_ROUTES.GET_PROJECT_INSTANCE, { projectInstanceId: props.header.id });
            if (!instance?.deploymentLog) {
                return;
            }
            setInstance(instance);
        } catch (error) {
            setInstance(null);
        }
    };

    const date = new Date(instance?.created ?? props.header.created).toLocaleString();

    return (
        <Accordion.Item value={props.header.id}>
            <Accordion.Control
                onClick={() => {
                    handleGetProjectInstance();
                }}
            >
                <Group justify="space-between">
                    <Text>{date}</Text>
                    <Text>({instance?.state ?? props.header.state})</Text>
                </Group>
            </Accordion.Control>

            <Accordion.Panel>
                <Stack>
                    <Group>
                        <ActionIcon
                            size="xs"
                            onClick={handleGetProjectInstance}
                        >
                            <MdOutlineRefresh />
                        </ActionIcon>
                    </Group>
                    <Stack>
                        <Text>Services</Text>
                        {instance?.services.map((service) => {
                            return (
                                <Fieldset
                                    legend={service.serviceName}
                                    key={service.serviceName}
                                    style={{
                                        width: '100%',
                                    }}
                                >
                                    <Alert
                                        color={service.actualContainerState === service.expectedContainerState ? 'green' : 'red'}
                                        title={service.actualContainerState === service.expectedContainerState ? 'Service Healthy' : 'Service Unhealthy'}
                                    >
                                        <Stack gap={0}>
                                            <Text
                                                fz={'.75rem'}
                                                c="dimmed"
                                            >
                                                Expected {service.expectedContainerState}
                                            </Text>
                                            <Text>
                                                {service.actualContainerState} as of {new Date(service.lastUpdated).toLocaleString()}
                                            </Text>
                                        </Stack>
                                    </Alert>
                                    <ConsoleLog
                                        title="Container Log"
                                        log={service.containerLogs}
                                    />
                                </Fieldset>
                            );
                        })}
                    </Stack>
                    <ConsoleLog
                        title="Deployment Log"
                        log={instance?.deploymentLog}
                    />
                </Stack>
            </Accordion.Panel>
        </Accordion.Item>
    );
};

export default ProjectDeployPage;
