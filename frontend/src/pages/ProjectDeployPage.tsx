import { Accordion, ActionIcon, Box, Button, Center, CopyButton, Divider, Flex, Group, Loader, Modal, PasswordInput, Stack, Text, TextInput, Title, Code, Tooltip, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';
import { DeployLogHeader, DeploymentState, Project } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost } from '@/utils/api';
import { EditableTextInput } from '@/components/EditableTextInput';
import { useProjects } from '@/contexts/project-context';
import { ProjectHeader } from '@/components/ProjectHeader';
import { MdOutlineCheckBox, MdOutlineDelete, MdOutlineFileCopy, MdOutlineInsertLink, MdOutlineKey, MdOutlineLaunch, MdOutlineRefresh, MdOutlineRocket, MdOutlineRocketLaunch } from 'react-icons/md';
import { useThrottledCallback } from '@mantine/hooks';

const ProjectDeployPage = () => {
    const params = useParams();
    const projectId = params.projectId;
    const navigate = useNavigate();
    const projectCtx = useProjects();
    const [project, setProject] = useState<Project | undefined | null>(undefined);
    const [modal, setModal] = useState<'reset-key' | 'deploy' | 'teardown' | null>(null);
    const [openDeploymentLog, setOpenDeploymentLog] = useState<string | null>(null);
    const [currentDeploymentLogId, setCurrentDeploymentLogId] = useState<string | undefined>(undefined);
    const [currentDeploymentLog, setCurrentDeploymentLog] = useState<DeployLogHeader | undefined>(undefined);

    useEffect(() => {
        const foundProject = projectCtx.projects.find((proj) => proj.id === projectId);
        setProject(foundProject);
    }, [projectId, projectCtx.projects]);

    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (currentDeploymentLogId) {
                const log = await apiGet(API_ROUTES.GET_DEPLOY_LOG, { deployLogId: currentDeploymentLogId }, 'AUTH TOKEN...');
                if (!log) return;
                setCurrentDeploymentLog({ ...log });
                if (log?.status !== DeploymentState.DEPLOYING) {
                    clearInterval(intervalId);
                }
            }
        }, 2000);
        return () => clearInterval(intervalId);
    }, [currentDeploymentLogId]);

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
        const newLogId = await apiGet(API_ROUTES.GET_DEPLOY_WEB, { projectId: project.id, key: project.deploymentKey ?? '' }, undefined);
        if (!newLogId) {
            notifications.show({ message: 'Failed to get deployment log ID. Reload to see log', color: 'yellow' });
        } else {
            setOpenDeploymentLog(newLogId);
            setCurrentDeploymentLogId(newLogId);
        }
        projectCtx.update(project.id, { dirtyConfig: false }, true);
    };

    const handleResetDeployKey = async () => {
        if (!project) return;
        notifications.show({ message: 'Resetting deployment key...', color: 'blue' });
        const newKey = await apiPost(API_ROUTES.POST_RESET_DEPLOYMENT_KEY, { projectId: project.id }, {}, 'AUTH TOKEN...');
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
                    disabled={!project.hasDockerCompose}
                >
                    Deploy
                </Button>
                <Button
                    onClick={() => setModal('teardown')}
                    variant="light"
                    color="red"
                    leftSection={<MdOutlineDelete />}
                    disabled={!project.hasDockerCompose}
                >
                    Teardown
                </Button>
                {!project.hasDockerCompose && (
                    <Alert
                        color="red"
                        variant="filled"
                        title="Undeployable Project"
                    >
                        This project does not have a Docker Compose file configured.
                    </Alert>
                )}
            </Group>
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
            <Title order={5}>Deployment Logs</Title>
            <Accordion
                value={openDeploymentLog}
                onChange={setOpenDeploymentLog}
            >
                {[currentDeploymentLog, ...(project.deployLogs ?? [])].map(
                    (log) =>
                        log && (
                            <DeployLogItem
                                key={log.id}
                                header={log}
                            />
                        )
                )}
            </Accordion>
        </Stack>
    );
};

interface DeployLogItemProps {
    header: DeployLogHeader;
}
const DeployLogItem = (props: DeployLogItemProps) => {
    const [text, setText] = useState((props.header as any).log ?? '');
    const handleGetText = async (force?: boolean) => {
        if ((text && !force) || text === 'Fetching log...') return; // Already fetched

        setText('Fetching log...');
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            const log = await apiGet(API_ROUTES.GET_DEPLOY_LOG, { deployLogId: props.header.id }, 'AUTH TOKEN...');
            if (!log?.log) {
                setText('Failed to find log..');
                return;
            }
            const logText = log.log.replace('\r', '\n');
            setText(logText);
        } catch (error) {
            setText('Failed to fetch log..');
        }
    };

    const date = new Date(props.header.createdAt).toLocaleString();

    return (
        <Accordion.Item
            value={props.header.id}
            onClick={() => handleGetText()}
        >
            <Accordion.Control>
                <Group justify="space-between">
                    <Text>{date}</Text>
                    <Text>({props.header.status})</Text>
                </Group>
            </Accordion.Control>
            <Accordion.Panel>
                <ActionIcon
                    size="xs"
                    onClick={() => handleGetText(true)}
                >
                    <MdOutlineRefresh />
                </ActionIcon>
                <Code block>{text}</Code>
            </Accordion.Panel>
        </Accordion.Item>
    );
};

export default ProjectDeployPage;
