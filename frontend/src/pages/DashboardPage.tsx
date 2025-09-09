import { useProjects } from '@/contexts/project-context';
import { Button, Card, Center, Container, Group, Loader, Modal, Stack, TextInput, Title, Text, Switch } from '@mantine/core';
import { DeploymentState, Project } from '@mosaiq/nsm-common/types';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const DashboardPage = () => {
    return (
        <Container>
            <Title>NSM</Title>
            <Stack></Stack>
        </Container>
    );
};

export default DashboardPage;
