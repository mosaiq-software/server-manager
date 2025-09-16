import { useUser } from '@/contexts/user-context';
import { Button, Card, Center, Container, Group, Loader, Modal, Stack, TextInput, Title, Text, Switch } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { DeploymentState, Project } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

const LandingPage = () => {
    const [queryParams, setQueryParams] = useSearchParams();
    const token = queryParams.get('token');
    const error = queryParams.get('error');
    const userCtx = useUser();

    useEffect(() => {
        if (token) {
            userCtx.startSession(token);
            setQueryParams({});
        }
        if (error) {
            const error_description = queryParams.get('error_description');
            notifications.show({
                title: 'Authentication Error',
                message: `There was an error during authentication: ${error_description || error}`,
                color: 'red',
            });
            setQueryParams({});
        }
    }, [token, error]);

    return (
        <Container>
            <Stack>
                <Title ta="center">Node Server Manager</Title>
                <Text ta="center">Manage your server projects with ease.</Text>
                <Button onClick={() => userCtx.signIn()}>Sign In with GitHub</Button>
            </Stack>
        </Container>
    );
};

export default LandingPage;
