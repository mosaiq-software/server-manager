import { Accordion, ActionIcon, Box, Button, Center, CopyButton, Divider, Flex, Group, Loader, Modal, PasswordInput, Stack, Text, TextInput, Title, Code } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';
import { DeployLogHeader, DeploymentState, Project } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost } from '@/utils/api';
import {EditableTextInput} from "@/components/EditableTextInput";
import { useProjects } from '@/contexts/project-context';
import { ProjectHeader } from '@/components/ProjectHeader';
import { DeploymentStateIcons } from '@/utils/statusUtils';
import { MdOutlineCheckBox, MdOutlineDelete, MdOutlineFileCopy, MdOutlineLaunch, MdOutlineRefresh, MdOutlineRocket, MdOutlineRocketLaunch } from 'react-icons/md';
import { useThrottledCallback } from '@mantine/hooks';

const ProjectDeployPage = () => {
    const params = useParams();
    const projectId = params.projectId;
    const navigate = useNavigate();
    const projectCtx = useProjects();
    const [project, setProject] = useState<Project | undefined | null>(undefined);
        const [modal, setModal] = useState<'reset-key' | 'deploy' | 'teardown' | null>(null);

    useEffect(() => {
        const foundProject = projectCtx.projects.find((proj) => proj.id === projectId);
        setProject(foundProject);
    }, [projectId, projectCtx.projects]);


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
        if(!project) return;
        notifications.show({ message: 'Deploying project...', color: 'blue' });
        const status = await apiGet(API_ROUTES.GET_DEPLOY_WEB, { projectId: project.id, key: project.deploymentKey ?? '' }, undefined)
        if(status === DeploymentState.ACTIVE) {
            notifications.show({ message: 'Deployment successful!', color: 'green' });
            return;
        }
        if(status === DeploymentState.FAILED) {
            notifications.show({ message: 'Deployment failed!', color: 'red' });
            return;
        }
        notifications.show({ message: 'Deployment status unknown...', color: 'yellow' });
    };

    const handleResetDeployKey = async () => {
        if(!project) return;
        notifications.show({ message: 'Resetting deployment key...', color: 'blue' });
        const newKey = await apiPost(API_ROUTES.POST_RESET_DEPLOYMENT_KEY, { projectId: project.id }, {}, "AUTH TOKEN...");
        if(!newKey) {
            notifications.show({ message: 'Failed to reset deployment key!', color: 'red' });
            return;
        }
        notifications.show({ message: 'Deployment key reset successful!', color: 'green' });
        projectCtx.update(project.id, { deploymentKey: newKey });
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
                            onClick={()=>{
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
                    <Text>Are you sure you want to deploy the project?<br/>This will trigger a deployment. Errors may occur.</Text>
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
                            onClick={()=>{
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
                    <Text>Are you sure you want to teardown the project?<br/>This will take the project offline.</Text>
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
                            onClick={()=>{
                                handleTeardown();
                                setModal(null);
                            }}
                        >
                            Yes. Teardown The Project.
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <ProjectHeader project={project} section='Deployment'/>
            <Group>
                <Button onClick={() => setModal('deploy')} variant="light" color="green" leftSection={<MdOutlineRocketLaunch/>}>Deploy</Button>
                <Button onClick={() => setModal('teardown')} variant="light" color="red" leftSection={<MdOutlineDelete/>}>Teardown</Button>
            </Group>
            <Group align='flex-end' wrap='nowrap'>
               <PasswordInput
                   label="Deployment Key"
                   value={project.deploymentKey}
                   readOnly
                   w={"32ch"}
               />
               <CopyButton value={project.deploymentKey ?? ""}>
                {({ copied, copy }) => (
                    <ActionIcon 
                        variant={copied ? 'filled' : 'light'}
                        onClick={copy}
                        size='input-sm'
                    >
                        {copied ? <MdOutlineCheckBox/> :<MdOutlineFileCopy />}
                    </ActionIcon>
                )}
                </CopyButton>
                <Box flex={1} h="md" >
                    <Divider />
                </Box>

                <Button color="red" variant="light" onClick={() => setModal('reset-key')}>
                    Reset Key
                </Button>
            </Group>
            <Divider />
            <Title order={5}>Deployment Logs</Title>
            <Accordion>
                {
                    project.deployLogs?.map((log) => (
                        <DeployLogItem key={log.id} header={log} />
                    ))
                }
            </Accordion>
        </Stack>
    );
};

interface DeployLogItemProps {
    header: DeployLogHeader;
}
const DeployLogItem = (props: DeployLogItemProps) => {
    const [text, setText] = useState('');

    const handleGetText = useThrottledCallback(async (force?:boolean) => {
        if(text && !force) return; // Already fetched

        setText('Fetching log...');
        try{
            const log = await apiGet(API_ROUTES.GET_DEPLOY_LOG, { deployLogId: props.header.id }, "AUTH TOKEN...");
            if(!log?.log){
                setText("Failed to find log..");
                return;
            }
            const logText = log.log.replace("\r", "\n");
            setText(logText);
        } catch (error) {
            setText("Failed to fetch log..");
        }
    }, 1000);

    const date = new Date(props.header.createdAt).toLocaleString();

    return (
        <Accordion.Item value={props.header.id} onClick={() => handleGetText()}>
            <Accordion.Control>
                <Group justify='space-between'>
                    <Text>{date}</Text>
                    <Text>{DeploymentStateIcons[props.header.status ?? ""]} ({props.header.status})</Text>
                </Group>
            </Accordion.Control>
            <Accordion.Panel>
                <ActionIcon size='xs' onClick={() => handleGetText(true)}><MdOutlineRefresh /></ActionIcon>
                <Code block>{text}</Code>
            </Accordion.Panel>
        </Accordion.Item>
    );
}

export default ProjectDeployPage;
