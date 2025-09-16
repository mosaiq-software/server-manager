import { Center, Loader, Stack, Title } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProjects } from '@/contexts/project-context';
import { ProjectHeader } from '@/components/ProjectHeader';
import { Project } from '@mosaiq/nsm-common/types';

const ProjectPage = () => {
    const params = useParams();
    const projectId = params.projectId;
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
                section="Overview"
            />
        </Stack>
    );
};

export default ProjectPage;
