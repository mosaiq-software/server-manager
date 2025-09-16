import { Center, Loader, Stack, Title } from '@mantine/core';
import { Project } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjects } from '@/contexts/project-context';
import { ProjectHeader } from '@/components/ProjectHeader';

const ProjectLogsPage = () => {
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
                section="Logs"
            />
        </Stack>
    );
};

export default ProjectLogsPage;
