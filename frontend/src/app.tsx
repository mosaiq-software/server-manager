import { UserProvider } from '@/contexts/user-context';
import { ProjectProvider } from "@/contexts/project-context";
import { createTheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Router from './router';

const theme = createTheme({});

const App = () => {
    return (
        <MantineProvider
            theme={theme}
            defaultColorScheme="light"
        >
            <BrowserRouter>
                <Notifications />
                <UserProvider>
                    <ProjectProvider>
                        <Router />
                    </ProjectProvider>
                </UserProvider>
            </BrowserRouter>
        </MantineProvider>
    );
};

export default App;
