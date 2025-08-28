import { Button, Center, Divider, Fieldset, Group, Loader, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';
import { DeploymentState, Project } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost } from '@/utils/api';
import {EditableTextInput} from "@/components/EditableTextInput";
import { useProjects } from '@/contexts/project-context';
import { ProjectHeader } from '@/components/ProjectHeader';

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
            <Group>
                <EditableTextInput label="Run Command" value={project.runCommand} onChange={(value) => projectCtx.update(project.id, { runCommand: value })} />
                <EditableTextInput label="Repository Name" value={project.repoName} onChange={(value) => projectCtx.update(project.id, { repoName: value })} />
                <EditableTextInput label="Repository Owner" value={project.repoOwner} onChange={(value) => projectCtx.update(project.id, { repoOwner: value })} />
            </Group>
            <Divider my="sm" />
            <Title order={5}>Environment Variables</Title>
            <Stack>
                {
                    project.envs?.map(env => {
                        return (
                            <Fieldset key={env.env} legend={env.env}>
                            {
                                env.secrets.map(secret => {
                                    return (
                                        <EditableTextInput
                                            key={secret.secretName}
                                            label={secret.secretName}
                                            value={secret.secretValue}
                                            onChange={(value) => projectCtx.updateSecret(project.id, env.env, secret.secretName, value)}
                                        />
                                    )
                                })
                            }
                            </Fieldset>
                        )
                    })
                }
            </Stack>
        </Stack>
    );
};

export default ProjectConfigPage;
