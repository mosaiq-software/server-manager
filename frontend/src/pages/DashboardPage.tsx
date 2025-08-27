import { Button, Card, Center, Container, Group, Loader, Modal, Stack, TextInput, Title, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';
import { DeploymentState, Project } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {apiGet, apiPost} from '@/utils/api';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [modal, setModal] = useState<'create' | null>(null);
    const [newProject, setNewProject] = useState<Project>({
        id: '',
        repositoryUrl: '',
        deploymentKey: '',
        runCommand: '',
        state: DeploymentState.READY
    });
    const [projects, setProjects] = useState<Partial<Project>[]>([]);

    useEffect(()=>{
        const fetchProjects = async () => {
            try{

                const response = await apiGet(API_ROUTES.GET_PROJECTS, {}, "AUTH TOKEN...");
                if(!response){
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
            await apiPost(API_ROUTES.POST_CREATE_PROJECT, {}, {id: newProject.id, repoUrl: newProject.repositoryUrl, runCommand: newProject.runCommand}, "AUTH TOKEN...");
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
            <Modal opened={true} onClose={() => setModal(null)}>
                <Title>Create Project</Title>
                <TextInput
                    label="Project Slug (Can't be changed later)"
                    placeholder='terrazzo'
                    value={newProject?.id || ''}
                    onChange={(e) => setNewProject({ ...newProject, id: e.target.value })}
                />
                <TextInput
                    label="Repo URL"
                    placeholder='https://github.com/...'
                    value={newProject?.repositoryUrl || ''}
                    onChange={(e) => setNewProject({ ...newProject, repositoryUrl: e.target.value })}
                />
                <TextInput
                    label="Run Command"
                    placeholder='npm run deploy'
                    value={newProject?.runCommand || ''}
                    onChange={(e) => setNewProject({ ...newProject, runCommand: e.target.value })}
                />
                <Group justify='space-between' >
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
            </Modal>
        );
    }
    
    return (
        <Container>
            {ModalComponent}
            <Title>NSM</Title>
            <Button onClick={() => setModal('create')}>
                Create Project
            </Button>
            <Stack>
                {
                    projects.map((project) => (
                        <Card key={project.id}
                            onClick={()=>{
                                navigate(`/p/${project.id}`);
                            }}
                        >
                            <Title order={4}>{project.id}</Title>
                            <Text>{project.repositoryUrl}</Text>
                            <Text>{project.state}</Text>
                        </Card>
                    ))
                }
            </Stack>
        </Container>
    );
};

export default DashboardPage;

