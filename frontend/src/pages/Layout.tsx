import React from 'react';
import { useDisclosure } from '@mantine/hooks';
import { AppShell, Burger } from '@mantine/core';

const Layout = (props: { children: React.ReactNode }) => {
    const [opened, { toggle }] = useDisclosure();
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

                <div>Logo</div>
            </AppShell.Header>

            <AppShell.Navbar>Navbar</AppShell.Navbar>

            <AppShell.Main>{props.children}</AppShell.Main>
        </AppShell>
    );
};

export default Layout;
