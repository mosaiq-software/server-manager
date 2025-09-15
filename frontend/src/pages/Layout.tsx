import React, { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { AppShell, Avatar, Burger, Button, Center, Divider, Group, Loader, Modal, Space, Stack, Switch, Text, TextInput, Title } from '@mantine/core';
import RouterLink from '@/components/RouterLink';
import { useProjects } from '@/contexts/project-context';
import { Link, useNavigate } from 'react-router';
import { Project } from '@mosaiq/nsm-common/types';

const Layout = (props: { children: React.ReactNode }) => {
    const [opened, { toggle }] = useDisclosure();
    const projectCtx = useProjects();
    const navigate = useNavigate();
    const [modal, setModal] = useState<'create' | null>(null);
    const [creatingProject, setCreatingProject] = useState(false);
    const [newProject, setNewProject] = useState<Project>({
        id: '',
        repoOwner: 'mosaiq-software',
        repoName: '',
        repoBranch: '',
        allowCICD: false,
    });

    return (
        <>
            <Modal
                opened={modal === 'create'}
                onClose={() => setModal(null)}
                withCloseButton={false}
                closeOnClickOutside={!creatingProject}
            >
                {creatingProject ? (
                    <Center>
                        <Stack align="center">
                            <Loader />
                            <Text>Creating project...</Text>
                        </Stack>
                    </Center>
                ) : (
                    <Stack>
                        <Title order={3}>Create Project</Title>
                        <TextInput
                            label="Project ID"
                            placeholder="terrazzo"
                            description="The unique identifier for the project. Cannot be changed later."
                            value={newProject?.id || ''}
                            onChange={(e) => setNewProject({ ...newProject, id: e.target.value })}
                        />
                        <TextInput
                            label="Repo Owner"
                            placeholder="mosaiq-software"
                            description="As seen in the URL"
                            value={newProject?.repoOwner || ''}
                            onChange={(e) => setNewProject({ ...newProject, repoOwner: e.target.value })}
                        />
                        <TextInput
                            label="Repo Name"
                            placeholder="terrazzo-api"
                            description="As seen in the URL"
                            value={newProject?.repoName || ''}
                            onChange={(e) => setNewProject({ ...newProject, repoName: e.target.value })}
                        />
                        <TextInput
                            label="Repo Branch"
                            placeholder="main"
                            description="The branch to deploy from. Defaults to repo default branch if not set."
                            value={newProject?.repoBranch || ''}
                            onChange={(e) => setNewProject({ ...newProject, repoBranch: e.target.value })}
                        />
                        {newProject.repoOwner && newProject.repoName && (
                            <Link
                                to={`https://github.com/${newProject.repoOwner}/${newProject.repoName}`}
                                target="_blank"
                            >{`https://github.com/${newProject.repoOwner}/${newProject.repoName}`}</Link>
                        )}
                        <Switch
                            label="Allow CI/CD"
                            checked={newProject?.allowCICD || false}
                            onChange={(e) => setNewProject({ ...newProject, allowCICD: e.currentTarget.checked })}
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
                                    setCreatingProject(true);
                                    await projectCtx.create(newProject);
                                    await new Promise((resolve) => setTimeout(resolve, 1000));
                                    setCreatingProject(false);
                                    setModal(null);
                                    navigate(`/p/${newProject.id}`);
                                }}
                            >
                                Create
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
            <AppShell
                padding="md"
                header={{ height: 60 }}
                navbar={{
                    width: 300,
                    breakpoint: 'sm',
                    collapsed: { mobile: !opened },
                }}
            >
                <AppShell.Header>
                    <Burger
                        opened={opened}
                        onClick={toggle}
                        hiddenFrom="sm"
                        size="sm"
                    />

                    <Group
                        h="100%"
                        align="center"
                        px="1rem"
                    >
                        <Avatar src="/assets/MosaiqLogo.png" />
                        <Text>
                            <span style={{ fontWeight: '900' }}>N</span>ode <span style={{ fontWeight: '900' }}>S</span>erver <span style={{ fontWeight: '900' }}>M</span>anager
                        </Text>
                    </Group>
                </AppShell.Header>

                <AppShell.Navbar p="md">
                    <RouterLink
                        to="/"
                        label="Dashboard"
                        showActive
                    />
                    <RouterLink
                        to="/workers"
                        label="Workers"
                        showActive
                    />
                    <RouterLink
                        to="/control-plane"
                        label="Control Plane"
                    />
                    <Divider
                        w="80%"
                        mx="auto"
                        my="sm"
                    />
                    {projectCtx.projects.map((project) => (
                        <RouterLink
                            to={`/p/${project.id}`}
                            label={`${project.id} (${project.state})`}
                            key={project.id}
                            showActive
                        >
                            <RouterLink
                                to={`/p/${project.id}/config`}
                                label="Config"
                                showActive
                            />
                            <RouterLink
                                to={`/p/${project.id}/deploy`}
                                label="Deploy"
                                showActive
                            />
                            <RouterLink
                                to={`/p/${project.id}/logs`}
                                label="Logs"
                                showActive
                            />
                        </RouterLink>
                    ))}
                    <Space h="md" />
                    <Button
                        onClick={() => setModal('create')}
                        variant="outline"
                    >
                        Create Project
                    </Button>
                </AppShell.Navbar>

                <AppShell.Main>{props.children}</AppShell.Main>
            </AppShell>
        </>
    );
};

export default Layout;
