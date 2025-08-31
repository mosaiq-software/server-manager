import { Alert, Button, Center, CopyButton, Divider, Fieldset, Grid, Group, Loader, Stack, Switch, Table, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { API_ROUTES } from '@mosaiq/nsm-common/routes';
import { DeploymentState, Project } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPost } from '@/utils/api';
import { EditableTextInput } from '@/components/EditableTextInput';
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
            <ProjectHeader
                project={project}
                section="Configuration"
            />
            {project.dirtyConfig && (
                <Alert
                    variant="light"
                    color="yellow"
                    title="Configs Changed"
                >
                    Some configurations have been changed since the last deployment. Redeploy to apply the new settings.
                </Alert>
            )}
            <Title order={5}>General</Title>
            <Group align="flex-start">
                <EditableTextInput
                    label="Repository Name"
                    value={project.repoName}
                    onChange={(value) => projectCtx.update(project.id, { repoName: value })}
                    orientation="vertical"
                />
                <EditableTextInput
                    label="Repository Owner"
                    value={project.repoOwner}
                    onChange={(value) => projectCtx.update(project.id, { repoOwner: value })}
                    orientation="vertical"
                />
                <Switch
                    label="Allow CI/CD"
                    checked={project.allowCICD}
                    onChange={(e) => projectCtx.update(project.id, { allowCICD: e.currentTarget.checked })}
                />
                <EditableTextInput
                    label="Deployment Timeout (ms)"
                    value={project.timeout?.toString() || ''}
                    onChange={(value) => projectCtx.update(project.id, { timeout: value ? parseInt(value) : undefined })}
                    orientation="vertical"
                />
            </Group>
            <Divider my="sm" />
            <Title order={5}>Environment Variables</Title>
            <Stack>
                <Table>
                    <Table.Thead>
                        <Table.Th>Env Variable Name</Table.Th>
                        <Table.Th>Env Variable Value</Table.Th>
                    </Table.Thead>
                    {project.secrets?.map((secret) => {
                        return (
                            <Table.Tr key={secret.secretName}>
                                <Table.Td>
                                    <Title
                                        order={6}
                                        w="100%"
                                    >
                                        {secret.secretName}
                                    </Title>
                                </Table.Td>
                                <Table.Td>
                                    <EditableTextInput
                                        placeholder={secret.secretPlaceholder}
                                        value={secret.secretValue}
                                        onChange={(value) => projectCtx.updateSecret(project.id, secret.secretName, value)}
                                    />
                                </Table.Td>
                            </Table.Tr>
                        );
                    })}
                </Table>
            </Stack>
        </Stack>
    );
};

export default ProjectConfigPage;
