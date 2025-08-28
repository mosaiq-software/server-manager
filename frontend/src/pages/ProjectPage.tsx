import { Button, Center, Loader, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';
import { Project } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {apiGet} from '@/utils/api';
const ProjectPage = () => {
    const params = useParams();
    const projectId = params.projectId;
    const [project, setProject] = useState<Project | undefined | null>(undefined);
    const navigate = useNavigate();

    useEffect(() => {
        const getProjectData = async () => {
            try {
                if (!projectId || projectId.trim().length === 0) {
                    return;
                }
                const data = await apiGet(API_ROUTES.GET_PROJECT, { projectId }, undefined);
                if (!data) {
                    setProject(null);
                    return;
                }
                setProject(data);
            } catch (e: any) {
                console.error('Error fetching project', projectId, e);
                notifications.show({ message: "Error getting the project's data", color: 'red' });
            }
        };
        getProjectData();
    }, [projectId]);

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

    return (
        <Stack>
            <Title>{project.id}</Title>
            <Text>Repository Owner: {project.repoOwner}</Text>
            <Text>Repository Name: {project.repoName}</Text>
            <Button
                onClick={() => {
                    notifications.show({ message: "Deploying project...", color: 'blue' });
                    apiGet(API_ROUTES.GET_DEPLOY, { projectId: project.id, key: project.deploymentKey ?? "" }, undefined)
                        .then(() => {
                            notifications.show({ message: "Project deployed successfully!", color: 'green' });
                        })
                        .catch(() => {
                            notifications.show({ message: "Error deploying project", color: 'red' });
                        });
                }}
            >
                Deploy
            </Button>
        </Stack>
    );
};

export default ProjectPage;

