import { Button, Center, CopyButton, Divider, Fieldset, Grid, Group, Loader, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';
import { DeploymentState, Project } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost } from '@/utils/api';
import {EditableTextInput} from "@/components/EditableTextInput";
import { useProjects } from '@/contexts/project-context';
import { ProjectHeader } from '@/components/ProjectHeader';
import { T } from 'node_modules/react-router/dist/development/index-react-server-client-DXb0OgpJ.mjs';
import { assembleDotenv } from '@mosaiq/nsm-common/secretUtil';

const ProjectConfigPage = () => {
    const params = useParams();
    const projectId = params.projectId;
    const navigate = useNavigate();
    const projectCtx = useProjects();
    const [project, setProject] = useState<Project | undefined | null>(undefined);

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

    return (
        <Stack>
            <ProjectHeader project={project} section='Configuration'/>
                <Title order={5}>General</Title>
            <Group align='flex-start'>
                <EditableTextInput label="Run Command" value={project.runCommand} onChange={(value) => projectCtx.update(project.id, { runCommand: value })} orientation='vertical'/>
                <EditableTextInput label="Repository Name" value={project.repoName} onChange={(value) => projectCtx.update(project.id, { repoName: value })} orientation='vertical'/>
                <EditableTextInput label="Repository Owner" value={project.repoOwner} onChange={(value) => projectCtx.update(project.id, { repoOwner: value })} orientation='vertical'/>
            </Group>
            <Divider my="sm" />
            <Title order={5}>Environment Variables</Title>
            <Stack>
                {
                    project.envs?.map(env => {
                        const envString = assembleDotenv(env.secrets);
                        return (
                            <Stack key={env.env} bd="1px solid #eee" bdrs="sm" p="md">
                                <Group>
                                    <Title order={5} >{env.env}</Title>
                                    <CopyButton value={envString}>
                                    {({ copied, copy }) => (
                                        <Button color={copied ? 'teal' : 'blue'} onClick={copy} variant="light" size="xs">
                                        {copied ? 'Copied .env' : 'Copy .env'}
                                        </Button>
                                    )}
                                    </CopyButton>
                                </Group>
                                <Grid align="center">
                                {
                                    env.secrets.map(secret => {
                                        return (
                                            <>
                                                <Grid.Col key={secret.secretName} span={3}>
                                                    <Title order={6} w="100%" ta="right">{secret.secretName}</Title>
                                                </Grid.Col>
                                                <Grid.Col span={9}>
                                                    <EditableTextInput
                                                        placeholder={secret.secretPlaceholder}
                                                        value={secret.secretValue}
                                                        onChange={(value) => projectCtx.updateSecret(project.id, env.env, secret.secretName, value)}
                                                    />
                                                </Grid.Col>
                                            </>
                                        )
                                    })
                                }
                                </Grid>
                            </Stack>
                        )
                    })
                }
            </Stack>
        </Stack>
    );
};

export default ProjectConfigPage;
