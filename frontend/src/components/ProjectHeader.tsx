import { Group, Stack, Title } from '@mantine/core';
import { Project } from '@mosaiq/nsm-common/types';
import React from 'react';
import { Link } from 'react-router';

interface ProjectHeaderProps {
    project: Project;
    section: string;
}
export const ProjectHeader = (props: ProjectHeaderProps) => {
    return (
        <Stack>
            <Group>
                <Title order={1}>{props.project.id}</Title>
                <Link to={`https://github.com/${props.project.repoOwner}/${props.project.repoName}`} target='_blank'>
                    View on GitHub
                </Link>
            </Group>
            <Title order={3}>{props.section}</Title>
        </Stack>
    );
};
