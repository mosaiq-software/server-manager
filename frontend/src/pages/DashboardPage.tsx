import { useProjects } from '@/contexts/project-context';
import { useUser } from '@/contexts/user-context';
import { Button, Card, Center, Container, Group, Loader, Modal, Stack, TextInput, Title, Text, Switch } from '@mantine/core';
import { DeploymentState, Project } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

const DashboardPage = () => {
    const [queryParams, setQueryParams] = useSearchParams();
    const token = queryParams.get('token');
    const userCtx = useUser();

    useEffect(() => {
        if (token) {
            userCtx.startSession(token);
            setQueryParams({});
        }
    }, [token]);

    return (
        <Container>
            <Title>NSM</Title>
            <Stack></Stack>
        </Container>
    );
};

export default DashboardPage;
