import React from 'react';
import { useDisclosure } from '@mantine/hooks';
import { AppShell, Avatar, Burger, Divider, Group, Text, Title } from '@mantine/core';
import RouterLink from '@/components/RouterLink';
import { useProjects } from '@/contexts/project-context';

const Layout = (props: { children: React.ReactNode }) => {
    const [opened, { toggle }] = useDisclosure();
    const projectCtx = useProjects();

    return (
        <AppShell
            padding="md"
            header={{ height: 60 }}
            navbar={{
                width: 300,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
        >
            <AppShell.Header>
                <Burger
                    opened={opened}
                    onClick={toggle}
                    hiddenFrom="sm"
                    size="sm"
                />

                <Group
                    h="100%"
                    align="center"
                    px="1rem"
                >
                    <Avatar src="/assets/MosaiqLogo.png" />
                    <Text>
                        <span style={{ fontWeight: '900' }}>N</span>ode <span style={{ fontWeight: '900' }}>S</span>erver <span style={{ fontWeight: '900' }}>M</span>anager
                    </Text>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md">
                <RouterLink
                    to="/"
                    label="Dashboard"
                    showActive
                />
                <Divider
                    w="80%"
                    mx="auto"
                    my="sm"
                />
                {projectCtx.projects.map((project) => (
                    <RouterLink
                        to={`/p/${project.id}`}
                        label={`${project.id} (${project.state})`}
                        key={project.id}
                        showActive
                    >
                        <RouterLink
                            to={`/p/${project.id}/config`}
                            label="Config"
                            showActive
                        />
                        <RouterLink
                            to={`/p/${project.id}/deploy`}
                            label="Deploy"
                            showActive
                        />
                        <RouterLink
                            to={`/p/${project.id}/logs`}
                            label="Logs"
                            showActive
                        />
                    </RouterLink>
                ))}
            </AppShell.Navbar>

            <AppShell.Main>{props.children}</AppShell.Main>
        </AppShell>
    );
};

export default Layout;
