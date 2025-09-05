import { useProjects } from '@/contexts/project-context';
import { Button, Card, Center, Container, Group, Loader, Modal, Stack, TextInput, Title, Text, Switch } from '@mantine/core';
import { DeploymentState, Project } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [modal, setModal] = useState<'create' | null>(null);
    const [newProject, setNewProject] = useState<Project>({
        id: '',
        repoOwner: 'mosaiq-software',
        repoName: '',
        repoBranch: '',
        allowCICD: false,
    });
    const projectCtx = useProjects();

    return (
        <Container>
            <Modal
                opened={modal === 'create'}
                onClose={() => setModal(null)}
                withCloseButton={false}
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
                                await projectCtx.create(newProject);
                                await new Promise((resolve) => setTimeout(resolve, 1000));
                                navigate(`/p/${newProject.id}`);
                            }}
                        >
                            Create
                        </Button>
                    </Group>
                </Stack>
            </Modal>
            <Title>NSM</Title>
            <Button onClick={() => setModal('create')}>Create Project</Button>
            <Stack></Stack>
        </Container>
    );
};

export default DashboardPage;
