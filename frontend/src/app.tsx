import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';
import { UserProvider } from '@/contexts/user-context';
import { ProjectProvider } from '@/contexts/project-context';
import { WorkerProvider } from '@/contexts/worker-context';
import { createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
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
                        <WorkerProvider>
                            <Router />
                        </WorkerProvider>
                    </ProjectProvider>
                </UserProvider>
            </BrowserRouter>
        </MantineProvider>
    );
};

export default App;
