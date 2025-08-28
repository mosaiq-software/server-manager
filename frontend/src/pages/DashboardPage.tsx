import { Button, Card, Center, Container, Group, Loader, Modal, Stack, TextInput, Title, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';
import { DeploymentState, Project } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost } from '@/utils/api';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [modal, setModal] = useState<'create' | null>(null);
    const [newProject, setNewProject] = useState<Project>({
        id: '',
        repoOwner: 'mosaiq-software',
        repoName: '',
        runCommand: 'npm run deploy',
    });
    const [projects, setProjects] = useState<Partial<Project>[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await apiGet(API_ROUTES.GET_PROJECTS, {}, 'AUTH TOKEN...');
                if (!response) {
                    return;
                }
                setProjects(response);
            } catch (error) {
                notifications.show({
                    title: 'Error',
                    message: 'Failed to fetch projects',
                    color: 'red',
                });
            }
        };
        fetchProjects();
    }, []);

    const handleCreateProject = async () => {
        try {
            await apiPost(API_ROUTES.POST_CREATE_PROJECT, {}, newProject, 'AUTH TOKEN...');
            notifications.show({
                title: 'Success',
                message: 'Project created successfully',
                color: 'green',
            });
            setModal(null);
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to create project',
                color: 'red',
            });
        }
    };

    let ModalComponent: JSX.Element | null = null;

    if (modal === 'create') {
        ModalComponent = (
            <Modal
                opened={true}
                onClose={() => setModal(null)}
            >
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
                    {newProject.repoOwner && newProject.repoName && <Link to={`https://github.com/${newProject.repoOwner}/${newProject.repoName}`}>{`https://github.com/${newProject.repoOwner}/${newProject.repoName}`}</Link>}
                    <TextInput
                        label="Deployment Command"
                        placeholder="npm run deploy"
                        description="Can use node, npm, docker, or shell"
                        value={newProject?.runCommand || ''}
                        onChange={(e) => setNewProject({ ...newProject, runCommand: e.target.value })}
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
                            onClick={handleCreateProject}
                        >
                            Create
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        );
    }

    return (
        <Container>
            {ModalComponent}
            <Title>NSM</Title>
            <Button onClick={() => setModal('create')}>Create Project</Button>
            <Stack>
                {projects.map((project) => (
                    <Card
                        key={project.id}
                        onClick={() => {
                            navigate(`/p/${project.id}`);
                        }}
                    >
                        <Title order={4}>{project.id}</Title>
                        <Text>{`https://github.com/${project.repoOwner}/${project.repoName}`}</Text>
                        <Text>{project.state}</Text>
                    </Card>
                ))}
            </Stack>
        </Container>
    );
};

export default DashboardPage;
